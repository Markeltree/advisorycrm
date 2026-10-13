import mongoose from 'mongoose';

const complianceEventSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, index: true },
    contactId: { type: String, default: null, index: true },
    contactName: { type: String, required: true },
    event: { type: String, required: true },
    channel: { type: String, default: 'System' },
    detail: { type: String, default: '' },
    at: { type: Date, default: Date.now },
    userId: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

complianceEventSchema.pre('save', function () {
  if (!this.id) {
    this.id = this._id.toString();
  }
});

export const ComplianceEvent =
  mongoose.models.ComplianceEvent || mongoose.model('ComplianceEvent', complianceEventSchema);
