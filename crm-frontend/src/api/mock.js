// In-memory sample data that mirrors the backend contract in README.md.
// Used when VITE_USE_MOCK is not "false". Writes last until the page reloads.

import { WORKFLOWS } from '../data/constants.js';

const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();
const daysAgo = (d) => hoursAgo(d * 24);
const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), 180));

let nextContactId = 100;
let nextApprovalId = 100;

const contacts = [
  {
    id: 'c1', firstName: 'Maya', lastName: 'Chen', phone: '(214) 555-0182', email: 'maya.chen@example.com',
    state: 'TX', dob: '1978-04-02', leadCategory: 'Business Owners / Corporate', productInterest: 'Whole Life',
    stage: 'Discovery Call Booked', consentStatus: 'Given', consentTimestamp: daysAgo(4), consentSource: 'Website form (consent checkbox v2)',
    licensingStatus: 'Licensed', leadEntryReason: 'Downloaded the business succession checklist from the website and asked about funding a buy-sell agreement.',
    maritalStatus: 'Married', dependents: 2, income: 240000, assets: 1100000, debt: 380000,
    primaryConcern: 'Fund a buy-sell agreement if a partner dies or becomes disabled.', employer: 'Chen Dental Group',
    estateStatus: 'In Progress', referralSource: '', householdName: 'Chen household', aiEscalated: false,
    nextStep: 'Discovery call, Thursday 10:00 AM', lastContactAt: hoursAgo(6), tags: ['lead-category:business-owners', 'product:whole-life', 'consent:given', 'license:verified'],
    activity: [
      { id: 'a1', type: 'call', at: hoursAgo(6), summary: 'AI voice call completed. Discovery facts captured.', outcome: 'Connected' },
      { id: 'a2', type: 'sms', at: hoursAgo(5), summary: 'Booking confirmation sent with calendar invite.', outcome: 'Delivered' },
      { id: 'a3', type: 'consent', at: daysAgo(4), summary: 'Consent captured on website form.', outcome: 'Given' },
    ],
  },
  {
    id: 'c2', firstName: 'Daniel', lastName: 'Okafor', phone: '(305) 555-0147', email: 'd.okafor@example.com',
    state: 'FL', dob: '1981-11-19', leadCategory: 'High Income / Doctors', productInterest: 'Indexed Universal Life',
    stage: 'Illustration Sent (Pending Advisor Approval)', consentStatus: 'Given', consentTimestamp: daysAgo(12), consentSource: 'Referral partner: CPA firm, consent logged on call',
    licensingStatus: 'Licensed', leadEntryReason: 'Referred by a colleague after a grand rounds talk on tax-advantaged savings.',
    maritalStatus: 'Married', dependents: 1, income: 410000, assets: 780000, debt: 520000,
    primaryConcern: 'Supplemental retirement income and tax diversification.', employer: 'Okafor Orthopedics PA',
    estateStatus: 'None', referralSource: 'Colleague', householdName: 'Okafor household', aiEscalated: true,
    nextStep: 'Advisor reviews illustration draft', lastContactAt: daysAgo(1), tags: ['lead-category:high-income', 'product:iul', 'consent:given', 'ai-escalated'],
    activity: [{ id: 'a4', type: 'call', at: daysAgo(1), summary: 'Discovery call completed. Client asked about premium affordability.', outcome: 'Completed' }],
  },
  {
    id: 'c3', firstName: 'Rosa', lastName: 'Alvarez', phone: '(415) 555-0163', email: 'rosa.a@example.com',
    state: 'CA', dob: '1985-07-30', leadCategory: 'Mortgage Protection', productInterest: 'Mortgage Protection',
    stage: 'New Lead', consentStatus: 'Given', consentTimestamp: hoursAgo(2), consentSource: 'Landing page: refinance form',
    licensingStatus: 'Pending Verification', leadEntryReason: 'Filled out the mortgage protection form on the refinance landing page.',
    maritalStatus: 'Single', dependents: 0, income: 96000, assets: 62000, debt: 410000,
    primaryConcern: 'Keep the mortgage paid if something happens to income.', employer: 'Alvarez Design Studio',
    estateStatus: 'None', referralSource: '', householdName: '', aiEscalated: false,
    nextStep: 'Verify CA licensing before any outreach', lastContactAt: null, tags: ['lead-category:mortgage-protection', 'consent:given', 'license:unverified'],
    activity: [],
  },
  {
    id: 'c4', firstName: 'James', lastName: 'Whitfield', phone: '(212) 555-0191', email: 'jwhitfield@example.com',
    state: 'NY', dob: '1966-02-11', leadCategory: 'Retirement / 55+', productInterest: 'Annuity',
    stage: 'Contacted', consentStatus: 'Not Captured', consentTimestamp: null, consentSource: '',
    licensingStatus: 'Licensed', leadEntryReason: 'Attended the retirement income webinar and asked for a follow-up.',
    maritalStatus: 'Married', dependents: 0, income: 150000, assets: 1450000, debt: 90000,
    primaryConcern: 'Guaranteed income starting at 65.', employer: 'Retired',
    estateStatus: 'Complete', referralSource: '', householdName: 'Whitfield household', aiEscalated: false,
    nextStep: 'Hold: consent not captured. No automated outreach', lastContactAt: daysAgo(3), tags: ['lead-category:retirement', 'consent:not-captured'],
    activity: [{ id: 'a5', type: 'email', at: daysAgo(3), summary: 'Webinar follow-up email sent by a staff member.', outcome: 'Delivered' }],
  },
  {
    id: 'c5', firstName: 'Angela', lastName: 'Brooks', phone: '(206) 555-0128', email: 'angela.b@example.com',
    state: 'WA', dob: '1990-09-05', leadCategory: 'Veterans', productInterest: 'Disability',
    stage: 'New Lead', consentStatus: 'Given', consentTimestamp: daysAgo(1), consentSource: 'Veterans benefits fair: paper form',
    licensingStatus: 'Not Licensed', leadEntryReason: 'Walked up to the agency booth at a veterans benefits fair.',
    maritalStatus: 'Single', dependents: 0, income: 68000, assets: 15000, debt: 22000,
    primaryConcern: 'Income protection while in a civilian job search.', employer: '',
    estateStatus: 'None', referralSource: 'Veterans benefits fair', householdName: '', aiEscalated: false,
    nextStep: 'Route to licensed referral partner (out of state)', lastContactAt: null, tags: ['lead-category:veterans', 'license:not-licensed'],
    activity: [],
  },
  {
    id: 'c6', firstName: 'Samuel', lastName: 'Reyes', phone: '(480) 555-0176', email: 's.reyes@example.com',
    state: 'AZ', dob: '1972-12-14', leadCategory: 'Veterans', productInterest: 'Disability',
    stage: 'Discovery Call Completed', consentStatus: 'Given', consentTimestamp: daysAgo(9), consentSource: 'Veterans service org newsletter sign-up',
    licensingStatus: 'Licensed', leadEntryReason: 'Signed up for the veterans service organization newsletter and asked about disability coverage.',
    maritalStatus: 'Married', dependents: 3, income: 88000, assets: 120000, debt: 160000,
    primaryConcern: 'Coverage if a service-connected condition limits work.', employer: 'Phoenix Logistics',
    estateStatus: 'In Progress', referralSource: 'VSO newsletter', householdName: 'Reyes household', aiEscalated: true,
    nextStep: 'Escalated: client wants to speak with spouse first', lastContactAt: daysAgo(2), tags: ['lead-category:veterans', 'product:disability', 'ai-escalated'],
    activity: [{ id: 'a6', type: 'call', at: daysAgo(2), summary: 'Discovery call completed. Client objected to timing.', outcome: 'Escalated' }],
  },
  {
    id: 'c7', firstName: 'Priya', lastName: 'Nair', phone: '(404) 555-0139', email: 'priya.nair@example.com',
    state: 'GA', dob: '1969-06-22', leadCategory: 'Family Offices', productInterest: 'Annuity',
    stage: 'Application Submitted', consentStatus: 'Given', consentTimestamp: daysAgo(30), consentSource: 'Family office introduction',
    licensingStatus: 'Licensed', leadEntryReason: 'Introduced by a family office principal for a legacy income plan.',
    maritalStatus: 'Married', dependents: 2, income: 320000, assets: 4200000, debt: 0,
    primaryConcern: 'Predictable income for family members.', employer: 'Nair Holdings',
    estateStatus: 'Complete', referralSource: 'Family office principal', householdName: 'Nair household', aiEscalated: false,
    nextStep: 'Carrier e-application pending', lastContactAt: daysAgo(4), tags: ['lead-category:family-office', 'product:annuity'],
    activity: [],
  },
  {
    id: 'c8', firstName: 'Thomas', lastName: 'Keller', phone: '(972) 555-0154', email: 't.keller@example.com',
    state: 'TX', dob: '1989-03-08', leadCategory: 'Affinity / Community', productInterest: 'Term',
    stage: 'Underwriting', consentStatus: 'Given', consentTimestamp: daysAgo(21), consentSource: 'Affinity group member portal',
    licensingStatus: 'Licensed', leadEntryReason: 'Member of the trade association that offers the group term rate.',
    maritalStatus: 'Married', dependents: 1, income: 72000, assets: 35000, debt: 210000,
    primaryConcern: 'Cover the mortgage and childcare costs.', employer: 'Keller Electric',
    estateStatus: 'None', referralSource: 'Trade association', householdName: 'Keller household', aiEscalated: true,
    nextStep: 'Missing: driver licence and two pay stubs', lastContactAt: daysAgo(1), tags: ['lead-category:affinity', 'product:term', 'ai-escalated'],
    activity: [],
  },
  {
    id: 'c9', firstName: 'Linda', lastName: 'Morales', phone: '(561) 555-0112', email: 'linda.m@example.com',
    state: 'FL', dob: '1961-10-27', leadCategory: 'Retirement / 55+', productInterest: 'Long Term Care',
    stage: 'Client (In-Force)', consentStatus: 'Given', consentTimestamp: daysAgo(180), consentSource: 'Advisor referral, in person',
    licensingStatus: 'Licensed', leadEntryReason: 'Asked about long term care after a family member needed in-home care.',
    maritalStatus: 'Widowed', dependents: 0, income: 64000, assets: 540000, debt: 0,
    primaryConcern: 'Protect savings from a care event.', employer: 'Retired',
    estateStatus: 'Complete', referralSource: '', householdName: 'Morales household', aiEscalated: false,
    nextStep: 'Referral request ready for advisor to personalize', lastContactAt: daysAgo(14), tags: ['product:ltc', 'stage:in-force'],
    activity: [{ id: 'a7', type: 'note', at: daysAgo(14), summary: 'Annual review completed. Policy in force.', outcome: 'Logged' }],
  },
  {
    id: 'c10', firstName: 'Robert', lastName: 'Haines', phone: '(615) 555-0170', email: 'r.haines@example.com',
    state: 'TN', dob: '1980-01-15', leadCategory: 'Mortgage Protection', productInterest: 'Mortgage Protection',
    stage: 'Lapsed / Lost', consentStatus: 'Opted Out', consentTimestamp: daysAgo(7), consentSource: 'SMS reply',
    licensingStatus: 'Licensed', leadEntryReason: 'Filled out the mortgage protection form on a paid search ad.',
    maritalStatus: 'Married', dependents: 2, income: 84000, assets: 40000, debt: 290000,
    primaryConcern: 'Protect mortgage payments.', employer: 'Haines Auto Repair',
    estateStatus: 'None', referralSource: '', householdName: '', aiEscalated: false,
    nextStep: 'None. Suppressed for all workflows', lastContactAt: daysAgo(7), tags: ['consent:opted-out'],
    optOut: { at: daysAgo(7), channel: 'SMS', trigger: 'STOP' },
    activity: [{ id: 'a8', type: 'sms', at: daysAgo(7), summary: 'Inbound SMS: "STOP"', outcome: 'Opted out' }],
  },
  {
    id: 'c11', firstName: 'Hannah', lastName: 'Lee', phone: '(201) 555-0108', email: 'hannah.lee@example.com',
    state: 'NJ', dob: '1983-05-03', leadCategory: 'High Income / Doctors', productInterest: 'Disability',
    stage: 'Discovery Call Booked', consentStatus: 'Given', consentTimestamp: daysAgo(3), consentSource: 'Website form (consent checkbox v2)',
    licensingStatus: 'Licensed', leadEntryReason: 'Searched for disability insurance for surgeons on the website.',
    maritalStatus: 'Single', dependents: 0, income: 380000, assets: 210000, debt: 300000,
    primaryConcern: 'Own-occupation disability cover.', employer: 'Lee Surgical Associates',
    estateStatus: 'None', referralSource: '', householdName: '', aiEscalated: false,
    nextStep: 'Reminder: 24h before call', lastContactAt: daysAgo(2), tags: ['lead-category:high-income', 'product:disability'],
    activity: [],
  },
  {
    id: 'c12', firstName: 'Michael', lastName: 'Donovan', phone: '(303) 555-0195', email: 'mdonovan@example.com',
    state: 'CO', dob: '1975-08-18', leadCategory: 'Business Owners / Corporate', productInterest: 'Term',
    stage: 'New Lead', consentStatus: 'Given', consentTimestamp: hoursAgo(9), consentSource: 'Referral partner: benefits broker',
    licensingStatus: 'Licensed', leadEntryReason: 'Referred by an employee-benefits broker for key person coverage.',
    maritalStatus: 'Married', dependents: 3, income: 195000, assets: 320000, debt: 240000,
    primaryConcern: 'Key person coverage for a growing company.', employer: 'Donovan Logistics LLC',
    estateStatus: 'In Progress', referralSource: 'Benefits broker', householdName: 'Donovan household', aiEscalated: false,
    nextStep: 'AI voice call queued', lastContactAt: null, tags: ['lead-category:business-owners', 'product:term'],
    activity: [],
  },
];

