import { z } from 'zod';
import {
  ACTIVITY_DIRECTIONS,
  APPROVAL_STATUSES,
  APPROVAL_TYPES,
  BUILD_STATUSES,
  CONSENT_STATUSES,
  ESTATE_STATUSES,
  HANDLERS,
  LEAD_CATEGORIES,
  LICENSING_STATUSES,
  MARITAL_STATUSES,
  OPT_OUT_CHANNELS,
  PRODUCTS,
  ROLES,
  STAGES,
  US_STATES,
} from '../domain/constants.js';
import { normalizePhone } from '../domain/rules.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (max) => z.string().trim().max(max, { error: `Keep this under ${max} characters.` });
const optionalText = (max) => text(max).default('');
const required = (max, message) =>
  z.string({ error: message }).trim().min(1, { error: message }).max(max, { error: `Keep this under ${max} characters.` });

const oneOf = (values, label) => z.enum(values, { error: `Choose a valid ${label}.` });

// Accepts numbers, numeric strings (lead vendors send strings), '' and null.
const amount = (max) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : typeof v === 'string' ? Number(v.replace(/[$,\s]/g, '')) : v),
    z.number({ error: 'Enter a number.' }).finite().min(0, { error: 'Enter zero or more.' }).max(max).nullable()
  );

const phone = z
  .string({ error: 'Enter a phone number with area code.' })
  .trim()
  .refine((v) => /^\+?[0-9()\-.\s]{7,25}$/.test(v) && normalizePhone(v) !== null, { error: 'Enter a phone number with area code.' });

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .refine((v) => v === '' || EMAIL_RE.test(v), { error: 'Enter a valid email, or leave it blank.' });

const dob = z
  .union([z.literal(''), z.null(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Use the format YYYY-MM-DD.' })])
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || (!Number.isNaN(Date.parse(v)) && new Date(v) <= new Date() && v >= '1900-01-01'), {
    error: 'Enter a real date of birth in the past.',
  });

// No defaults here: updateContactSchema is built from these, and Zod applies defaults
// even inside .partial(), which would overwrite fields a PATCH did not send.
const contactFields = {
  firstName: required(100, 'Enter a first name.'),
  lastName: required(100, 'Enter a last name.'),
  phone,
  email,
  dob,
  state: oneOf(US_STATES, 'resident state'),
  leadCategory: oneOf(LEAD_CATEGORIES, 'lead category'),
  productInterest: oneOf(PRODUCTS, 'product of interest'),
  leadEntryReason: required(2000, 'Record the exact reason this person became a lead.'),
  referralSource: text(200),
  maritalStatus: z.union([z.literal(''), oneOf(MARITAL_STATUSES, 'marital status')]),
  dependents: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : typeof v === 'string' ? Number(v) : v),
    z.number({ error: 'Enter a whole number.' }).int().min(0).max(50).nullable()
  ),
  income: amount(1e11),
  assets: amount(1e12),
  debt: amount(1e12),
  primaryConcern: text(2000),
  employer: text(200),
  estateStatus: oneOf(ESTATE_STATUSES, 'estate plan status'),
  householdName: text(200),
};

// licensingStatus from the client is ignored: the server decides it from the licensed footprint.
export const createContactSchema = z.object({
  ...contactFields,
  email: email.default(''),
  dob: dob.default(null),
  referralSource: contactFields.referralSource.default(''),
  maritalStatus: contactFields.maritalStatus.default(''),
  primaryConcern: contactFields.primaryConcern.default(''),
  employer: contactFields.employer.default(''),
  estateStatus: contactFields.estateStatus.default('None'),
  householdName: contactFields.householdName.default(''),
  consentStatus: z.enum(['Given', 'Not Captured'], { error: 'New contacts start as Given or Not Captured. Use the opt-out endpoint to opt out.' }).default('Not Captured'),
  consentSource: optionalText(200),
});

