import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "logout",
        "failed_login",
        "password_reset",
        "create_order",
        "update_order",
        "delete_order",
        "update_order_status",
        "flag_order",
        "assign_order",
        "create_customer",
        "update_customer",
        "delete_customer",
        "verify_customer",
        "flag_customer",
        "update_customer_risk",
        "approve_document",
        "reject_document",
        "create_admin",
        "update_admin",
        "delete_admin",
        "update_admin_permissions",
        "create_notification",
        "update_notification",
        "delete_notification",
        "export_data",
        "import_data",
        "system_config_change",
        "bulk_update",
        "manual_payment_entry",
        "refund_processed",
        "chargeback_handled",
      ],
    },
    entityType: {
      type: String,
      enum: ["order", "customer", "admin", "notification", "system", "payment"],
    },
    entityId: {
      type: mongoose.Schema.Types.Mixed, // Can be ObjectId or string
    },
    details: {
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      changes: [{
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
      }],
      metadata: {
        userAgent: String,
        ipAddress: String,
        sessionId: String,
        requestId: String,
      },
      notes: String,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["success", "failed", "partial"],
      default: "success",
    },
    category: {
      type: String,
      enum: [
        "authentication",
        "authorization",
        "data_modification",
        "data_access",
        "configuration",
        "security",
        "compliance",
        "system",
      ],
      required: true,
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    tags: [String],
    correlationId: {
      type: String, // For grouping related actions
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance and queries
AuditLogSchema.index({ adminId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ severity: 1 });
AuditLogSchema.index({ category: 1 });
AuditLogSchema.index({ riskScore: -1 });
AuditLogSchema.index({ correlationId: 1 });
AuditLogSchema.index({ "details.metadata.ipAddress": 1 });

// Compound indexes
AuditLogSchema.index({ adminId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ severity: 1, createdAt: -1 });

// Pre-save middleware to calculate risk score
AuditLogSchema.pre("save", function (next) {
  // Calculate risk score based on action and context
  let score = 0;
  
  const highRiskActions = [
    "delete_order",
    "delete_customer",
    "delete_admin",
    "update_admin_permissions",
    "system_config_change",
    "manual_payment_entry",
  ];
  
  const mediumRiskActions = [
    "update_order",
    "flag_order",
    "flag_customer",
    "update_customer_risk",
    "create_admin",
    "refund_processed",
  ];
  
  if (highRiskActions.includes(this.action)) {
    score += 50;
  } else if (mediumRiskActions.includes(this.action)) {
    score += 30;
  } else {
    score += 10;
  }
  
  // Add points for failed actions
  if (this.status === "failed") {
    score += 20;
  }
  
  // Add points for high severity
  if (this.severity === "critical") {
    score += 30;
  } else if (this.severity === "high") {
    score += 20;
  }
  
  // Add points for off-hours activity (example: between 10 PM and 6 AM)
  const hour = new Date().getHours();
  if (hour >= 22 || hour <= 6) {
    score += 15;
  }
  
  this.riskScore = Math.min(score, 100);
  next();
});

// Static methods
AuditLogSchema.statics.logAction = function (adminId, action, entityType, entityId, details = {}) {
  const categoryMap = {
    login: "authentication",
    logout: "authentication",
    failed_login: "authentication",
    password_reset: "authentication",
    create_order: "data_modification",
    update_order: "data_modification",
    delete_order: "data_modification",
    update_order_status: "data_modification",
    flag_order: "security",
    assign_order: "data_modification",
    create_customer: "data_modification",
    update_customer: "data_modification",
    delete_customer: "data_modification",
    verify_customer: "compliance",
    flag_customer: "security",
    update_customer_risk: "security",
    approve_document: "compliance",
    reject_document: "compliance",
    create_admin: "authorization",
    update_admin: "authorization",
    delete_admin: "authorization",
    update_admin_permissions: "authorization",
    create_notification: "data_modification",
    update_notification: "data_modification",
    delete_notification: "data_modification",
    export_data: "data_access",
    import_data: "data_modification",
    system_config_change: "configuration",
    bulk_update: "data_modification",
    manual_payment_entry: "data_modification",
    refund_processed: "data_modification",
    chargeback_handled: "data_modification",
  };

  const severityMap = {
    delete_order: "high",
    delete_customer: "high",
    delete_admin: "critical",
    update_admin_permissions: "high",
    system_config_change: "critical",
    manual_payment_entry: "high",
    flag_customer: "medium",
    flag_order: "medium",
    failed_login: "medium",
  };

  return this.create({
    adminId,
    action,
    entityType,
    entityId,
    details,
    category: categoryMap[action] || "data_modification",
    severity: severityMap[action] || "low",
  });
};

AuditLogSchema.statics.getActivityByAdmin = function (adminId, startDate, endDate) {
  const query = { adminId };
  if (startDate && endDate) {
    query.createdAt = { $gte: startDate, $lte: endDate };
  }
  return this.find(query).sort({ createdAt: -1 });
};

AuditLogSchema.statics.getHighRiskActivities = function (threshold = 70) {
  return this.find({ riskScore: { $gte: threshold } }).sort({ createdAt: -1 });
};

AuditLogSchema.statics.getFailedActions = function (startDate, endDate) {
  const query = { status: "failed" };
  if (startDate && endDate) {
    query.createdAt = { $gte: startDate, $lte: endDate };
  }
  return this.find(query).sort({ createdAt: -1 });
};

AuditLogSchema.statics.getActivityByEntity = function (entityType, entityId) {
  return this.find({ entityType, entityId }).sort({ createdAt: -1 });
};

AuditLogSchema.statics.getActivitySummary = function (startDate, endDate) {
  const matchStage = {};
  if (startDate && endDate) {
    matchStage.createdAt = { $gte: startDate, $lte: endDate };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          action: "$action",
          category: "$category",
          severity: "$severity",
        },
        count: { $sum: 1 },
        avgRiskScore: { $avg: "$riskScore" },
        maxRiskScore: { $max: "$riskScore" },
        admins: { $addToSet: "$adminId" },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);