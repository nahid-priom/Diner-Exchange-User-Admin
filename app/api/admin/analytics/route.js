import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongodb";
import { authOptions, canPerformAction } from "../../../../lib/auth";
import Order from "../../../../models/Order";
import Customer from "../../../../models/Customer";
import Notification from "../../../../models/Notification";
import AuditLog from "../../../../models/AuditLog";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canPerformAction(session, "viewAnalytics")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "30"; // days
    const currency = searchParams.get("currency") || "all";

    const days = parseInt(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dateQuery = { createdAt: { $gte: startDate } };

    // Build currency filter
    const currencyQuery = {};
    if (currency !== "all") {
      currencyQuery["currency.from"] = currency;
    }

    // Combine queries
    const orderQuery = { ...dateQuery, ...currencyQuery };

    // 1. Order Statistics
    const orderStats = await Order.aggregate([
      { $match: orderQuery },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$amount.totalAmount" },
          averageOrderValue: { $avg: "$amount.totalAmount" },
          totalFees: { $sum: "$amount.fees" },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "pending"] }, 1, 0] }
          },
          processingOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "processing"] }, 1, 0] }
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "completed"] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0] }
          },
          highValueOrders: {
            $sum: { $cond: [{ $gt: ["$amount.totalAmount", 10000] }, 1, 0] }
          },
          suspiciousOrders: {
            $sum: { $cond: ["$flags.isSuspicious", 1, 0] }
          },
        },
      },
    ]);

    // 2. Daily Order Trends
    const dailyTrends = await Order.aggregate([
      { $match: orderQuery },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          orders: { $sum: 1 },
          revenue: { $sum: "$amount.totalAmount" },
          fees: { $sum: "$amount.fees" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    // 3. Currency Distribution
    const currencyStats = await Order.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: "$currency.from",
          orders: { $sum: 1 },
          volume: { $sum: "$amount.totalAmount" },
        },
      },
      { $sort: { volume: -1 } },
    ]);

    // 4. Order Type Distribution
    const orderTypeStats = await Order.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: "$orderType",
          orders: { $sum: 1 },
          volume: { $sum: "$amount.totalAmount" },
        },
      },
    ]);

    // 5. Payment Method Statistics
    const paymentStats = await Order.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: "$paymentDetails.method",
          orders: { $sum: 1 },
          volume: { $sum: "$amount.totalAmount" },
          pending: {
            $sum: { $cond: [{ $eq: ["$paymentDetails.status", "pending"] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$paymentDetails.status", "completed"] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ["$paymentDetails.status", "failed"] }, 1, 0] }
          },
        },
      },
    ]);

    // 6. Customer Statistics
    const customerStats = await Customer.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          verifiedCustomers: {
            $sum: { $cond: ["$verification.isVerified", 1, 0] }
          },
          vipCustomers: {
            $sum: { $cond: ["$flags.isVIP", 1, 0] }
          },
          suspiciousCustomers: {
            $sum: { $cond: ["$flags.isSuspicious", 1, 0] }
          },
          highRiskCustomers: {
            $sum: { $cond: [{ $eq: ["$riskProfile.riskLevel", "high"] }, 1, 0] }
          },
          criticalRiskCustomers: {
            $sum: { $cond: [{ $eq: ["$riskProfile.riskLevel", "critical"] }, 1, 0] }
          },
        },
      },
    ]);

    // 7. Verification Status Distribution
    const verificationStats = await Customer.aggregate([
      {
        $group: {
          _id: "$verification.kycStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // 8. Active Notifications
    const notificationStats = await Notification.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    // 9. Recent High-Risk Activities
    const highRiskActivities = await AuditLog.find({
      riskScore: { $gte: 70 },
      createdAt: { $gte: startDate },
    })
      .populate("adminId", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(10);

    // 10. Top Customers by Volume
    const topCustomers = await Order.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: "$customer",
          totalVolume: { $sum: "$amount.totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalVolume: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customerInfo",
        },
      },
      { $unwind: "$customerInfo" },
    ]);

    // 11. Order Status Timeline
    const statusTimeline = await Order.aggregate([
      { $match: dateQuery },
      { $unwind: "$timeline" },
      {
        $group: {
          _id: {
            status: "$timeline.status",
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timeline.timestamp" } }
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    // 12. Performance Metrics (compared to previous period)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);
    const previousEndDate = new Date(startDate);

    const previousPeriodStats = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: previousStartDate, $lt: previousEndDate },
          ...currencyQuery
        } 
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$amount.totalAmount" },
          averageOrderValue: { $avg: "$amount.totalAmount" },
        },
      },
    ]);

    // Calculate growth rates
    const currentStats = orderStats[0] || {};
    const previousStats = previousPeriodStats[0] || {};
    
    const growthMetrics = {
      ordersGrowth: previousStats.totalOrders 
        ? ((currentStats.totalOrders - previousStats.totalOrders) / previousStats.totalOrders) * 100
        : 0,
      revenueGrowth: previousStats.totalRevenue
        ? ((currentStats.totalRevenue - previousStats.totalRevenue) / previousStats.totalRevenue) * 100
        : 0,
      avgOrderValueGrowth: previousStats.averageOrderValue
        ? ((currentStats.averageOrderValue - previousStats.averageOrderValue) / previousStats.averageOrderValue) * 100
        : 0,
    };

    return NextResponse.json({
      orderStats: currentStats,
      customerStats: customerStats[0] || {},
      dailyTrends,
      currencyStats,
      orderTypeStats,
      paymentStats,
      verificationStats,
      notificationStats,
      highRiskActivities,
      topCustomers,
      statusTimeline,
      growthMetrics,
      timeframe: days,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}