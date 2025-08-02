import dbConnect from "@/lib/mongodb"; // <-- default import!
import mongoose from "mongoose";

// Schema definition
const OrderSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  mobile: String,
  country: String,
  address: String,
  city: String,
  state: String,
  postcode: String,
  currency: String,
  quantity: Number,
  idFileUrl: String,
  acceptTerms: Boolean,
  paymentMethod: String,
  paymentReceiptUrl: String,
  skipReceipt: Boolean,
  comments: String,
  status: { type: String, default: "pending" },
}, { collection: "orders", timestamps: true });

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

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

    const orders = await Order.find({ email: decodedEmail }).sort({ createdAt: -1 });

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

    const order = await Order.create({ ...body });

    return new Response(JSON.stringify({ message: "Order saved", order }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("POST /user/api/orders error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
