import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, index: true },
    type: { type: String, required: true },
    contactId: { type: String, default: null, index: true },
    contactName: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    draft: { type: String, required: true },
    decidedAt: { type: Date, default: null },
    decidedBy: { type: String, default: null },
    decidedByUserId: { type: String, default: null },
    decisionNote: { type: String, default: null },
    createdBy: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

approvalSchema.pre('save', function () {
  if (!this.id) {
    this.id = this._id.toString();
  }
});

export const Approval = mongoose.models.Approval || mongoose.model('Approval', approvalSchema);
