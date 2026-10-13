import { toComplianceEvent } from '../lib/mappers.js';
import { ComplianceEvent } from '../models/ComplianceEvent.js';

export async function listComplianceEvents(_db, { contactId, limit = 200 } = {}) {
  const query = {};
  if (contactId) query.contactId = contactId;

  const docs = await ComplianceEvent.find(query)
    .sort({ at: -1, createdAt: -1 })
    .limit(Number(limit) || 200);

  return docs.map(toComplianceEvent);
}
