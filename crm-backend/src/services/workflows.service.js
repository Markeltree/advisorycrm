import { notFound } from '../lib/errors.js';
import { toWorkflow } from '../lib/mappers.js';
import { Workflow } from '../models/Workflow.js';
import { audit } from './shared.js';

const DEFAULT_WORKFLOWS = [
  { id: 1, name: 'New Lead Intake & Consent Capture', trigger: 'Form submission or lead vendor webhook', mode: 'Automated', gate: 'Consent recorded before any outreach', phase: 1, buildStatus: 'Live' },
  { id: 2, name: 'Initial AI Voice Outreach', trigger: 'Lead created and consent Given', mode: 'Automated (AI voice)', gate: 'Fixed disclosure line, pilot one category first', phase: 3, buildStatus: 'In Progress' },
  { id: 3, name: 'No-Answer Follow-Up', trigger: 'Call outcome = No Answer', mode: 'Automated (voicemail and SMS)', gate: 'SMS wording is fixed', phase: 2, buildStatus: 'Live' },
  { id: 4, name: 'Booking Confirmation & Reschedule', trigger: 'Calendar event booked', mode: 'Automated', gate: 'Unresolved conflicts escalate to a person', phase: 2, buildStatus: 'Live' },
  { id: 5, name: 'Reminder Cadence', trigger: '48h, 24h and morning-of the booked event', mode: 'Automated', gate: 'None', phase: 2, buildStatus: 'Live' },
  { id: 6, name: 'Illustration Drafting, Advisor Approval', trigger: 'Discovery call marked complete', mode: 'AI draft, advisor approves', gate: 'Required approval task', phase: 4, buildStatus: 'In Progress' },
  { id: 7, name: 'Underwriting Status Monitor', trigger: 'Scheduled poll or portal webhook', mode: 'Automated', gate: 'Portal failure flags the case for manual handling', phase: 4, buildStatus: 'Planned' },
  { id: 8, name: 'Missing-Document Request', trigger: 'Underwriting flags a missing item', mode: 'AI draft, team approves', gate: 'Required approval task', phase: 4, buildStatus: 'In Progress' },
  { id: 9, name: 'Friday Recap Email', trigger: 'Weekly schedule', mode: 'AI draft, manual approval', gate: 'Required approval task', phase: 4, buildStatus: 'Live' },
  { id: 10, name: 'Birthday, Holiday & Anniversary Greetings', trigger: 'Date-based', mode: 'Automated', gate: 'Suppressed for opted-out contacts', phase: 5, buildStatus: 'Planned' },
  { id: 11, name: 'Referral Request Trigger', trigger: 'Pipeline stage = Client (In-Force)', mode: 'Automated trigger, human writes the ask', gate: 'Advisor personalizes the request', phase: 5, buildStatus: 'Planned' },
  { id: 12, name: 'DNC & Opt-Out Handler', trigger: 'STOP reply, verbal opt-out or manual flag', mode: 'Automated, all workflows', gate: 'Immediate and system-wide', phase: 2, buildStatus: 'Live' },
];

export async function listWorkflows(_db) {
  let docs = await Workflow.find({}).sort({ id: 1 });
  if (docs.length === 0) {
    await Workflow.insertMany(DEFAULT_WORKFLOWS);
    docs = await Workflow.find({}).sort({ id: 1 });
  }
  return docs.map(toWorkflow);
}

export async function updateWorkflow(_db, id, { buildStatus }, { user }) {
  const doc = await Workflow.findOne({ id: Number(id) });
  if (!doc) throw notFound('Workflow not found.');

  doc.buildStatus = buildStatus;
  await doc.save();

  await audit(_db, user, 'workflow.update', 'workflow', id, { buildStatus });
  return toWorkflow(doc);
}
