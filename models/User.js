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
  }
}, {
  timestamps: true // Automatically add createdAt and updatedAt fields
});

// Prevent model re-compilation during hot reloads in development
export default mongoose.models.User || mongoose.model('User', UserSchema);