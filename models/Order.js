import mongoose from "mongoose";

const { Schema } = mongoose;

const OrderSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      default: () => `DNR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    orderType: {
      type: String,
      enum: ["buy_dinar", "buy_zimbabwe_dollar", "sell_dinar", "sell_zimbabwe_dollar"],
      required: true,
    },
    currency: {
      from: {
        type: String,
        enum: ["NZD", "USD", "AUD", "EUR", "GBP", "IQD", "ZWL"],
        required: true,
      },
      to: {
        type: String,
        enum: ["NZD", "USD", "AUD", "EUR", "GBP", "IQD", "ZWL"],
        required: true,
      },
    },
    amount: {
      fromAmount: { type: Number, required: true, min: 0 },
      toAmount: { type: Number, required: true, min: 0 },
      exchangeRate: { type: Number, required: true, min: 0 },
      fees: { type: Number, default: 0, min: 0 },
      totalAmount: { type: Number, required: true, min: 0 },
    },
    paymentDetails: {
      method: {
        type: String,
        enum: ["bank_transfer", "credit_card", "debit_card", "paypal", "stripe", "cash"],
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed", "refunded", "cancelled"],
        default: "pending",
      },
      transactionId: String,
      paymentDate: Date,
      bankDetails: {
        accountNumber: String,
        routingNumber: String,
        bankName: String,
        accountHolder: String,
      },
    },
    deliveryDetails: {
      method: {
        type: String,
        enum: ["pickup", "courier", "bank_transfer", "digital_wallet"],
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "processing", "shipped", "delivered", "failed"],
        default: "pending",
      },
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
      },
      trackingNumber: String,
      estimatedDelivery: Date,
      actualDelivery: Date,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "completed", "cancelled", "refunded"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    flags: {
      isSuspicious: { type: Boolean, default: false },
      isHighValue: { type: Boolean, default: false },
      requiresVerification: { type: Boolean, default: false },
      isFirstTimeCustomer: { type: Boolean, default: false },
    },
    notes: {
      customerNotes: { type: String, maxlength: 1000 },
      adminNotes: { type: String, maxlength: 2000 },
      internalNotes: { type: String, maxlength: 2000 },
    },
    verificationDocuments: [{
      type: {
        type: String,
        enum: ["id", "passport", "drivers_license", "proof_of_address", "bank_statement"],
      },
      url: String,
      verified: { type: Boolean, default: false },
      verifiedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
      verifiedAt: Date,
    }],
    timeline: [{
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      updatedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
      notes: String,
    }],
    assignedTo: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

// --- Indexes (unique already adds an index) ---
OrderSchema.index({ customer: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ "paymentDetails.status": 1 });
OrderSchema.index({ "deliveryDetails.status": 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ "amount.totalAmount": 1 });
OrderSchema.index({ "flags.isSuspicious": 1 });
OrderSchema.index({ "flags.isHighValue": 1 });
OrderSchema.index({ priority: 1 });

// --- Pre-save: set flags and timeline ---
OrderSchema.pre("save", function (next) {
  if (this.amount.totalAmount > 10000) {
    this.flags.isHighValue = true;
  }
  // Only push to timeline if orderStatus actually changed and it's NOT a new document
  if (!this.isNew && this.isModified("orderStatus")) {
    this.timeline.push({
      status: this.orderStatus,
      timestamp: new Date(),
    });
  }
  next();
});

// --- Virtuals ---
OrderSchema.virtual("orderAge").get(function () {
  if (!this.createdAt) return 0;
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// --- Instance Methods ---
OrderSchema.methods.updateStatus = function (status, adminId, notes) {
  this.orderStatus = status;
  this.timeline.push({
    status,
    timestamp: new Date(),
    updatedBy: adminId,
    notes,
  });
  return this.save();
};

OrderSchema.methods.flagAsSuspicious = function (adminId, reason) {
  this.flags.isSuspicious = true;
  this.notes.adminNotes = `${this.notes.adminNotes ? this.notes.adminNotes + "\n" : ""}[FLAGGED as suspicious by admin: ${reason}]`;
  return this.save();
};

// --- Static Methods ---
OrderSchema.statics.getOrdersByDateRange = function (startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  });
};

OrderSchema.statics.getSuspiciousOrders = function () {
  return this.find({ "flags.isSuspicious": true });
};

OrderSchema.statics.getHighValueOrders = function () {
  return this.find({ "flags.isHighValue": true });
};

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
