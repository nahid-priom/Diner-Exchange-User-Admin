import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "./mongodb";
import Admin from "../models/Admin";
import AuditLog from "../models/AuditLog";

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "admin-login",
      name: "Admin Login",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "admin@dinarexchange.co.nz",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials, req) {
        try {
          await dbConnect();

          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Find admin by email
          const admin = await Admin.findOne({
            email: credentials.email.toLowerCase(),
          }).select("+password");

          if (!admin) {
            // Log failed login attempt
            await AuditLog.create({
              adminId: null,
              action: "failed_login",
              category: "authentication",
              severity: "medium",
              status: "failed",
              details: {
                metadata: {
                  ipAddress: req?.headers?.["x-forwarded-for"] || req?.connection?.remoteAddress,
                  userAgent: req?.headers?.["user-agent"],
                },
                notes: `Failed login attempt for email: ${credentials.email}`,
              },
            });
            return null;
          }

          // Check if account is locked
          if (admin.isLocked()) {
            // Log locked account attempt
            await AuditLog.logAction(
              admin._id,
              "failed_login",
              "admin",
              admin._id,
              {
                metadata: {
                  ipAddress: req?.headers?.["x-forwarded-for"] || req?.connection?.remoteAddress,
                  userAgent: req?.headers?.["user-agent"],
                },
                notes: "Login attempt on locked account",
              }
            );
            return null;
          }

          // Check if account is active
          if (!admin.isActive) {
            await AuditLog.logAction(
              admin._id,
              "failed_login",
              "admin",
              admin._id,
              {
                metadata: {
                  ipAddress: req?.headers?.["x-forwarded-for"] || req?.connection?.remoteAddress,
                  userAgent: req?.headers?.["user-agent"],
                },
                notes: "Login attempt on inactive account",
              }
            );
            return null;
          }

          // Verify password
          const isValidPassword = await admin.comparePassword(credentials.password);
          
          if (!isValidPassword) {
            // Increment login attempts
            await admin.incLoginAttempts();
            
            // Log failed login
            await AuditLog.logAction(
              admin._id,
              "failed_login",
              "admin",
              admin._id,
              {
                metadata: {
                  ipAddress: req?.headers?.["x-forwarded-for"] || req?.connection?.remoteAddress,
                  userAgent: req?.headers?.["user-agent"],
                },
                notes: "Invalid password",
              }
            );
            return null;
          }

          // Reset login attempts on successful login
          await admin.resetLoginAttempts();

          // Log successful login
          await AuditLog.logAction(
            admin._id,
            "login",
            "admin",
            admin._id,
            {
              metadata: {
                ipAddress: req?.headers?.["x-forwarded-for"] || req?.connection?.remoteAddress,
                userAgent: req?.headers?.["user-agent"],
              },
              notes: "Successful login",
            }
          );

          // Return user object
          return {
            id: admin._id.toString(),
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName,
            role: admin.role,
            permissions: admin.permissions,
            isActive: admin.isActive,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.role = user.role;
        token.permissions = user.permissions;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.isActive = user.isActive;
      }

      // Check if admin still exists and is active on each request
      if (token?.sub) {
        try {
          await dbConnect();
          const admin = await Admin.findById(token.sub);
          
          if (!admin || !admin.isActive) {
            // Admin doesn't exist or is inactive, invalidate token
            return null;
          }

          // Update token with latest admin data
          token.role = admin.role;
          token.permissions = admin.permissions;
          token.firstName = admin.firstName;
          token.lastName = admin.lastName;
          token.isActive = admin.isActive;
        } catch (error) {
          console.error("JWT callback error:", error);
          return null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.permissions = token.permissions;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.isActive = token.isActive;
        session.user.fullName = `${token.firstName} ${token.lastName}`;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      // Additional sign-in checks can be added here
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to admin dashboard after login
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/admin/dashboard`;
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  events: {
    async signOut({ token }) {
      if (token?.sub) {
        try {
          await dbConnect();
          await AuditLog.logAction(
            token.sub,
            "logout",
            "admin",
            token.sub,
            {
              notes: "User signed out",
            }
          );
        } catch (error) {
          console.error("Logout audit log error:", error);
        }
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to check if user has permission
export function hasPermission(session, permission) {
  if (!session?.user?.permissions) return false;
  return session.user.permissions[permission] === true;
}

// Helper function to check if user has role
export function hasRole(session, roles) {
  if (!session?.user?.role) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(session.user.role);
}

// Helper function to check if user is admin or manager
export function isAdminOrManager(session) {
  return hasRole(session, ["admin", "manager"]);
}

// Helper function to check if user can perform action
export function canPerformAction(session, action) {
  const permissionMap = {
    viewOrders: "canViewOrders",
    editOrders: "canEditOrders",
    deleteOrders: "canDeleteOrders",
    viewCustomers: "canViewCustomers",
    editCustomers: "canEditCustomers",
    viewAnalytics: "canViewAnalytics",
    manageAdmins: "canManageAdmins",
    viewAuditLog: "canViewAuditLog",
  };

  const permission = permissionMap[action];
  if (!permission) return false;

  return hasPermission(session, permission);
}