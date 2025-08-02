import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    personalInfo: {
      firstName: {
        type: String,
        required: true,
        trim: true,
      },
      lastName: {
        type: String,
        required: true,
        trim: true,
      },
      dateOfBirth: {
        type: Date,
      },
      nationality: {
        type: String,
      },
      phoneNumber: {
        type: String,
        trim: true,
      },
      alternatePhone: {
        type: String,
        trim: true,
      },
    },
    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        default: "New Zealand",
        trim: true,
      },
      postalCode: {
        type: String,
        trim: true,
      },
    },
    verification: {
      isVerified: {
        type: Boolean,
        default: false,
      },
      verificationLevel: {
        type: String,
        enum: ["none", "basic", "enhanced", "premium"],
        default: "none",
      },
      kycStatus: {
        type: String,
        enum: ["pending", "under_review", "approved", "rejected", "expired"],
        default: "pending",
      },
      documentsSubmitted: [{
        type: {
          type: String,
          enum: ["id", "passport", "drivers_license", "proof_of_address", "bank_statement", "utility_bill"],
        },
        url: String,
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
        },
        reviewedAt: Date,
        rejectionReason: String,
      }],
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
      verifiedAt: Date,
      lastKycUpdate: Date,
    },
    riskProfile: {
      riskLevel: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "medium",
      },
      riskFactors: [{
        factor: {
          type: String,
          enum: ["high_transaction_volume", "suspicious_pattern", "failed_verification", "multiple_accounts", "geographic_risk", "large_cash_transactions"],
        },
        severity: {
          type: String,
          enum: ["low", "medium", "high"],
        },
        detectedAt: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      }],
      watchlistStatus: {
        type: String,
        enum: ["none", "monitoring", "restricted", "blocked"],
        default: "none",
      },
      lastRiskAssessment: Date,
    },
    preferences: {
      preferredCurrency: {
        type: String,
        enum: ["NZD", "USD", "AUD", "EUR", "GBP"],
        default: "NZD",
      },
      communicationMethod: {
        type: String,
        enum: ["email", "sms", "phone"],
        default: "email",
      },
      marketingConsent: {
        type: Boolean,
        default: false,
      },
    },
    accountMetrics: {
      totalOrders: {
        type: Number,
        default: 0,
      },
      totalVolume: {
        type: Number,
        default: 0,
      },
      averageOrderValue: {
        type: Number,
        default: 0,
      },
      lastOrderDate: Date,
      firstOrderDate: Date,
      cancelledOrders: {
        type: Number,
        default: 0,
      },
      disputedOrders: {
        type: Number,
        default: 0,
      },
    },
    flags: {
      isSuspicious: {
        type: Boolean,
        default: false,
      },
      isVIP: {
        type: Boolean,
        default: false,
      },
      requiresApproval: {
        type: Boolean,
        default: false,
      },
      isBlocked: {
        type: Boolean,
        default: false,
      },
    },
    notes: {
      adminNotes: {
        type: String,
        maxlength: 2000,
      },
      customerServiceNotes: {
        type: String,
        maxlength: 2000,
      },
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    accountStatus: {
      type: String,
      enum: ["active", "inactive", "suspended", "closed"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
CustomerSchema.index({ userId: 1 });
CustomerSchema.index({ "personalInfo.firstName": 1, "personalInfo.lastName": 1 });
CustomerSchema.index({ "personalInfo.phoneNumber": 1 });
CustomerSchema.index({ "verification.isVerified": 1 });
CustomerSchema.index({ "verification.kycStatus": 1 });
CustomerSchema.index({ "riskProfile.riskLevel": 1 });
CustomerSchema.index({ "flags.isSuspicious": 1 });
CustomerSchema.index({ "flags.isVIP": 1 });
CustomerSchema.index({ accountStatus: 1 });
CustomerSchema.index({ lastActivity: -1 });

// Virtual for full name
CustomerSchema.virtual("fullName").get(function () {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Virtual for customer age in days
CustomerSchema.virtual("customerAge").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
CustomerSchema.pre("save", function (next) {
  // Update last activity
  this.lastActivity = new Date();
  
  // Auto-upgrade verification level based on completed documents
  const approvedDocs = this.verification.documentsSubmitted.filter(
    doc => doc.status === "approved"
  );
  
  if (approvedDocs.length >= 3 && this.verification.verificationLevel === "none") {
    this.verification.verificationLevel = "basic";
  } else if (approvedDocs.length >= 5 && this.verification.verificationLevel === "basic") {
    this.verification.verificationLevel = "enhanced";
  }
  
  // Set VIP flag for high-value customers
  if (this.accountMetrics.totalVolume > 100000) {
    this.flags.isVIP = true;
  }
  
  next();
});

// Methods
CustomerSchema.methods.updateRiskLevel = function (level, factors) {
  this.riskProfile.riskLevel = level;
  if (factors && factors.length > 0) {
    this.riskProfile.riskFactors.push(...factors);
  }
  this.riskProfile.lastRiskAssessment = new Date();
  return this.save();
};

CustomerSchema.methods.addDocument = function (docType, url) {
  this.verification.documentsSubmitted.push({
    type: docType,
    url: url,
    uploadedAt: new Date(),
  });
  return this.save();
};

CustomerSchema.methods.approveDocument = function (documentId, adminId) {
  const doc = this.verification.documentsSubmitted.id(documentId);
  if (doc) {
    doc.status = "approved";
    doc.reviewedBy = adminId;
    doc.reviewedAt = new Date();
  }
  return this.save();
};

CustomerSchema.methods.flagAsSuspicious = function (reason, adminId) {
  this.flags.isSuspicious = true;
  this.notes.adminNotes = `${this.notes.adminNotes || ""}\n[FLAGGED as suspicious: ${reason}]`;
  this.riskProfile.riskFactors.push({
    factor: "suspicious_pattern",
    severity: "high",
    notes: reason,
  });
  return this.save();
};

// Static methods
CustomerSchema.statics.findByName = function (searchTerm) {
  const regex = new RegExp(searchTerm, "i");
  return this.find({
    $or: [
      { "personalInfo.firstName": regex },
      { "personalInfo.lastName": regex },
    ],
  });
};

CustomerSchema.statics.findByPhone = function (phoneNumber) {
  return this.find({
    $or: [
      { "personalInfo.phoneNumber": phoneNumber },
      { "personalInfo.alternatePhone": phoneNumber },
    ],
  });
};

CustomerSchema.statics.getHighRiskCustomers = function () {
  return this.find({
    $or: [
      { "riskProfile.riskLevel": "high" },
      { "riskProfile.riskLevel": "critical" },
      { "flags.isSuspicious": true },
    ],
  });
};

CustomerSchema.statics.getVIPCustomers = function () {
  return this.find({ "flags.isVIP": true });
};

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);