import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  magicKey: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values but ensure uniqueness for non-null values
    index: true
  },
  // IP-based auto-login enhancement fields
  trustedIPs: [{
    ip: {
      type: String,
      required: true
    },
    firstSeen: {
      type: Date,
      default: Date.now
    },
    lastUsed: {
      type: Date,
      default: Date.now
    },
    userAgent: String, // Optional: store user agent for additional security context
    location: String   // Optional: store general location for user reference
  }],
  lastLoginIP: {
    type: String,
    index: true // Index for faster IP lookups
  },
  autoLoginEnabled: {
    type: Boolean,
    default: true // Users can disable IP-based auto-login for security
  },
  // Security tracking
  loginAttempts: {
    type: Number,
    default: 0
  },
  lastLoginAttempt: Date,
  accountLocked: {
    type: Boolean,
    default: false
  },
  lockUntil: Date
}, {
  timestamps: true // Automatically add createdAt and updatedAt fields
});

// Prevent model re-compilation during hot reloads in development
export default mongoose.models.User || mongoose.model('User', UserSchema);