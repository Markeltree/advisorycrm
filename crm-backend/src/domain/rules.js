import { STAGE_NEXT_STEP, STAGE_RANK, STOP_KEYWORDS } from './constants.js';

// US numbers become +1XXXXXXXXXX; anything else keeps its digits with a leading +.
export function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length >= 7 && digits.length <= 15) return `+${digits}`;
  return null;
}

// Section 6: outreach needs consent Given and a verified license for the resident state.
// Returns null when outreach is allowed, otherwise the reason it is blocked.
export function outreachBlockReason(contact) {
  if (contact.consentStatus === 'Opted Out') return 'Contact opted out. All automated outreach is suppressed.';
  if (contact.consentStatus !== 'Given') return 'Consent not captured. Outreach is blocked until consent is Given.';
  if (contact.licensingStatus === 'Not Licensed') return `Not licensed in ${contact.state}. Route to a licensed referral partner.`;
  if (contact.licensingStatus !== 'Licensed') return `Licensing for ${contact.state} is pending verification.`;
  return null;
}

export function deriveNextStep(contact) {
  if (contact.consentStatus === 'Opted Out') return 'None. Suppressed for all workflows';
  if (contact.licensingStatus === 'Not Licensed') return 'Route to licensed referral partner (out of state)';
  if (contact.licensingStatus === 'Pending Verification') return `Verify ${contact.state} licensing before any outreach`;
  if (contact.consentStatus !== 'Given') return 'Hold: consent not captured. No automated outreach';
  return STAGE_NEXT_STEP[contact.stage] || '';
}

export function licensingFor(state, licensedStates) {
  return licensedStates.includes(state) ? 'Licensed' : 'Not Licensed';
}

export function stageRank(stage) {
  return STAGE_RANK[stage] ?? -1;
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function computeTags(contact) {
  const tags = [`lead-category:${slug(contact.leadCategory)}`, `product:${slug(contact.productInterest)}`, `consent:${slug(contact.consentStatus)}`];
  if (contact.licensingStatus === 'Licensed') tags.push('license:verified');
  else if (contact.licensingStatus === 'Not Licensed') tags.push('license:not-licensed');
  else tags.push('license:unverified');
  if (contact.aiEscalated) tags.push('ai-escalated');
  return tags;
}

export function isStopMessage(body) {
  const text = String(body || '').trim().toUpperCase().replace(/[.!]+$/, '');
  return STOP_KEYWORDS.includes(text) ? text : null;
}
