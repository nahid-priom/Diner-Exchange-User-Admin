import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { 
  extractIPAddress, 
  checkTrustedIP, 
  addTrustedIP, 
  checkRateLimit, 
  recordLoginAttempt 
} from '../../../../lib/ipUtils';

// Configure nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false, // Use TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Extract user's IP address for auto-login check
    const userIP = extractIPAddress(request);
    const userAgent = request.headers.get('user-agent');

    // Connect to MongoDB
    await connectDB();

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Create new user
      user = new User({
        email: email.toLowerCase(),
      });
    }

    // Security: Check rate limiting first
    const rateLimitCheck = checkRateLimit(user);
    if (!rateLimitCheck.allowed) {
      // Record failed attempt
      recordLoginAttempt(user, false);
      await user.save();

      const lockMessage = rateLimitCheck.reason === 'account_locked' 
        ? `Account temporarily locked. Try again after ${rateLimitCheck.resetTime.toLocaleTimeString()}`
        : 'Too many login attempts. Please try again in a few minutes.';

      return NextResponse.json(
        { error: lockMessage },
        { status: 429 }
      );
    }

    // IP-based auto-login check
    if (user.autoLoginEnabled !== false && user.trustedIPs && user.trustedIPs.length > 0) {
      const ipCheck = checkTrustedIP(userIP, user.trustedIPs);
      
      if (ipCheck.isMatch) {
        // Auto-login: IP matches trusted IP
        console.log(`Auto-login for ${email} from trusted IP ${userIP} (${ipCheck.matchType} match)`);
        
        // Update IP usage and record successful login
        addTrustedIP(user, userIP, userAgent);
        recordLoginAttempt(user, true);
        await user.save();

        // Create session cookie and return success
        const userInfo = {
          id: user._id,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };

        const response = NextResponse.json(
          { 
            message: 'Auto-login successful',
            user: userInfo,
            autoLogin: true,
            ipMatch: ipCheck.matchType
          },
          { status: 200 }
        );

        // Set authentication cookie
        response.cookies.set('auth-token', user._id.toString(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          path: '/',
        });

        return response;
      }
    }

    // No IP match - proceed with normal magic link flow
    console.log(`Magic link required for ${email} from IP ${userIP} (no trusted IP match)`);

    // Generate magic key if doesn't exist
    if (!user.magicKey) {
      user.magicKey = crypto.randomBytes(32).toString('hex');
    }

    // Record this as a login attempt (not failed, just requiring magic link)
    user.lastLoginAttempt = new Date();

    // Save user
    await user.save();

    // Create magic link
    const magicLink = `${process.env.BASE_URL}/user/magic-login?key=${user.magicKey}`;

    // Configure email
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your Magic Login Link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Your Magic Login Link</h2>
          
          <p>Hello,</p>
          
          <p>You requested a magic login link. Click the button below to securely log in to your account:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Login to Your Account
            </a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${magicLink}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p><strong>Important Security Notes:</strong></p>
            <ul>
              <li>This link is permanent and will work until you regenerate it</li>
              <li>Keep this link secure and don't share it with anyone</li>
              <li>If you didn't request this login link, please ignore this email</li>
            </ul>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { 
        message: 'Magic link sent successfully',
        email: email.toLowerCase(),
        autoLogin: false,
        userIP: userIP, // Optional: return for debugging (remove in production)
        requiresMagicLink: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Send magic link error:', error);
    
    // Return appropriate error message
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'An error occurred while processing your request' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to send magic link. Please try again.' },
      { status: 500 }
    );
  }
}