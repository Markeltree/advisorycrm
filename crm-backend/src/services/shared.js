import { notFound } from '../lib/errors.js';
import { AuditLog } from '../models/AuditLog.js';
import { ComplianceEvent } from '../models/ComplianceEvent.js';
import { Contact } from '../models/Contact.js';
import { Setting } from '../models/Setting.js';

export const actorName = (user) => (user ? user.fullName || user.email : 'System');

export async function audit(_q, user, action, entityType, entityId, data = {}) {
  try {
    await AuditLog.create({
      actorId: user?.id ?? null,
      actorName: actorName(user),
      action,
      entityType,
      entityId: entityId == null ? null : String(entityId),
      payload: data,
    });
  } catch (err) {
    // Audit failures should not crash user operations
    console.error('Audit log error:', err);
  }
}

export async function recordComplianceEvent(_q, { contactRow, event, channel = 'System', detail = '', user }) {
  const contactName = contactRow
    ? contactRow.fullName || `${contactRow.firstName} ${contactRow.lastName}`
    : '';

  return ComplianceEvent.create({
    contactId: contactRow?.id ?? null,
    contactName,
    event,
    channel,
    detail,
    userId: user?.id ?? null,
    at: new Date(),
  });
}

export async function insertActivity(_q, { contactId, type, direction = 'outbound', handledBy = 'advisor', summary, outcome = '', at, user }) {
  const act = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    contactId,
    type,
    direction,
    handledBy,
    summary,
    outcome: outcome || '',
    at: at ? new Date(at) : new Date(),
    user: user?.id || null,
  };

  const contact = await Contact.findOne({ id: contactId });
  if (contact) {
    contact.activity.unshift(act);
    contact.lastContactAt = act.at;
    await contact.save();
  }

  return act;
}

const DEFAULT_LICENSED_STATES = ['AZ', 'CA', 'CO', 'FL', 'GA', 'NJ', 'NY', 'TX', 'WA'];

export async function getLicensedStates(_q) {
  const setting = await Setting.findOne({ key: 'licensed_states' });
  if (setting && Array.isArray(setting.value)) {
    return setting.value.sort();
  }
  return DEFAULT_LICENSED_STATES.sort();
}

export async function lockContact(_q, id) {
  const contact = await Contact.findOne({ id });
  if (!contact) throw notFound('Contact not found.');
  return contact;
}
