import dbConnect from "@/lib/mongodb";
import UserOrder from "../../../../../models/UserOrder";

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
   const { id } = await params; 
    const body = await request.json();

    const updatedOrder = await UserOrder.findByIdAndUpdate(id, body, { new: true });

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
