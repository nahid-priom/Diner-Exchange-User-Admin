import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: function() {
        return `DNR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      },
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
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
      fromAmount: {
        type: Number,
        required: true,
        min: 0,
      },
      toAmount: {
        type: Number,
        required: true,
        min: 0,
      },
      exchangeRate: {
        type: Number,
        required: true,
        min: 0,
      },
      fees: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },
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
      transactionId: {
        type: String,
      },
      paymentDate: {
        type: Date,
      },
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
      trackingNumber: {
        type: String,
      },
      estimatedDelivery: {
        type: Date,
      },
      actualDelivery: {
        type: Date,
      },
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
      isSuspicious: {
        type: Boolean,
        default: false,
      },
      isHighValue: {
        type: Boolean,
        default: false,
      },
      requiresVerification: {
        type: Boolean,
        default: false,
      },
      isFirstTimeCustomer: {
        type: Boolean,
        default: false,
      },
    },
    notes: {
      customerNotes: {
        type: String,
        maxlength: 1000,
      },
      adminNotes: {
        type: String,
        maxlength: 2000,
      },
      internalNotes: {
        type: String,
        maxlength: 2000,
      },
    },
    verificationDocuments: [{
      type: {
        type: String,
        enum: ["id", "passport", "drivers_license", "proof_of_address", "bank_statement"],
      },
      url: String,
      verified: {
        type: Boolean,
        default: false,
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
      verifiedAt: Date,
    }],
    timeline: [{
      status: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
      notes: String,
    }],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance and queries (orderId already has unique: true, index: true)
OrderSchema.index({ customer: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ "paymentDetails.status": 1 });
OrderSchema.index({ "deliveryDetails.status": 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ "amount.totalAmount": 1 });
OrderSchema.index({ "flags.isSuspicious": 1 });
OrderSchema.index({ "flags.isHighValue": 1 });
OrderSchema.index({ priority: 1 });

// Pre-save middleware to set flags
OrderSchema.pre("save", function (next) {
  // Set high value flag for orders above $10,000 NZD
  if (this.amount.totalAmount > 10000) {
    this.flags.isHighValue = true;
  }
  
  // Add status to timeline if status changed
  if (this.isModified("orderStatus")) {
    this.timeline.push({
      status: this.orderStatus,
      timestamp: new Date(),
    });
  }
  
  next();
});

// Virtual for order age in days
OrderSchema.virtual("orderAge").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Methods
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
  this.notes.adminNotes = `${this.notes.adminNotes || ""}\n[FLAGGED as suspicious by admin: ${reason}]`;
  return this.save();
};

// Static methods
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