import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/mongodb";
import { authOptions, canPerformAction } from "../../../../../lib/auth";
import Customer from "../../../../../models/Customer";
import Order from "../../../../../models/Order";
import AuditLog from "../../../../../models/AuditLog";
import Notification from "../../../../../models/Notification";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canPerformAction(session, "viewCustomers")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const customerId = params.id;

    // Get customer with populated user data
    const customer = await Customer.findById(customerId)
      .populate("userId", "email trustedIPs")
      .populate("verification.documentsSubmitted.reviewedBy", "firstName lastName")
      .populate("verification.verifiedBy", "firstName lastName");

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Get customer's order history
    const orders = await Order.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("assignedTo", "firstName lastName");

    // Get customer's audit log
    const auditLog = await AuditLog.find({ 
      entityType: "customer", 
      entityId: customerId 
    })
      .populate("adminId", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(20);

    // Calculate additional metrics
    const orderMetrics = await Order.aggregate([
      { $match: { customer: customer._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalVolume: { $sum: "$amount.totalAmount" },
          averageOrderValue: { $avg: "$amount.totalAmount" },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "completed"] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0] }
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "pending"] }, 1, 0] }
          },
          highValueOrders: {
            $sum: { $cond: [{ $gt: ["$amount.totalAmount", 10000] }, 1, 0] }
          },
        },
      },
    ]);

    const metrics = orderMetrics[0] || {
      totalOrders: 0,
      totalVolume: 0,
      averageOrderValue: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      pendingOrders: 0,
      highValueOrders: 0,
    };

    // Get recent activity timeline
    const recentActivity = await Order.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("orderId orderStatus amount.totalAmount createdAt updatedAt");

    return NextResponse.json({
      customer,
      orders,
      auditLog,
      metrics,
      recentActivity,
    });
  } catch (error) {
    console.error("Customer GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canPerformAction(session, "editCustomers")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const data = await request.json();
    const customerId = params.id;

    // Get the original customer for audit trail
    const originalCustomer = await Customer.findById(customerId);
    if (!originalCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Update customer
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      data,
      { new: true, runValidators: true }
    ).populate("userId", "email");

    // Calculate changes for audit trail
    const changes = [];
    Object.keys(data).forEach(key => {
      if (JSON.stringify(originalCustomer[key]) !== JSON.stringify(data[key])) {
        changes.push({
          field: key,
          oldValue: originalCustomer[key],
          newValue: data[key],
        });
      }
    });

    // Determine action type based on changes
    let action = "update_customer";
    let notes = data._adminNotes || "Customer updated by admin";

    if (data.flags?.isSuspicious && !originalCustomer.flags?.isSuspicious) {
      action = "flag_customer";
      notes = `Customer flagged as suspicious: ${data._suspiciousReason || "Admin review"}`;
      
      // Create notification
      await Notification.createSuspiciousActivityAlert(
        updatedCustomer,
        data._suspiciousReason || "Customer flagged by admin"
      );
    }

    if (data.verification?.kycStatus !== originalCustomer.verification?.kycStatus) {
      if (data.verification?.kycStatus === "approved") {
        action = "verify_customer";
        notes = "Customer verification approved";
      }
    }

    if (data.riskProfile?.riskLevel !== originalCustomer.riskProfile?.riskLevel) {
      action = "update_customer_risk";
      notes = `Customer risk level changed from ${originalCustomer.riskProfile?.riskLevel} to ${data.riskProfile?.riskLevel}`;
    }

    // Log action
    await AuditLog.logAction(
      session.user.id,
      action,
      "customer",
      customerId,
      {
        oldValue: originalCustomer.toObject(),
        newValue: updatedCustomer.toObject(),
        changes,
        notes,
      }
    );

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error("Customer PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canPerformAction(session, "editCustomers")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const customerId = params.id;
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Check if customer has active orders
    const activeOrders = await Order.countDocuments({
      customer: customerId,
      orderStatus: { $in: ["pending", "confirmed", "processing", "shipped"] }
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        { error: "Cannot delete customer with active orders" },
        { status: 400 }
      );
    }

    // Soft delete - mark as closed instead of actually deleting
    await Customer.findByIdAndUpdate(customerId, {
      accountStatus: "closed",
      isActive: false,
    });

    // Log action
    await AuditLog.logAction(
      session.user.id,
      "delete_customer",
      "customer",
      customerId,
      {
        oldValue: customer.toObject(),
        notes: "Customer account closed by admin",
      }
    );

    return NextResponse.json({ message: "Customer account closed successfully" });
  } catch (error) {
    console.error("Customer DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}