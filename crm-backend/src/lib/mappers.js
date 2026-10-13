import { outreachBlockReason } from '../domain/rules.js';

const iso = (v) => (v == null ? null : v instanceof Date ? v.toISOString() : new Date(v).toISOString());
const dateOnly = (v) => (v == null ? null : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));
const num = (v) => (v == null ? null : Number(v));

export function toContact(r) {
  if (!r) return null;
  const doc = r.toObject ? r.toObject() : r;

  const optOutAt = doc.optOut?.at || doc.opt_out_at;
  const optOutChannel = doc.optOut?.channel || doc.opt_out_channel;
  const optOutTrigger = doc.optOut?.trigger || doc.opt_out_trigger;

  const contact = {
    id: doc.id || doc._id?.toString(),
    firstName: doc.firstName ?? doc.first_name ?? '',
    lastName: doc.lastName ?? doc.last_name ?? '',
    phone: doc.phone ?? '',
    email: doc.email ?? '',
    state: doc.state ?? '',
    dob: dateOnly(doc.dob),
    leadCategory: doc.leadCategory ?? doc.lead_category ?? '',
    productInterest: doc.productInterest ?? doc.product_interest ?? '',
    stage: doc.stage ?? 'New Lead',
    consentStatus: doc.consentStatus ?? doc.consent_status ?? 'Not Captured',
    consentTimestamp: iso(doc.consentTimestamp ?? doc.consent_timestamp),
    consentSource: doc.consentSource ?? doc.consent_source ?? '',
    licensingStatus: doc.licensingStatus ?? doc.licensing_status ?? 'Pending Verification',
    leadEntryReason: doc.leadEntryReason ?? doc.lead_entry_reason ?? '',
    maritalStatus: doc.maritalStatus ?? doc.marital_status ?? '',
    dependents: num(doc.dependents),
    income: num(doc.income),
    assets: num(doc.assets),
    debt: num(doc.debt),
    primaryConcern: doc.primaryConcern ?? doc.primary_concern ?? '',
    employer: doc.employer ?? '',
    estateStatus: doc.estateStatus ?? doc.estate_status ?? 'None',
    referralSource: doc.referralSource ?? doc.referral_source ?? '',
    householdName: doc.householdName ?? doc.household_name ?? '',
    aiEscalated: Boolean(doc.aiEscalated ?? doc.ai_escalated),
    nextStep: doc.nextStep ?? doc.next_step ?? '',
    lastContactAt: iso(doc.lastContactAt ?? doc.last_contact_at),
    optOut: optOutAt ? { at: iso(optOutAt), channel: optOutChannel, trigger: optOutTrigger } : null,
    tags: doc.tags || [],
    source: doc.source || 'manual',
    createdAt: iso(doc.createdAt ?? doc.created_at),
    updatedAt: iso(doc.updatedAt ?? doc.updated_at),
    activity: (doc.activity || []).map(toActivity),
    approvals: (doc.approvals || []).map(toApproval),
  };

  const blocked = outreachBlockReason(contact);
  contact.outreachAllowed = blocked === null;
  contact.outreachBlockedReason = blocked;
  return contact;
}

export const toActivity = (r) => {
  if (!r) return null;
  const doc = r.toObject ? r.toObject() : r;
  return {
    id: doc.id || doc._id?.toString(),
    contactId: doc.contactId ?? doc.contact_id,
    type: doc.type,
    direction: doc.direction || 'outbound',
    handledBy: doc.handledBy ?? doc.handled_by ?? 'advisor',
    at: iso(doc.at),
    summary: doc.summary || '',
    outcome: doc.outcome || '',
  };
};

export const toApproval = (r) => {
  if (!r) return null;
  const doc = r.toObject ? r.toObject() : r;
  return {
    id: doc.id || doc._id?.toString(),
    type: doc.type,
    contactId: doc.contactId ?? doc.contact_id,
    contactName: doc.contactName ?? doc.contact_name,
    status: doc.status,
    draft: doc.draft,
    createdAt: iso(doc.createdAt ?? doc.created_at),
    decidedAt: iso(doc.decidedAt ?? doc.decided_at),
    decidedBy: doc.decidedBy ?? doc.decided_by,
    decisionNote: doc.decisionNote ?? doc.decision_note,
  };
};

export const toComplianceEvent = (r) => {
  if (!r) return null;
  const doc = r.toObject ? r.toObject() : r;
  return {
    id: doc.id || doc._id?.toString(),
    contactId: doc.contactId ?? doc.contact_id,
    contactName: doc.contactName ?? doc.contact_name,
    event: doc.event,
    channel: doc.channel,
    at: iso(doc.at),
    detail: doc.detail,
    actor: doc.actor || 'System',
  };
};

export const toWorkflow = (r) => {
  if (!r) return null;
  const doc = r.toObject ? r.toObject() : r;
  return {
    id: doc.id,
    name: doc.name,
    trigger: doc.trigger,
    mode: doc.mode,
    gate: doc.gate,
    phase: doc.phase,
    buildStatus: doc.buildStatus ?? doc.build_status,
    updatedAt: iso(doc.updatedAt ?? doc.updated_at),
  };
};

export const toUser = (r) => {
  if (!r) return null;
  const doc = r.toObject ? r.toObject() : r;
  return {
    id: doc.id || doc._id?.toString(),
    email: doc.email,
    fullName: doc.fullName ?? doc.full_name,
    role: doc.role,
    isActive: doc.isActive ?? doc.is_active,
    createdAt: iso(doc.createdAt ?? doc.created_at),
  };
};