export const updateContactSchema = z
  .object({
    ...contactFields,
    nextStep: text(500),
    aiEscalated: z.boolean(),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { error: 'Send at least one field to update.' });

export const contactFiltersSchema = z.object({
  query: z.string().trim().max(200).optional(),
  category: oneOf(LEAD_CATEGORIES, 'lead category').optional(),
  consent: oneOf(CONSENT_STATUSES, 'consent status').optional(),
  licensing: oneOf(LICENSING_STATUSES, 'licensing status').optional(),
  stage: oneOf(STAGES, 'stage').optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
  offset: z.coerce.number().int().min(0).default(0),
});

export const stageSchema = z.object({ stage: oneOf(STAGES, 'pipeline stage') });

export const optOutSchema = z.object({
  channel: oneOf(OPT_OUT_CHANNELS, 'opt-out channel'),
  trigger: required(200, 'Record what triggered the opt-out.'),
});

export const consentSchema = z.object({
  source: required(200, 'Record where consent was captured.'),
});

export const licensingSchema = z.object({
  status: oneOf(LICENSING_STATUSES, 'licensing status'),
  note: optionalText(500),
});

export const activitySchema = z.object({
  type: z.enum(['call', 'sms', 'email', 'note'], { error: 'Activity type must be call, sms, email or note.' }),
  direction: oneOf(ACTIVITY_DIRECTIONS, 'direction').optional(),
  handledBy: oneOf(HANDLERS, 'handler').default('human'),
  summary: required(2000, 'Summarize the activity.'),
  outcome: optionalText(100),
  at: z.iso.datetime({ offset: true, error: 'Use an ISO 8601 timestamp.' }).optional(),
});

export const approvalFiltersSchema = z.object({
  status: oneOf(APPROVAL_STATUSES, 'approval status').optional(),
  contactId: z.uuid({ error: 'contactId must be a contact id.' }).optional(),
});

export const createApprovalSchema = z
  .object({
    type: oneOf(APPROVAL_TYPES, 'approval type'),
    contactId: z.uuid({ error: 'contactId must be a contact id.' }).nullable().optional(),
    contactName: optionalText(200),
    draft: required(10000, 'Add the draft text for review.'),
  })
  .refine((v) => v.contactId || v.contactName, { error: 'Link a contact or give the item a name.', path: ['contactName'] });

// decidedBy from the client is ignored: the server records the signed-in user.
export const decisionSchema = z.object({
  decision: z.enum(['approve', 'reject'], { error: 'Decision must be approve or reject.' }),
  note: optionalText(1000),
});

export const complianceFiltersSchema = z.object({
  contactId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(200),
});

export const metricsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(3650).default(30),
});

export const workflowUpdateSchema = z.object({ buildStatus: oneOf(BUILD_STATUSES, 'build status') });

export const licensedStatesSchema = z.object({
  states: z.array(oneOf(US_STATES, 'state')).max(US_STATES.length).transform((s) => [...new Set(s)].sort()),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().refine((v) => EMAIL_RE.test(v), { error: 'Enter the email address on your advisor account.' }),
  password: z.string().min(1, { error: 'Enter your password.' }).max(200),
});

export const refreshSchema = z.object({ refreshToken: z.string().min(1, { error: 'refreshToken is required.' }) });

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().refine((v) => EMAIL_RE.test(v), { error: 'Enter a valid email.' }),
  password: z.string().min(6, { error: 'Use at least 6 characters.' }).max(200),
  fullName: optionalText(200),
  role: oneOf(ROLES, 'role').default('advisor'),
});

export const updateUserSchema = z
  .object({
    fullName: text(200),
    role: oneOf(ROLES, 'role'),
    isActive: z.boolean(),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { error: 'Send at least one field to update.' });

export const idParam = z.object({ id: z.string().min(1, { error: 'Not found.' }) });
export const workflowIdParam = z.object({ id: z.coerce.number().int().min(1) });

export const smsInboundSchema = z.object({
  From: z.string().min(1),
  Body: z.string().default(''),
});
