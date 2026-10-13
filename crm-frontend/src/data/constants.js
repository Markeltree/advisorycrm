// Shared vocabulary taken from the requirements document (Appendix A and Sections 3, 6, 7).
// Keep these in sync with the backend enums.

// Pipeline stages, Appendix A.2 (New Business pipeline).
export const STAGES = [
  'New Lead',
  'Contacted',
  'Discovery Call Booked',
  'Discovery Call Completed',
  'Illustration Sent (Pending Advisor Approval)',
  'Illustration Approved & Sent',
  'Application Submitted',
  'Underwriting',
  'Approved / Issued',
  'Client (In-Force)',
  'Lapsed / Lost',
];

// Retention pipeline runs after issue (Appendix A.2).
export const RETENTION_STAGES = ['In-Force', 'Review Scheduled', 'Referral Requested', 'Referral Received'];

// Lead categories, Section 1.2.
export const LEAD_CATEGORIES = [
  'Mortgage Protection',
  'High Income / Doctors',
  'Business Owners / Corporate',
  'Affinity / Community',
  'Veterans',
  'Family Offices',
  'Retirement / 55+',
];

// Product interest. Section 1.1 and Appendix A.1 name slightly different products; this list is the union.
export const PRODUCTS = [
  'Whole Life',
  'Indexed Universal Life',
  'Term',
  'Annuity',
  'Disability',
  'Long Term Care',
  'Mortgage Protection',
];

export const LICENSING_STATUSES = ['Licensed', 'Not Licensed', 'Pending Verification'];
export const CONSENT_STATUSES = ['Not Captured', 'Given', 'Opted Out'];
export const ESTATE_STATUSES = ['None', 'In Progress', 'Complete'];
export const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed', 'Other'];

// Placeholder list of states where the agency is licensed. Section 10 leaves this open.
// Replace with the real licensing footprint before go-live.
export const LICENSED_STATES = ['AZ', 'CO', 'FL', 'GA', 'NJ', 'NY', 'OH', 'TN', 'TX'];

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM',
  'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA',
  'WV', 'WI', 'WY',
];

// Section 7: how each approval item is handled.
export const APPROVAL_TYPES = [
  'Illustration',
  'Missing document request',
  'Friday recap email',
  'Referral request',
  'Objection escalation',
];

// Appendix A.4 core workflows.
export const WORKFLOWS = [
  { id: 1, name: 'New Lead Intake & Consent Capture', trigger: 'Form submission or lead vendor webhook', mode: 'Automated', gate: 'Consent recorded before any outreach', phase: 1 },
  { id: 2, name: 'Initial AI Voice Outreach', trigger: 'Lead created and consent Given', mode: 'Automated (AI voice)', gate: 'Fixed disclosure line, pilot one category first', phase: 3 },
  { id: 3, name: 'No-Answer Follow-Up', trigger: 'Call outcome = No Answer', mode: 'Automated (voicemail and SMS)', gate: 'SMS wording is fixed', phase: 2 },
  { id: 4, name: 'Booking Confirmation & Reschedule', trigger: 'Calendar event booked', mode: 'Automated', gate: 'Unresolved conflicts escalate to a person', phase: 2 },
  { id: 5, name: 'Reminder Cadence', trigger: '48h, 24h and morning-of the booked event', mode: 'Automated', gate: 'None', phase: 2 },
  { id: 6, name: 'Illustration Drafting, Advisor Approval', trigger: 'Discovery call marked complete', mode: 'AI draft, advisor approves', gate: 'Required approval task', phase: 4 },
  { id: 7, name: 'Underwriting Status Monitor', trigger: 'Scheduled poll or portal webhook', mode: 'Automated', gate: 'Portal failure flags the case for manual handling', phase: 4 },
  { id: 8, name: 'Missing-Document Request', trigger: 'Underwriting flags a missing item', mode: 'AI draft, team approves', gate: 'Required approval task', phase: 4 },
  { id: 9, name: 'Friday Recap Email', trigger: 'Weekly schedule', mode: 'AI draft, manual approval', gate: 'Required approval task', phase: 4 },
  { id: 10, name: 'Birthday, Holiday & Anniversary Greetings', trigger: 'Date-based', mode: 'Automated', gate: 'Suppressed for opted-out contacts', phase: 5 },
  { id: 11, name: 'Referral Request Trigger', trigger: 'Pipeline stage = Client (In-Force)', mode: 'Automated trigger, human writes the ask', gate: 'Advisor personalizes the request', phase: 5 },
  { id: 12, name: 'DNC & Opt-Out Handler', trigger: 'STOP reply, verbal opt-out or manual flag', mode: 'Automated, all workflows', gate: 'Immediate and system-wide', phase: 2 },
];

// Appendix B.2 and B.3 wording, shown read-only. Not legal advice; pending legal review.
export const APPROVED_WORDING = {
  disclosure:
    'Hi, this is [Assistant Name], calling on behalf of [Advisor Name] at [Agency Name] regarding the [life insurance / retirement planning] information you requested. This call may be recorded for quality and training purposes. Do you have a couple of minutes to talk?',
  smsOptIn:
    '[Agency Name]: Thanks for your interest in [product]! Msg freq varies, msg & data rates may apply. Reply STOP to unsubscribe, HELP for help.',
  smsFooter: 'Reply STOP to opt out.',
  webConsent:
    'By checking this box and submitting this form, I consent to receive calls and text messages, including via automated dialing systems and artificial or prerecorded voice, from [Agency Name] and its representatives at the phone number provided, for marketing purposes regarding life insurance and retirement planning products. Consent is not a condition of purchase. Message and data rates may apply. Message frequency varies. Reply STOP to opt out of texts at any time, or HELP for help. See our Privacy Policy and Terms.',
};
