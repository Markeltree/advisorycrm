import { Router } from 'express';
import { notFound } from '../lib/errors.js';
import {
  activitySchema,
  consentSchema,
  contactFiltersSchema,
  createContactSchema,
  idParam,
  licensingSchema,
  optOutSchema,
  stageSchema,
  updateContactSchema,
} from '../lib/schemas.js';
import { requireRole } from '../middleware/auth.js';
import * as contacts from '../services/contacts.service.js';

export const contactId = (req) => {
  const parsed = idParam.safeParse(req.params);
  if (!parsed.success) throw notFound('Contact not found.');
  return parsed.data.id;
};

const router = Router();

// The frontend expects a plain array; the total for paging is in X-Total-Count.
router.get('/', async (req, res) => {
  const { contacts: list, total } = await contacts.listContacts(req.app.locals.db, contactFiltersSchema.parse(req.query));
  res.set('X-Total-Count', String(total)).json(list);
});

router.post('/', async (req, res) => {
  const created = await contacts.createContact(req.app.locals.db, createContactSchema.parse(req.body), { user: req.user });
  res.status(201).json(created);
});

router.get('/:id', async (req, res) => {
  res.json(await contacts.getContact(req.app.locals.db, contactId(req)));
});

router.patch('/:id', async (req, res) => {
  const id = contactId(req);
  const changes = updateContactSchema.parse(req.body);
  res.json(await contacts.updateContact(req.app.locals.db, id, changes, { user: req.user }));
});

router.patch('/:id/stage', async (req, res) => {
  const id = contactId(req);
  const { stage } = stageSchema.parse(req.body);
  res.json(await contacts.updateStage(req.app.locals.db, id, stage, { user: req.user }));
});

// Any signed-in user can record an opt-out. Stopping contact is never gated.
router.post('/:id/opt-out', async (req, res) => {
  const id = contactId(req);
  res.json(await contacts.optOut(req.app.locals.db, id, optOutSchema.parse(req.body), { user: req.user }));
});

router.post('/:id/consent', requireRole('admin', 'advisor'), async (req, res) => {
  const id = contactId(req);
  res.json(await contacts.recordConsent(req.app.locals.db, id, consentSchema.parse(req.body), { user: req.user }));
});

router.patch('/:id/licensing', requireRole('admin', 'advisor'), async (req, res) => {
  const id = contactId(req);
  res.json(await contacts.setLicensing(req.app.locals.db, id, licensingSchema.parse(req.body), { user: req.user }));
});

router.post('/:id/activities', async (req, res) => {
  const id = contactId(req);
  res.status(201).json(await contacts.addActivity(req.app.locals.db, id, activitySchema.parse(req.body), { user: req.user }));
});

export default router;
