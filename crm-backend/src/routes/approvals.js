import { Router } from 'express';
import { notFound } from '../lib/errors.js';
import { approvalFiltersSchema, createApprovalSchema, decisionSchema, idParam } from '../lib/schemas.js';
import { requireRole } from '../middleware/auth.js';
import * as approvals from '../services/approvals.service.js';

const approvalId = (req) => {
  const parsed = idParam.safeParse(req.params);
  if (!parsed.success) throw notFound('Approval not found.');
  return parsed.data.id;
};

const router = Router();

router.get('/', async (req, res) => {
  res.json(await approvals.listApprovals(req.app.locals.db, approvalFiltersSchema.parse(req.query)));
});

router.post('/', async (req, res) => {
  res.status(201).json(await approvals.createApproval(req.app.locals.db, createApprovalSchema.parse(req.body), { user: req.user }));
});

router.get('/:id', async (req, res) => {
  res.json(await approvals.getApproval(req.app.locals.db, approvalId(req)));
});

// Only licensed people (advisors) and admins decide. The decider is the signed-in user.
router.post('/:id/decision', requireRole('admin', 'advisor'), async (req, res) => {
  const id = approvalId(req);
  res.json(await approvals.decideApproval(req.app.locals.db, id, decisionSchema.parse(req.body), { user: req.user }));
});

export default router;
