import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: [
        "alert",
        "warning",
        "info",
        "success",
        "error",
        "security",
        "system",
        "order_alert",
        "customer_alert",
        "payment_alert",
        "verification_required",
        "high_value_transaction",
        "suspicious_activity",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    category: {
      type: String,
      enum: [
        "order_management",
        "customer_management",
        "payment_processing",
        "security",
        "compliance",
        "system",
        "user_activity",
      ],
      required: true,
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ["order", "customer", "admin", "payment", "system"],
      },
      entityId: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    targetAudience: {
      type: String,
      enum: ["all_admins", "specific_admin", "role_based", "department"],
      default: "all_admins",
    },
    recipients: [{
      adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
      role: {
        type: String,
        enum: ["admin", "support", "manager"],
      },
      isRead: {
        type: Boolean,
        default: false,
      },
      readAt: Date,
      isAcknowledged: {
        type: Boolean,
        default: false,
      },
      acknowledgedAt: Date,
    }],
    triggerConditions: {
      orderAmount: {
        threshold: Number,
        operator: {
          type: String,
          enum: ["gt", "gte", "lt", "lte", "eq"],
        },
      },
      orderStatus: [String],
      customerRiskLevel: [String],
      paymentMethod: [String],
      timeWindow: {
        start: Date,
        end: Date,
      },
    },
    actions: [{
      type: {
        type: String,
        enum: ["review_order", "contact_customer", "verify_identity", "escalate", "block_transaction"],
      },
      description: String,
      isCompleted: {
        type: Boolean,
        default: false,
      },
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
      completedAt: Date,
      notes: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
    },
    autoResolve: {
      type: Boolean,
      default: false,
    },
    metadata: {
      source: {
        type: String,
        enum: ["system", "manual", "automated_rule", "api", "webhook"],
        default: "system",
      },
      ruleId: String, // If triggered by an automated rule
      apiSource: String, // If triggered by external API
      correlationId: String, // For grouping related notifications
      tags: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ priority: 1 });
NotificationSchema.index({ category: 1 });
NotificationSchema.index({ isActive: 1 });
NotificationSchema.index({ expiresAt: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ "recipients.adminId": 1 });
NotificationSchema.index({ "recipients.isRead": 1 });
NotificationSchema.index({ "recipients.isAcknowledged": 1 });
NotificationSchema.index({ "relatedEntity.entityType": 1, "relatedEntity.entityId": 1 });

// Compound indexes
NotificationSchema.index({ type: 1, isActive: 1, createdAt: -1 });
NotificationSchema.index({ priority: 1, isActive: 1, createdAt: -1 });

// Pre-save middleware
NotificationSchema.pre("save", function (next) {
  // Auto-expire old notifications if not set
  if (!this.expiresAt) {
    const daysToExpire = this.priority === "urgent" ? 7 : this.priority === "high" ? 14 : 30;
    this.expiresAt = new Date(Date.now() + daysToExpire * 24 * 60 * 60 * 1000);
  }
  
  // If targeting all admins, we would populate recipients in the business logic
  next();
});

// Methods
NotificationSchema.methods.markAsRead = function (adminId) {
  const recipient = this.recipients.find(r => r.adminId.toString() === adminId.toString());
  if (recipient) {
    recipient.isRead = true;
    recipient.readAt = new Date();
  }
  return this.save();
};

NotificationSchema.methods.acknowledge = function (adminId) {
  const recipient = this.recipients.find(r => r.adminId.toString() === adminId.toString());
  if (recipient) {
    recipient.isAcknowledged = true;
    recipient.acknowledgedAt = new Date();
    
    // If this was an urgent notification, mark as read too
    if (this.priority === "urgent") {
      recipient.isRead = true;
      recipient.readAt = new Date();
    }
  }
  return this.save();
};

NotificationSchema.methods.completeAction = function (actionIndex, adminId, notes) {
  if (this.actions[actionIndex]) {
    this.actions[actionIndex].isCompleted = true;
    this.actions[actionIndex].completedBy = adminId;
    this.actions[actionIndex].completedAt = new Date();
    this.actions[actionIndex].notes = notes;
    
    // If all actions completed, auto-resolve if configured
    const allCompleted = this.actions.every(action => action.isCompleted);
    if (allCompleted && this.autoResolve) {
      this.isActive = false;
    }
  }
  return this.save();
};

NotificationSchema.methods.addRecipient = function (adminId, role) {
  // Check if recipient already exists
  const existingRecipient = this.recipients.find(r => r.adminId.toString() === adminId.toString());
  if (!existingRecipient) {
    this.recipients.push({ adminId, role });
  }
  return this.save();
};

// Static methods
NotificationSchema.statics.createAlert = function (data) {
  return this.create({
    title: data.title,
    message: data.message,
    type: data.type || "alert",
    priority: data.priority || "medium",
    category: data.category,
    relatedEntity: data.relatedEntity,
    targetAudience: data.targetAudience || "all_admins",
    recipients: data.recipients || [],
    actions: data.actions || [],
    metadata: data.metadata || {},
  });
};

NotificationSchema.statics.getActiveNotifications = function (adminId, filters = {}) {
  const query = {
    isActive: true,
    $or: [
      { targetAudience: "all_admins" },
      { "recipients.adminId": adminId },
    ],
    expiresAt: { $gt: new Date() },
  };
  
  if (filters.type) query.type = filters.type;
  if (filters.priority) query.priority = filters.priority;
  if (filters.category) query.category = filters.category;
  if (filters.unreadOnly) {
    query["recipients.isRead"] = false;
  }
  
  return this.find(query).sort({ priority: -1, createdAt: -1 });
};

NotificationSchema.statics.getUnreadCount = function (adminId) {
  return this.countDocuments({
    isActive: true,
    $or: [
      { targetAudience: "all_admins" },
      { "recipients.adminId": adminId },
    ],
    "recipients.isRead": false,
    expiresAt: { $gt: new Date() },
  });
};

NotificationSchema.statics.cleanupExpired = function () {
  return this.updateMany(
    { expiresAt: { $lte: new Date() } },
    { $set: { isActive: false } }
  );
};

NotificationSchema.statics.createHighValueAlert = function (order) {
  return this.createAlert({
    title: `High Value Transaction Alert - ${order.orderId}`,
    message: `Order ${order.orderId} exceeds the high-value threshold of $10,000 NZD. Amount: $${order.amount.totalAmount.toLocaleString()}`,
    type: "high_value_transaction",
    priority: "high",
    category: "order_management",
    relatedEntity: {
      entityType: "order",
      entityId: order._id,
    },
    actions: [
      {
        type: "review_order",
        description: "Review order details and customer verification status",
      },
      {
        type: "verify_identity",
        description: "Verify customer identity and payment source",
      },
    ],
    autoResolve: true,
    metadata: {
      source: "automated_rule",
      ruleId: "high_value_threshold",
      tags: ["high_value", "requires_review"],
    },
  });
};

NotificationSchema.statics.createSuspiciousActivityAlert = function (customer, reason) {
  return this.createAlert({
    title: `Suspicious Activity Detected - ${customer.fullName}`,
    message: `Customer ${customer.fullName} has been flagged for suspicious activity: ${reason}`,
    type: "suspicious_activity",
    priority: "urgent",
    category: "security",
    relatedEntity: {
      entityType: "customer",
      entityId: customer._id,
    },
    actions: [
      {
        type: "review_order",
        description: "Review all customer orders and transaction patterns",
      },
      {
        type: "contact_customer",
        description: "Contact customer for additional verification",
      },
      {
        type: "escalate",
        description: "Escalate to compliance team if necessary",
      },
    ],
    metadata: {
      source: "automated_rule",
      ruleId: "suspicious_activity_detection",
      tags: ["suspicious", "security", "urgent_review"],
    },
  });
};

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);