const approvals = [
  {
    id: 'ap1', type: 'Illustration', contactId: 'c2', contactName: 'Daniel Okafor', status: 'Pending', createdAt: hoursAgo(5),
    draft: 'Illustration summary for advisor review. Indexed universal life, premium $1,500 per month. Cash value projection at age 65 uses the carrier\'s current scenario only. Not for client delivery until the advisor signs off.',
  },
  {
    id: 'ap2', type: 'Missing document request', contactId: 'c8', contactName: 'Thomas Keller', status: 'Pending', createdAt: hoursAgo(3),
    draft: 'Hi Thomas, we are finishing your term application. We still need a copy of your driver licence (front and back) and your last two pay stubs. Reply here or use your secure upload link.',
  },
  {
    id: 'ap3', type: 'Objection escalation', contactId: 'c6', contactName: 'Samuel Reyes', status: 'Pending', createdAt: hoursAgo(2),
    draft: 'Client said "I need to talk to my wife first" and asked for a call Thursday evening. The AI did not offer a time. Escalated for a person to call back.',
  },
  {
    id: 'ap4', type: 'Referral request', contactId: 'c9', contactName: 'Linda Morales', status: 'Pending', createdAt: daysAgo(1),
    draft: 'Hi Linda, congratulations on your policy being issued. Is there a friend or family member who could benefit from a similar review? Happy to talk whenever suits you.',
  },
  {
    id: 'ap5', type: 'Friday recap email', contactId: null, contactName: 'Weekly recap (3 meetings)', status: 'Pending', createdAt: daysAgo(0),
    draft: 'Recap for the week of October 6. Three discovery calls completed, two illustrations drafted, one application submitted. Next week: two reminders and one underwriting follow-up.',
  },
  {
    id: 'ap0', type: 'Illustration', contactId: 'c7', contactName: 'Priya Nair', status: 'Approved', createdAt: daysAgo(3),
    decidedAt: daysAgo(2), decidedBy: 'Advisor (sample)',
    draft: 'Annuity illustration summary for advisor review. Single premium, income start at age 66.',
  },
];

