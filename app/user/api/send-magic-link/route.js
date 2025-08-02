import { NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Simple email validation
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required." },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectDB();

    // Find existing user or create a new one
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = new User({
        email: email.toLowerCase(),
      });
    }

    // Generate or reuse a magic key
    if (!user.magicKey) {
      user.magicKey = crypto.randomBytes(32).toString("hex");
    }

    // Save user
    await user.save();

    // Build the magic link
    const magicLink = `${process.env.BASE_URL}/user/magic-login?key=${user.magicKey}`;

    const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; background: #f8fafc; max-width: 520px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; border: 1px solid #e0e7ef;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="font-size: 2rem; color: #2d3748; margin: 0;">Dinar Exchange</h1>
    </div>
    <div style="background: #fff; border-radius: 12px; padding: 24px 16px 16px 16px; box-shadow: 0 2px 8px #0001;">
      <h2 style="color: #4F46E5; margin-bottom: 18px; font-size: 1.3rem;">Sign In to Your Account</h2>
      <p style="color: #374151; font-size: 1rem; margin-bottom: 18px;">
        Hello,
        <br/>
        To securely access your Dinar Exchange account, click the button below:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${magicLink}"
          style="background: linear-gradient(90deg, #6366f1, #4F46E5); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 1rem; display: inline-block; letter-spacing: .02em;">
          Log In Now
        </a>
      </div>
      <p style="color: #6b7280; font-size: 0.98rem; margin: 0 0 20px 0;">Or copy and paste this link into your browser:</p>
      <p style="background: #f3f4f6; color: #374151; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 0.98rem;">
        <a href="${magicLink}" style="color: #4F46E5;">${magicLink}</a>
      </p>
    </div>
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center;">
      <strong style="display:block; margin-bottom: 5px;">Security Tips:</strong>
      <ul style="list-style: disc; margin: 0 0 10px 20px; text-align: left; color: #64748b;">
        <li>This login link is unique to your account and should not be shared.</li>
        <li>If you did not request this email, you can safely ignore and delete it.</li>
      </ul>
      <div style="margin-top: 8px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} Dinar Exchange. All rights reserved.
      </div>
    </div>
  </div>
`;

    // Send the magic link email using Resend
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your Magic Login Link",
      html,
    });

    return NextResponse.json(
      { message: "Magic link sent successfully", email: email.toLowerCase() },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send magic link error:", error);
    return NextResponse.json(
      { error: "Failed to send magic link. Please try again." },
      { status: 500 }
    );
  }
}
