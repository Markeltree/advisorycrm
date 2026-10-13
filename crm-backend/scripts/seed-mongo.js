import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { loadConfig } from '../src/config.js';
import { connectMongo } from '../src/db/mongo.js';
import { createLogger } from '../src/logger.js';
import { Approval } from '../src/models/Approval.js';
import { ComplianceEvent } from '../src/models/ComplianceEvent.js';
import { Contact } from '../src/models/Contact.js';
import { Setting } from '../src/models/Setting.js';
import { User } from '../src/models/User.js';
import { Workflow } from '../src/models/Workflow.js';
import { approvals, complianceEvents, contacts } from './seed-data.js';

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

const LICENSED_STATES = ['AZ', 'CA', 'CO', 'FL', 'GA', 'NJ', 'NY', 'TX', 'WA'];

async function run() {
  const config = loadConfig();
  const logger = createLogger('info');
  const db = await connectMongo(config.MONGODB_URI, logger);

  logger.info('Connected to MongoDB. Starting database seed...');

  // 1. Seed Users
  await User.deleteMany({});
  const advisorHash = await bcrypt.hash('password123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  await User.create([
    {
      id: 'u_advisor',
      email: 'advisor@agency.com',
      password: advisorHash,
      fullName: 'Alex Vance, CFP',
      role: 'advisor',
      isActive: true,
    },
    {
      id: 'u_admin',
      email: 'admin@agency.com',
      password: adminHash,
      fullName: 'Admin Advisor',
      role: 'admin',
      isActive: true,
    },
  ]);
  logger.info('Created default advisor and admin users.');

  // 2. Seed Settings
  await Setting.deleteMany({});
  await Setting.create({
    key: 'licensed_states',
    value: LICENSED_STATES,
    updatedBy: 'u_admin',
  });
  logger.info('Saved licensed states settings.');

  // 3. Seed Workflows
  await Workflow.deleteMany({});
  await Workflow.insertMany(DEFAULT_WORKFLOWS);
  logger.info('Seeded 12 core workflows.');

  // 4. Seed Contacts
  await Contact.deleteMany({});
  await Contact.insertMany(
    contacts.map((c) => ({
      ...c,
      activity: (c.activity || []).map((a) => ({
        ...a,
        direction: 'outbound',
        handledBy: 'advisor',
      })),
    }))
  );
  logger.info(`Seeded ${contacts.length} demo contacts.`);

  // 5. Seed Approvals
  await Approval.deleteMany({});
  await Approval.insertMany(approvals);
  logger.info(`Seeded ${approvals.length} approval queue items.`);

  // 6. Seed Compliance Events
  await ComplianceEvent.deleteMany({});
  await ComplianceEvent.insertMany(complianceEvents);
  logger.info(`Seeded ${complianceEvents.length} compliance events.`);

  logger.info('MongoDB seed completed successfully!');
  await db.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