const complianceEvents = [
  { id: 'e1', contactId: 'c10', contactName: 'Robert Haines', event: 'Opt-out', channel: 'SMS', at: daysAgo(7), detail: 'Trigger phrase: "STOP". All workflows suppressed.' },
  { id: 'e2', contactId: 'c5', contactName: 'Angela Brooks', event: 'Routed to hold queue', channel: 'System', at: daysAgo(1), detail: 'Resident state WA is outside the licensed footprint.' },
  { id: 'e3', contactId: 'c1', contactName: 'Maya Chen', event: 'Consent captured', channel: 'Web form', at: daysAgo(4), detail: 'Source: Website form (consent checkbox v2).' },
  { id: 'e4', contactId: 'c4', contactName: 'James Whitfield', event: 'Outreach blocked', channel: 'System', at: daysAgo(3), detail: 'Consent not captured. Automation paused for this contact.' },
];

const dashboard = {
  sampleData: true,
  speedToLeadMinutes: 6.4,
  callConnectRate: 0.34,
  bookingRate: 0.22,
  showUpRate: 0.71,
  quoteToApplicationRate: 0.18,
  aiHandledShare: 0.64,
  pendingApprovals: approvals.filter((a) => a.status === 'Pending').length,
  aiEscalations: contacts.filter((c) => c.aiEscalated).length,
  stageCounts: null,
};

