import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/mongodb";
import { authOptions, canPerformAction } from "../../../../../lib/auth";
import Order from "../../../../../models/Order";
import AuditLog from "../../../../../models/AuditLog";
import Notification from "../../../../../models/Notification";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canPerformAction(session, "viewOrders")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const order = await Order.findById(params.id)
      .populate("customer")
      .populate("assignedTo", "firstName lastName email")
      .populate("verificationDocuments.verifiedBy", "firstName lastName");

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canPerformAction(session, "editOrders")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const data = await request.json();
    const orderId = params.id;

    // Get the original order for audit trail
    const originalOrder = await Order.findById(orderId);
    if (!originalOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      data,
      { new: true, runValidators: true }
    ).populate("customer", "personalInfo.firstName personalInfo.lastName email")
     .populate("assignedTo", "firstName lastName");

    // Calculate changes for audit trail
    const changes = [];
    Object.keys(data).forEach(key => {
      if (JSON.stringify(originalOrder[key]) !== JSON.stringify(data[key])) {
        changes.push({
          field: key,
          oldValue: originalOrder[key],
          newValue: data[key],
        });
      }
    });

    // Log action
    await AuditLog.logAction(
      session.user.id,
      "update_order",
      "order",
      orderId,
      {
        oldValue: originalOrder.toObject(),
        newValue: updatedOrder.toObject(),
        changes,
        notes: data._adminNotes || "Order updated by admin",
      }
    );

    // Check if order was flagged as suspicious
    if (data.flags?.isSuspicious && !originalOrder.flags?.isSuspicious) {
      await Notification.createSuspiciousActivityAlert(
        await updatedOrder.populate("customer"),
        data._suspiciousReason || "Order flagged by admin"
      );
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Order PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canPerformAction(session, "deleteOrders")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const orderId = params.id;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow deletion of cancelled or failed orders
    if (!["cancelled", "failed"].includes(order.orderStatus)) {
      return NextResponse.json(
        { error: "Only cancelled or failed orders can be deleted" },
        { status: 400 }
      );
    }

    await Order.findByIdAndDelete(orderId);

    // Log action
    await AuditLog.logAction(
      session.user.id,
      "delete_order",
      "order",
      orderId,
      {
        oldValue: order.toObject(),
        notes: "Order deleted by admin",
      }
    );

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Order DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}