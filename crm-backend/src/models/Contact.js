import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    id: { type: String },
    contactId: { type: String },
    type: { type: String, required: true },
    direction: { type: String, default: 'outbound' },
    handledBy: { type: String, default: 'advisor' },
    at: { type: Date, default: Date.now },
    summary: { type: String, required: true },
    outcome: { type: String, default: '' },
    user: { type: String, default: null },
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    dob: { type: String, default: null },
    state: { type: String, required: true },
    leadCategory: { type: String, default: '' },
    productInterest: { type: String, default: '' },
    stage: { type: String, default: 'New Lead', index: true },
    consentStatus: {
      type: String,
      enum: ['Given', 'Not Captured', 'Opted Out'],
      default: 'Not Captured',
      index: true,
    },
    consentTimestamp: { type: Date, default: null },
    consentSource: { type: String, default: '' },
    licensingStatus: {
      type: String,
      enum: ['Licensed', 'Pending Verification', 'Not Licensed'],
      default: 'Pending Verification',
      index: true,
    },
    leadEntryReason: { type: String, default: '' },
    referralSource: { type: String, default: '' },
    maritalStatus: { type: String, default: '' },
    dependents: { type: Number, default: null },
    income: { type: Number, default: null },
    assets: { type: Number, default: null },
    debt: { type: Number, default: null },
    primaryConcern: { type: String, default: '' },
    employer: { type: String, default: '' },
    estateStatus: { type: String, default: 'None' },
    householdName: { type: String, default: '' },
    aiEscalated: { type: Boolean, default: false },
    nextStep: { type: String, default: '' },
    lastContactAt: { type: Date, default: null },
    tags: [{ type: String }],
    optOut: {
      at: { type: Date, default: null },
      channel: { type: String, default: null },
      trigger: { type: String, default: null },
    },
    furthestStageRank: { type: Number, default: 0 },
    source: { type: String, default: 'manual' },
    activity: [activitySchema],
  },
  {
    timestamps: true,
  }
);

contactSchema.pre('save', function () {
  if (!this.id) {
    this.id = this._id.toString();
  }
});

export const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);
