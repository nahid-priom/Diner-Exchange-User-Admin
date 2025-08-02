import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

/**
 * Admin Schema - Manages admin users, login security, and permissions.
 */
const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) =>
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(v),
        message: "Please enter a valid email address",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Don't return password by default
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "support", "manager"],
      default: "support",
    },
    permissions: {
      canViewOrders: { type: Boolean, default: true },
      canEditOrders: { type: Boolean, default: false },
      canDeleteOrders: { type: Boolean, default: false },
      canViewCustomers: { type: Boolean, default: true },
      canEditCustomers: { type: Boolean, default: false },
      canViewAnalytics: { type: Boolean, default: true },
      canManageAdmins: { type: Boolean, default: false },
      canViewAuditLog: { type: Boolean, default: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

// --- Indexes ---
AdminSchema.index({ email: 1 });
AdminSchema.index({ role: 1 });
AdminSchema.index({ isActive: 1 });

// --- Virtuals ---
AdminSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// --- Middleware: Password Hashing ---
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcryptjs.genSalt(12);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// --- Instance Methods ---

/** Compare candidate password to stored hash */
AdminSchema.methods.comparePassword = function (candidatePassword) {
  return bcryptjs.compare(candidatePassword, this.password);
};

/** Check if account is locked */
AdminSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

/** Increment login attempts and lock if necessary */
AdminSchema.methods.incLoginAttempts = function () {
  // If lock expired, reset
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  // Lock account if exceeded limit
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2h
  }
  return this.updateOne(updates);
};

/** Reset login attempts and record successful login */
AdminSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() },
  });
};

// --- Export Model, Hot-Reload Safe for Next.js ---
export default mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
