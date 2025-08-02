import { Resend } from "resend";
import crypto from "crypto";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Store tokens in DB in production; here just create a simple token
export async function sendMagicLink(email) {
  // 1. Generate a unique token
  const token = crypto.randomBytes(32).toString("hex");

  // 2. Store token & email association in your database with expiry
  //    You can use a MagicLink model, or update user with a loginToken + expiresAt
  //    Example: await User.updateOne({ email }, { loginToken: token, tokenExpires: Date.now() + 10 * 60 * 1000 });

  // 3. Create the magic link (replace with your real domain)
  const magicLink = `${process.env.NEXT_PUBLIC_BASE_URL}/user/magic-login?token=${token}&email=${encodeURIComponent(email)}`;

  // 4. Send the email using Resend
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: email,
      subject: "Your Magic Login Link",
      html: `
        <h2>Sign in to Dinar Exchange</h2>
        <p>Click the link below to sign in (valid for 10 minutes):</p>
        <a href="${magicLink}">${magicLink}</a>
        <br/>
        <small>If you did not request this, please ignore this email.</small>
      `,
    });
    // TODO: Save the token in the DB as described above!
    return true;
  } catch (err) {
    console.error("Failed to send magic link:", err);
    return false;
  }
}
