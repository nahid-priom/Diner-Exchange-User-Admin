import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongodb";
import { authOptions } from "../../../../lib/auth";
import Notification from "../../../../models/Notification";
import AuditLog from "../../../../models/AuditLog";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const type = searchParams.get("type");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const activeOnly = searchParams.get("activeOnly") !== "false";

    // Build query
    const query = {};
    
    if (activeOnly) query.isActive = true;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    // Filter for current admin
    query.$or = [
      { targetAudience: "all_admins" },
      { "recipients.adminId": session.user.id },
      { "recipients.role": session.user.role },
    ];

    if (unreadOnly) {
      query["recipients"] = {
        $elemMatch: {
          adminId: session.user.id,
          isRead: false,
        },
      };
    }

    // Ensure not expired
    query.expiresAt = { $gt: new Date() };

    const skip = (page - 1) * limit;
    const notifications = await Notification.find(query)
      .populate("relatedEntity.entityId")
      .populate("recipients.adminId", "firstName lastName")
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    // Get unread count for the current admin
    const unreadCount = await Notification.countDocuments({
      isActive: true,
      $or: [
        { targetAudience: "all_admins" },
        { "recipients.adminId": session.user.id },
      ],
      "recipients": {
        $elemMatch: {
          adminId: session.user.id,
          isRead: false,
        },
      },
      expiresAt: { $gt: new Date() },
    });

    // Get priority breakdown
    const priorityStats = await Notification.aggregate([
      { $match: { ...query, isActive: true } },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
      unreadCount,
      priorityStats,
    });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const data = await request.json();

    // Create notification
    const notification = await Notification.createAlert({
      ...data,
      metadata: {
        ...data.metadata,
        source: "manual",
      },
    });

    // Log action
    await AuditLog.logAction(
      session.user.id,
      "create_notification",
      "notification",
      notification._id,
      {
        newValue: notification.toObject(),
        notes: "Notification created manually by admin",
      }
    );

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Notifications POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}