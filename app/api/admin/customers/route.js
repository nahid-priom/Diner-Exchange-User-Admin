import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongodb";
import { authOptions, canPerformAction } from "../../../../lib/auth";
import Customer from "../../../../models/Customer";
import Order from "../../../../models/Order";
import AuditLog from "../../../../models/AuditLog";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canPerformAction(session, "viewCustomers")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const search = searchParams.get("search");
    const verificationStatus = searchParams.get("verificationStatus");
    const riskLevel = searchParams.get("riskLevel");
    const accountStatus = searchParams.get("accountStatus");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const flagged = searchParams.get("flagged");
    const vip = searchParams.get("vip");

    // Build query
    const query = {};

    if (verificationStatus) query["verification.kycStatus"] = verificationStatus;
    if (riskLevel) query["riskProfile.riskLevel"] = riskLevel;
    if (accountStatus) query.accountStatus = accountStatus;
    if (flagged === "true") query["flags.isSuspicious"] = true;
    if (vip === "true") query["flags.isVIP"] = true;

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { "personalInfo.firstName": regex },
        { "personalInfo.lastName": regex },
        { "personalInfo.phoneNumber": regex },
        { "personalInfo.email": regex },
      ];
      
      // Try to search by user email through population
      const userQuery = await Customer.find(query)
        .populate("userId", "email")
        .lean();
      
      const emailMatches = userQuery.filter(customer => 
        customer.userId?.email?.match(regex)
      ).map(c => c._id);
      
      if (emailMatches.length > 0) {
        query.$or.push({ _id: { $in: emailMatches } });
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get customers with pagination
    const skip = (page - 1) * limit;
    const customers = await Customer.find(query)
      .populate("userId", "email")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(query);

    // Get summary statistics
    const stats = await Customer.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$accountMetrics.totalVolume" },
          averageVolume: { $avg: "$accountMetrics.totalVolume" },
          totalOrders: { $sum: "$accountMetrics.totalOrders" },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = stats[0] || { 
      totalVolume: 0, 
      averageVolume: 0, 
      totalOrders: 0, 
      count: 0 
    };

    // Get verification status breakdown
    const verificationStats = await Customer.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$verification.kycStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get risk level breakdown
    const riskStats = await Customer.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$riskProfile.riskLevel",
          count: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
      summary,
      verificationStats,
      riskStats,
    });
  } catch (error) {
    console.error("Customers GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !canPerformAction(session, "editCustomers")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const data = await request.json();

    // Create new customer
    const customer = new Customer(data);
    await customer.save();

    // Log action
    await AuditLog.logAction(
      session.user.id,
      "create_customer",
      "customer",
      customer._id,
      {
        newValue: customer.toObject(),
        notes: "Customer created manually by admin",
      }
    );

    // Populate user data for response
    await customer.populate("userId", "email");

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Customers POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}