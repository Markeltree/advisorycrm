import { conflict, notFound } from '../lib/errors.js';
import { toActivity, toApproval, toContact } from '../lib/mappers.js';
import { computeTags, deriveNextStep, licensingFor, normalizePhone, outreachBlockReason, stageRank } from '../domain/rules.js';
import { Approval } from '../models/Approval.js';
import { Contact } from '../models/Contact.js';
import { audit, getLicensedStates, insertActivity, lockContact, recordComplianceEvent } from './shared.js';

const escapeRegex = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

export async function listContacts(_db, filters = {}) {
  const query = {};

  if (filters.query) {
    const rx = new RegExp(escapeRegex(filters.query), 'i');
    query.$or = [
      { firstName: rx },
      { lastName: rx },
      { email: rx },
      { phone: rx },
      { state: rx },
      { leadCategory: rx },
    ];
  }

  if (filters.category) query.leadCategory = filters.category;
  if (filters.consent) query.consentStatus = filters.consent;
  if (filters.licensing) query.licensingStatus = filters.licensing;
  if (filters.stage) query.stage = filters.stage;

  const limit = Number(filters.limit) || 50;
  const offset = Number(filters.offset) || 0;

  const [total, docs] = await Promise.all([
    Contact.countDocuments(query),
    Contact.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit),
  ]);

  return {
    contacts: docs.map(toContact),
    total,
  };
}

export async function getContact(_db, id) {
  const doc = await Contact.findOne({ id });
  if (!doc) throw notFound('Contact not found.');

  const approvals = await Approval.find({ contactId: id }).sort({ createdAt: -1 });

  const contactData = toContact(doc);
  contactData.approvals = approvals.map(toApproval);
  return contactData;
}

export async function createContact(_db, input, { user }) {
  const licensedStates = await getLicensedStates(_db);
  const licensingStatus = input.licensingStatus || licensingFor(input.state, licensedStates);

  const contactId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const doc = new Contact({
    ...input,
    id: contactId,
    licensingStatus,
    furthestStageRank: stageRank(input.stage || 'New Lead'),
    source: input.source || 'manual',
  });

  const c = toContact(doc);
  doc.tags = computeTags(c);
  doc.nextStep = deriveNextStep(c);

  await doc.save();

  if (doc.consentStatus === 'Given') {
    await recordComplianceEvent(_db, {
      contactRow: doc,
      event: 'Consent captured',
      channel: doc.consentSource || 'Direct Entry',
      detail: `Consent captured for ${doc.firstName} ${doc.lastName}. Source: ${doc.consentSource || 'Direct Entry'}.`,
      user,
    });
  } else if (doc.licensingStatus !== 'Licensed') {
    await recordComplianceEvent(_db, {
      contactRow: doc,
      event: 'Routed to hold queue',
      channel: 'System',
      detail: `Resident state ${doc.state} is unverified or outside licensed footprint.`,
      user,
    });
  }

  await audit(_db, user, 'contact.create', 'contact', doc.id, { state: doc.state, stage: doc.stage });
  return toContact(doc);
}

export async function updateContact(_db, id, changes, { user }) {
  const doc = await lockContact(_db, id);

  Object.assign(doc, changes);
  const c = toContact(doc);
  doc.tags = computeTags(c);
  doc.nextStep = changes.nextStep || deriveNextStep(c);

  await doc.save();
  await audit(_db, user, 'contact.update', 'contact', id, changes);
  return toContact(doc);
}

export async function applyStageChange(_q, contact, stage, { user, reason }) {
  contact.stage = stage;
  const rank = stageRank(stage);
  if (rank > (contact.furthestStageRank || 0)) {
    contact.furthestStageRank = rank;
  }

  const c = toContact(contact);
  contact.nextStep = deriveNextStep(c);
  contact.tags = computeTags(c);

  contact.activity.unshift({
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    contactId: contact.id,
    type: 'stage',
    summary: `Stage updated to "${stage}". ${reason || ''}`.trim(),
    outcome: stage,
    at: new Date(),
    user: user?.id || null,
  });

  await contact.save();
  return contact;
}

export async function updateStage(_db, id, stage, { user, reason }) {
  const doc = await lockContact(_db, id);
  await applyStageChange(_db, doc, stage, { user, reason });
  await audit(_db, user, 'contact.stage', 'contact', id, { stage });
  return toContact(doc);
}

export async function applyOptOut(_q, contact, { channel, trigger, user, at = null }) {
  contact.consentStatus = 'Opted Out';
  contact.optOut = {
    at: at || new Date(),
    channel,
    trigger,
  };
  contact.aiEscalated = false;

  const c = toContact(contact);
  contact.nextStep = deriveNextStep(c);
  contact.tags = computeTags(c);

  contact.activity.unshift({
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    contactId: contact.id,
    type: 'sms',
    summary: `Opt-out registered via ${channel}. Trigger: "${trigger}".`,
    outcome: 'Opted out',
    at: at || new Date(),
    user: user?.id || null,
  });

  // Reject / close all pending approvals for this contact
  await Approval.updateMany(
    { contactId: contact.id, status: 'Pending' },
    {
      status: 'Rejected',
      decidedAt: new Date(),
      decidedBy: 'System (Opt-out)',
      decisionNote: 'Contact opted out; workflow suppressed.',
    }
  );

  await recordComplianceEvent(_q, {
    contactRow: contact,
    event: 'Opt-out',
    channel,
    detail: `Trigger phrase: "${trigger}". All workflows suppressed.`,
    user,
  });

  await contact.save();
  return contact;
}

export async function optOut(_db, id, details, { user }) {
  const doc = await lockContact(_db, id);
  await applyOptOut(_db, doc, { ...details, user });
  await audit(_db, user, 'contact.opt_out', 'contact', id, details);
  return toContact(doc);
}

export async function recordConsent(_db, id, { status, source }, { user }) {
  const doc = await lockContact(_db, id);
  doc.consentStatus = status;
  doc.consentSource = source || doc.consentSource;
  doc.consentTimestamp = status === 'Given' ? new Date() : doc.consentTimestamp;

  const c = toContact(doc);
  doc.nextStep = deriveNextStep(c);
  doc.tags = computeTags(c);

  await recordComplianceEvent(_db, {
    contactRow: doc,
    event: status === 'Given' ? 'Consent captured' : 'Consent revoked',
    channel: source || 'Advisor',
    detail: `Consent status changed to ${status}. Source: ${source || 'Advisor'}.`,
    user,
  });

  await doc.save();
  await audit(_db, user, 'contact.consent', 'contact', id, { status, source });
  return toContact(doc);
}

export async function setLicensing(_db, id, { status }, { user }) {
  const doc = await lockContact(_db, id);
  doc.licensingStatus = status;

  const c = toContact(doc);
  doc.nextStep = deriveNextStep(c);
  doc.tags = computeTags(c);

  await recordComplianceEvent(_db, {
    contactRow: doc,
    event: status === 'Licensed' ? 'Licensing verified' : 'Routed to hold queue',
    channel: 'Advisor',
    detail: `Resident state ${doc.state} set to ${status}.`,
    user,
  });

  await doc.save();
  await audit(_db, user, 'contact.licensing', 'contact', id, { status });
  return toContact(doc);
}

export async function addActivity(_db, id, activity, { user }) {
  await lockContact(_db, id);
  const act = await insertActivity(_db, {
    contactId: id,
    ...activity,
    user,
  });
  await audit(_db, user, 'contact.activity', 'contact', id, { type: activity.type });
  return toActivity(act);
}
