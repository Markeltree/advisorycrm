import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, required: true },
    name: { type: String, required: true },
    trigger: { type: String, required: true },
    mode: { type: String, required: true },
    gate: { type: String, required: true },
    phase: { type: Number, required: true },
    buildStatus: {
      type: String,
      enum: ['Live', 'In Progress', 'Paused', 'Planned'],
      default: 'Planned',
    },
  },
  {
    timestamps: true,
  }
);

export const Workflow = mongoose.models.Workflow || mongoose.model('Workflow', workflowSchema);
