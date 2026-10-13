import crypto from 'node:crypto';
import { HttpError, unauthorized } from '../lib/errors.js';

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

// Shared-secret check for webhooks. The secret comes from the X-Webhook-Secret header,
// or the ?token= query parameter for senders that cannot set headers.
export const requireWebhookSecret = (configKey) => (req, _res, next) => {
  const expected = req.app.locals.config[configKey];
  if (!expected) throw new HttpError(503, 'This webhook is not configured on the server.');
  const provided = req.get('x-webhook-secret') || req.query.token || '';
  if (!safeEqual(provided, expected)) throw unauthorized('Webhook secret is missing or wrong.');
  next();
};

// https://www.twilio.com/docs/usage/security#validating-requests
export function twilioSignature(authToken, url, params) {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  return crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf8')).digest('base64');
}

// Inbound SMS: Twilio signature when TWILIO_AUTH_TOKEN is set, otherwise the shared secret.
export function requireSmsWebhookAuth(req, res, next) {
  const { TWILIO_AUTH_TOKEN, PUBLIC_BASE_URL } = req.app.locals.config;
  if (!TWILIO_AUTH_TOKEN) return requireWebhookSecret('SMS_WEBHOOK_SECRET')(req, res, next);

  const base = (PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
  const expected = twilioSignature(TWILIO_AUTH_TOKEN, `${base}${req.originalUrl}`, req.body || {});
  if (!safeEqual(req.get('x-twilio-signature') || '', expected)) throw unauthorized('Twilio signature is not valid.');
  next();
}
