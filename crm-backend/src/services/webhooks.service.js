import { isStopMessage, normalizePhone } from '../domain/rules.js';
import { Contact } from '../models/Contact.js';
import { applyOptOut } from './contacts.service.js';
import { audit, insertActivity, recordComplianceEvent } from './shared.js';

const maskPhone = (phone) => `${phone.slice(0, -4).replace(/\d/g, '•')}${phone.slice(-4)}`;

export async function handleInboundSms(_db, { from, body }) {
  const phone = normalizePhone(from);
  if (!phone) return { matched: 0, optedOut: false };
  const keyword = isStopMessage(body);

  const cleanDigits = phone.replace(/\D/g, '');
  const contacts = await Contact.find({
    phone: { $regex: cleanDigits.slice(-10) },
  });

  for (const c of contacts) {
    c.lastContactAt = new Date();
    if (keyword && c.consentStatus !== 'Opted Out') {
      await applyOptOut(_db, c, { channel: 'SMS', trigger: keyword, user: null });
    } else {
      await insertActivity(_db, {
        contactId: c.id,
        type: 'sms',
        direction: 'inbound',
        handledBy: 'system',
        summary: `Inbound SMS: "${body.slice(0, 500)}"`,
        outcome: keyword ? 'Opted out' : 'Received',
      });
    }
  }

  if (keyword && contacts.length === 0) {
    await recordComplianceEvent(_db, {
      contactRow: null,
      event: 'Opt-out',
      channel: 'SMS',
      detail: `Trigger phrase: "${keyword}" from ${maskPhone(phone)}. Added to suppression records.`,
      user: null,
    });
  }

  await audit(_db, null, 'sms.inbound', 'phone', maskPhone(phone), { keyword, matched: contacts.length });
  return { matched: contacts.length, optedOut: Boolean(keyword) };
}
