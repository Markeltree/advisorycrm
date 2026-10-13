import { Router } from 'express';
import { createContactSchema, smsInboundSchema } from '../lib/schemas.js';
import { requireSmsWebhookAuth, requireWebhookSecret } from '../middleware/webhookAuth.js';
import { createContact } from '../services/contacts.service.js';
import { handleInboundSms } from '../services/webhooks.service.js';

const router = Router();

// Workflow 1: website forms and lead vendors post new leads here.
router.post('/leads', requireWebhookSecret('LEAD_WEBHOOK_SECRET'), async (req, res) => {
  const created = await createContact(req.app.locals.db, createContactSchema.parse(req.body), { source: 'webhook' });
  res.status(201).json({ id: created.id, consentStatus: created.consentStatus, licensingStatus: created.licensingStatus });
});

// Workflow 12: inbound SMS from the SMS provider (Twilio form fields From and Body).
// Replies with empty TwiML so Twilio sends nothing back; the carrier sends the STOP confirmation.
router.post('/sms/inbound', requireSmsWebhookAuth, async (req, res) => {
  const { From, Body } = smsInboundSchema.parse(req.body);
  const result = await handleInboundSms(req.app.locals.db, { from: From, body: Body });
  req.log?.info(result, 'Inbound SMS processed');
  res.type('text/xml').send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
});

export default router;
