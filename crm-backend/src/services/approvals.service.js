import { conflict, notFound } from '../lib/errors.js';
import { toApproval, toContact } from '../lib/mappers.js';
import { outreachBlockReason } from '../domain/rules.js';
import { Approval } from '../models/Approval.js';
import { Contact } from '../models/Contact.js';
import { actorName, audit, insertActivity, lockContact } from './shared.js';
import { applyStageChange } from './contacts.service.js';

export async function listApprovals(_db, { status, contactId } = {}) {
  const query = {};
  if (status) query.status = status;
  if (contactId) query.contactId = contactId;

  const docs = await Approval.find(query).sort({ createdAt: -1 }).limit(1000);
  return docs.map(toApproval);
}

export async function getApproval(_db, id) {
  const doc = await Approval.findOne({ id });
  if (!doc) throw notFound('Approval not found.');
  return toApproval(doc);
}

export async function createApproval(_db, input, { user }) {
  let contactName = input.contactName;

  if (input.contactId) {
    const contact = await lockContact(_db, input.contactId);
    if (contact.consentStatus === 'Opted Out') {
      throw conflict('This contact opted out. Every workflow is suppressed, so no draft can be queued.');
    }
    contactName = `${contact.firstName} ${contact.lastName}`;

    if (input.type === 'Objection escalation' && !contact.aiEscalated) {
      contact.aiEscalated = true;
      if (!contact.tags.includes('ai-escalated')) {
        contact.tags.push('ai-escalated');
      }
      await contact.save();
    }
  }

  const approvalId = `ap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const doc = await Approval.create({
    ...input,
    id: approvalId,
    contactName,
    createdBy: user?.id || null,
  });

  await audit(_db, user, 'approval.create', 'approval', doc.id, {
    type: input.type,
    contactId: input.contactId || null,
  });

  return toApproval(doc);
}

export async function decideApproval(_db, id, { decision, note }, { user }) {
  const item = await Approval.findOne({ id });
  if (!item) throw notFound('Approval not found.');
  if (item.status !== 'Pending') throw conflict('This item was already decided.');

  const contact = item.contactId ? await Contact.findOne({ id: item.contactId }) : null;
  if (decision === 'approve' && contact) {
    const reason = outreachBlockReason(toContact(contact));
    if (reason) throw conflict(`Cannot approve: ${reason}`);
  }

  const status = decision === 'approve' ? 'Approved' : 'Rejected';
  item.status = status;
  item.decidedAt = new Date();
  item.decidedBy = actorName(user);
  item.decidedByUserId = user?.id || null;
  item.decisionNote = note || null;
  await item.save();

  if (contact) {
    await insertActivity(_db, {
      contactId: contact.id,
      type: 'note',
      summary: `${item.type} ${status === 'Approved' ? 'approved' : 'sent back'} by ${actorName(user)}.${note ? ` Note: ${note}` : ''}`,
      outcome: status,
      user,
    });

    if (item.type === 'Objection escalation') {
      const openEscalations = await Approval.countDocuments({
        contactId: contact.id,
        type: 'Objection escalation',
        status: 'Pending',
      });
      contact.aiEscalated = openEscalations > 0;
      if (!contact.aiEscalated) {
        contact.tags = contact.tags.filter((t) => t !== 'ai-escalated');
      }
      await contact.save();
    }

    if (status === 'Approved' && item.type === 'Illustration' && contact.stage === 'Illustration Sent (Pending Advisor Approval)') {
      await applyStageChange(_db, contact, 'Illustration Approved & Sent', { user, reason: 'Illustration approved.' });
    }
  }

  await audit(_db, user, 'approval.decide', 'approval', id, { decision, note });
  return toApproval(item);
}
