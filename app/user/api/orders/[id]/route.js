import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

// Your schema, or import if shared
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

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
   const { id } = await params; 
    const body = await request.json();

    const updatedOrder = await Order.findByIdAndUpdate(id, body, { new: true });

    if (!updatedOrder) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ order: updatedOrder }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("PATCH /user/api/orders/[id] error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
