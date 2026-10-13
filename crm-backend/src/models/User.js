import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    fullName: { type: String, default: '' },
    role: { type: String, enum: ['admin', 'advisor', 'staff'], default: 'advisor' },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Map _id to id if id is not set
userSchema.pre('save', function () {
  if (!this.id) {
    this.id = this._id.toString();
  }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
