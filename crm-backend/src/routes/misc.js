import { Router } from 'express';
import {
  APPROVAL_TYPES,
  APPROVED_WORDING,
  BUILD_STATUSES,
  CONSENT_STATUSES,
  ESTATE_STATUSES,
  LEAD_CATEGORIES,
  LICENSING_STATUSES,
  MARITAL_STATUSES,
  OPT_OUT_CHANNELS,
  PRODUCTS,
  RETENTION_STAGES,
  ROLES,
  STAGES,
  US_STATES,
} from '../domain/constants.js';
import { complianceFiltersSchema, licensedStatesSchema, metricsQuerySchema, workflowIdParam, workflowUpdateSchema } from '../lib/schemas.js';
import { requireRole } from '../middleware/auth.js';
import { listComplianceEvents } from '../services/compliance.service.js';
import { getDashboard } from '../services/metrics.service.js';
import { getLicensedStates, setLicensedStates } from '../services/settings.service.js';
import { listWorkflows, updateWorkflow } from '../services/workflows.service.js';

export const workflowsRouter = Router();

workflowsRouter.get('/', async (req, res) => {
  res.json(await listWorkflows(req.app.locals.db));
});

workflowsRouter.patch('/:id', requireRole('admin'), async (req, res) => {
  const { id } = workflowIdParam.parse(req.params);
  res.json(await updateWorkflow(req.app.locals.db, id, workflowUpdateSchema.parse(req.body), { user: req.user }));
});

export const metricsRouter = Router();

metricsRouter.get('/dashboard', async (req, res) => {
  res.json(await getDashboard(req.app.locals.db, metricsQuerySchema.parse(req.query)));
});

export const complianceRouter = Router();

complianceRouter.get('/events', async (req, res) => {
  res.json(await listComplianceEvents(req.app.locals.db, complianceFiltersSchema.parse(req.query)));
});

// Appendix B wording is served read-only. Changing it needs legal review, so it lives in code.
complianceRouter.get('/wording', (_req, res) => {
  res.json(APPROVED_WORDING);
});

export const settingsRouter = Router();

settingsRouter.get('/licensed-states', async (req, res) => {
  res.json({ states: await getLicensedStates(req.app.locals.db) });
});

settingsRouter.put('/licensed-states', requireRole('admin'), async (req, res) => {
  const { states } = licensedStatesSchema.parse(req.body);
  res.json(await setLicensedStates(req.app.locals.db, states, { user: req.user }));
});

// Enums and reference data in one call, so clients can stay in sync with the server.
export const metaRouter = Router();

metaRouter.get('/', async (req, res) => {
  res.json({
    stages: STAGES,
    retentionStages: RETENTION_STAGES,
    leadCategories: LEAD_CATEGORIES,
    products: PRODUCTS,
    licensingStatuses: LICENSING_STATUSES,
    consentStatuses: CONSENT_STATUSES,
    estateStatuses: ESTATE_STATUSES,
    maritalStatuses: MARITAL_STATUSES,
    approvalTypes: APPROVAL_TYPES,
    optOutChannels: OPT_OUT_CHANNELS,
    buildStatuses: BUILD_STATUSES,
    roles: ROLES,
    usStates: US_STATES,
    licensedStates: await getLicensedStates(req.app.locals.db),
    approvedWording: APPROVED_WORDING,
  });
});
