import dbConnect from "@/lib/mongodb";
import UserOrder from "../../../../models/UserOrder";

// GET /user/api/orders?email=...
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), { status: 400 });
    }

    // email in URL will always be URL-encoded (browser standard)
    // decodeURIComponent will convert "%40" back to "@"
    const decodedEmail = decodeURIComponent(email);

    const orders = await UserOrder.find({ email: decodedEmail }).sort({ createdAt: -1 });

    return new Response(JSON.stringify({ orders }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GET /user/api/orders error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

// POST /user/api/orders
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();

    if (!body.email || !body.fullName || !body.currency || !body.idFileUrl) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const order = await UserOrder.create({ ...body });

    return new Response(JSON.stringify({ message: "Order saved", order }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("POST /user/api/orders error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