function computeStageCounts() {
  const counts = {};
  for (const c of contacts) counts[c.stage] = (counts[c.stage] || 0) + 1;
  return counts;
}

function matchesFilters(contact, { query, category, consent, licensing, stage } = {}) {
  if (query) {
    const haystack = `${contact.firstName} ${contact.lastName} ${contact.state} ${contact.email}`.toLowerCase();
    if (!haystack.includes(query.toLowerCase())) return false;
  }
  if (category && contact.leadCategory !== category) return false;
  if (consent && contact.consentStatus !== consent) return false;
  if (licensing && contact.licensingStatus !== licensing) return false;
  if (stage && contact.stage !== stage) return false;
  return true;
}

export const mockApi = {
  // Sample mode accepts any email and password.
  login: (email) => delay({ accessToken: 'sample', refreshToken: null, expiresAt: null, user: { email, fullName: '', role: 'advisor' } }),
  logout: () => delay(null),

  listContacts: (filters) => delay(contacts.filter((c) => matchesFilters(c, filters))),

  getContact: (id) => {
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return Promise.reject(new Error('Contact not found.'));
    return delay({
      ...contact,
      approvals: approvals.filter((a) => a.contactId === id),
    });
  },

  createContact: (payload) => {
    const contact = {
      id: `c${nextContactId++}`,
      ...payload,
      stage: 'New Lead',
      licensingStatus: payload.licensingStatus || 'Pending Verification',
      consentTimestamp: payload.consentStatus === 'Given' ? new Date().toISOString() : null,
      aiEscalated: false,
      lastContactAt: null,
      householdName: payload.householdName || '',
      tags: [],
      activity: [],
      nextStep: payload.consentStatus === 'Given' ? 'Ready for AI voice outreach' : 'Hold: consent not captured',
    };
    contacts.unshift(contact);
    return delay(contact);
  },

  updateContactStage: (id, stage) => {
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return Promise.reject(new Error('Contact not found.'));
    contact.stage = stage;
    return delay(contact);
  },

  optOutContact: (id, details) => {
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return Promise.reject(new Error('Contact not found.'));
    contact.consentStatus = 'Opted Out';
    contact.optOut = { at: new Date().toISOString(), ...details };
    contact.nextStep = 'None. Suppressed for all workflows';
    complianceEvents.unshift({
      id: `e${Date.now()}`,
      contactId: id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      event: 'Opt-out',
      channel: details.channel,
      at: new Date().toISOString(),
      detail: `Trigger phrase: "${details.trigger}". All workflows suppressed.`,
    });
    return delay(contact);
  },

  listApprovals: (status) => {
    const list = status ? approvals.filter((a) => a.status === status) : approvals;
    return delay([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  },

  decideApproval: (id, { decision, decidedBy }) => {
    const item = approvals.find((a) => a.id === id);
    if (!item) return Promise.reject(new Error('Approval not found.'));
    if (item.status !== 'Pending') return Promise.reject(new Error('This item was already decided.'));
    item.status = decision === 'approve' ? 'Approved' : 'Rejected';
    item.decidedAt = new Date().toISOString();
    item.decidedBy = decidedBy || 'Advisor (sample)';
    return delay(item);
  },

  listWorkflows: () => delay(WORKFLOWS),

  getDashboard: () => delay({ ...dashboard, pendingApprovals: approvals.filter((a) => a.status === 'Pending').length, stageCounts: computeStageCounts() }),

  listComplianceEvents: () => delay(complianceEvents),
};
