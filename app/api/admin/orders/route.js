import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongodb";
import { authOptions, canPerformAction } from "../../../../lib/auth";
import Order from "../../../../models/Order";
import Customer from "../../../../models/Customer";
import AuditLog from "../../../../models/AuditLog";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canPerformAction(session, "viewOrders")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const deliveryStatus = searchParams.get("deliveryStatus");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const customerId = searchParams.get("customerId");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const flagged = searchParams.get("flagged");

    // Build query
    const query = {};

    if (status) query.orderStatus = status;
    if (paymentStatus) query["paymentDetails.status"] = paymentStatus;
    if (deliveryStatus) query["deliveryDetails.status"] = deliveryStatus;
    if (customerId) query.customer = customerId;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { orderId: new RegExp(search, "i") },
        { "paymentDetails.transactionId": new RegExp(search, "i") },
        { "deliveryDetails.trackingNumber": new RegExp(search, "i") },
      ];
    }

    if (flagged === "true") {
      query.$or = [
        { "flags.isSuspicious": true },
        { "flags.isHighValue": true },
        { "flags.requiresVerification": true },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get orders with pagination
    const skip = (page - 1) * limit;
    const orders = await Order.find(query)
      .populate("customer", "personalInfo.firstName personalInfo.lastName email")
      .populate("assignedTo", "firstName lastName")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    // Get summary statistics
    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount.totalAmount" },
          averageAmount: { $avg: "$amount.totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = stats[0] || { totalAmount: 0, averageAmount: 0, count: 0 };

    return NextResponse.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
      summary,
    });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canPerformAction(session, "editOrders")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const data = await request.json();

    // Create new order
    const order = new Order({
      ...data,
      assignedTo: session.user.id,
    });

    await order.save();

    // Log action
    await AuditLog.logAction(
      session.user.id,
      "create_order",
      "order",
      order._id,
      {
        newValue: order.toObject(),
        notes: "Order created manually by admin",
      }
    );

    // Populate customer data for response
    await order.populate("customer", "personalInfo.firstName personalInfo.lastName email");

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Orders POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}