import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { sendMagicLink } from "@/utils/magicLink";

export async function POST(request) {
  const { email } = await request.json();

  if (!email) {
    return new Response(JSON.stringify({ error: "Email required" }), { status: 400 });
  }

  await dbConnect();
  let user = await User.findOne({ email });

  // Get client IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]
    || request.headers.get("x-real-ip")
    || "";

  // If user exists and IP matches, log in instantly
  if (user && Array.isArray(user.trustedIPs) && user.trustedIPs.includes(ip)) {
    // TODO: Set auth cookie/session here!
    // Optionally, also save this login event, update lastLogin, etc.
    return new Response(JSON.stringify({ autoLoggedIn: true }), { status: 200 });
  }

  // If user does NOT exist, create it
  if (!user) {
    user = await User.create({ email, trustedIPs: [] });
  }

  // Send magic link
  const sent = await sendMagicLink(email); // Must implement this function!
  if (sent) {
    return new Response(JSON.stringify({ magicLinkSent: true }), { status: 200 });
  } else {
    return new Response(JSON.stringify({ error: "Failed to send magic link" }), { status: 500 });
  }
}
