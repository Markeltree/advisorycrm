import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, index: true },
    actorId: { type: String, default: null },
    actorName: { type: String, default: 'System' },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, default: null },
    payload: { type: mongoose.Schema.Types.Mixed },
    at: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.pre('save', function () {
  if (!this.id) {
    this.id = this._id.toString();
  }
});

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
