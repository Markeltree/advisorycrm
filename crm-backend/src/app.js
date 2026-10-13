import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express, { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import approvalsRouter from './routes/approvals.js';
import { authRouter, usersRouter } from './routes/auth.js';
import contactsRouter from './routes/contacts.js';
import { complianceRouter, metaRouter, metricsRouter, settingsRouter, workflowsRouter } from './routes/misc.js';
import webhooksRouter from './routes/webhooks.js';

const REQUEST_ID = /^[\w-]{1,100}$/;

function limiter(config, { windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => config.RATE_LIMIT_DISABLED,
    message: { message },
  });
}

// `auth` is the Supabase auth adapter (see services/auth.service.js); tests pass a stand-in.
export function createApp({ config, db, auth, logger }) {
  const app = express();
  Object.assign(app.locals, { config, db, auth, logger });

  app.set('trust proxy', config.TRUST_PROXY);
  app.disable('x-powered-by');

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const incoming = req.headers['x-request-id'];
        const id = typeof incoming === 'string' && REQUEST_ID.test(incoming) ? incoming : randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
      autoLogging: { ignore: (req) => req.url.startsWith('/api/health') },
      customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
    })
  );
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)),
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Total-Count', 'X-Request-Id'],
      maxAge: 600,
    })
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  const api = Router();

  api.get('/health', (_req, res) => res.json({ status: 'ok' }));
  api.get('/health/ready', async (_req, res) => {
    try {
      await db.ping();
      res.json({ status: 'ok', database: 'ok' });
    } catch (err) {
      logger.error({ err }, 'Readiness check failed');
      res.status(503).json({ status: 'unavailable', database: 'unreachable' });
    }
  });

  api.use(limiter(config, { windowMs: 15 * 60_000, limit: 1000, message: 'Too many requests. Wait a few minutes and try again.' }));

  const loginLimiter = limiter(config, { windowMs: 15 * 60_000, limit: 20, message: 'Too many sign-in attempts. Wait 15 minutes and try again.' });
  api.use('/auth', authRouter({ loginLimiter }));
  api.use('/webhooks', webhooksRouter);

  api.use(authenticate);
  api.use('/contacts', contactsRouter);
  api.use('/approvals', approvalsRouter);
  api.use('/workflows', workflowsRouter);
  api.use('/metrics', metricsRouter);
  api.use('/compliance', complianceRouter);
  api.use('/settings', settingsRouter);
  api.use('/users', usersRouter);
  api.use('/meta', metaRouter);

  app.use('/api', api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
