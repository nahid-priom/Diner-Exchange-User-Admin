import mongoose from "mongoose";

const UserOrderSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: "Please enter a valid email address",
    },
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    trim: true,
  },
  postcode: {
    type: String,
    required: true,
    trim: true,
  },
  currency: {
    type: String,
    required: true,
    enum: ["IQD", "ZWL"], // Iraqi Dinar or Zimbabwe Dollar
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  idFileUrl: {
    type: String,
    required: true,
  },
  acceptTerms: {
    type: Boolean,
    required: true,
    validate: {
      validator: function(v) {
        return v === true;
      },
      message: "Terms must be accepted",
    },
  },
  paymentMethod: {
    type: String,
    enum: ["bank_transfer", "online_payment", "cash"],
    default: "bank_transfer",
  },
  paymentReceiptUrl: {
    type: String,
  },
  skipReceipt: {
    type: Boolean,
    default: false,
  },
  comments: {
    type: String,
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ["pending", "processing", "approved", "rejected", "completed"],
    default: "pending",
  },
  adminNotes: {
    type: String,
    maxlength: 2000,
  },
  processedAt: {
    type: Date,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
}, { 
  collection: "userorders", // Different collection name to avoid conflicts
  timestamps: true 
});

// Indexes for performance
UserOrderSchema.index({ email: 1 });
UserOrderSchema.index({ status: 1 });
UserOrderSchema.index({ currency: 1 });
UserOrderSchema.index({ createdAt: -1 });
UserOrderSchema.index({ email: 1, status: 1 });

// Virtual for full address
UserOrderSchema.virtual("fullAddress").get(function () {
  return `${this.address}, ${this.city}${this.state ? `, ${this.state}` : ""}, ${this.postcode}, ${this.country}`;
});

export default mongoose.models.UserOrder || mongoose.model("UserOrder", UserOrderSchema);