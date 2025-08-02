import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request) {
  const { email } = await request.json();

  if (!email) {
    return new Response(JSON.stringify({ error: "Email required" }), { status: 400 });
  }

  await dbConnect();
  let user = await User.findOne({ email: email.toLowerCase() });

  // If user does NOT exist, create it
  if (!user) {
    user = await User.create({ email: email.toLowerCase(), trustedIPs: [] });
  }

  // You can set a session/cookie here if needed

  return new Response(
    JSON.stringify({
      loggedIn: true,
      userId: user._id,
      email: user.email,
    }),
    { status: 200 }
  );
}
