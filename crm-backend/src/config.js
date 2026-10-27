import 'dotenv/config';
import { z } from 'zod';

const bool = z
  .enum(['true', 'false', '1', '0', ''])
  .optional()
  .transform((v) => v === 'true' || v === '1');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  // MongoDB Atlas / Local MongoDB connection string
  MONGODB_URI: z
    .string()
    .default('mongodb://127.0.0.1:27017/advisory_crm'),

  // JWT Secret for authentication tokens
  JWT_SECRET: z
    .string()
    .min(10, { error: 'JWT_SECRET must be at least 10 characters long.' })
    .default('advisory-crm-jwt-secret-key-2026-secure-token!'),

  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  LEAD_WEBHOOK_SECRET: z.string().optional(),
  SMS_WEBHOOK_SECRET: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  PUBLIC_BASE_URL: z.string().optional(),

  RATE_LIMIT_DISABLED: bool,
});

export function loadConfig(env = process.env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }
  const c = parsed.data;
  return {
    ...c,
    isProduction: c.NODE_ENV === 'production',
    // Browsers send Origin without a trailing slash; tolerate quotes/slashes pasted into the env value.
    corsOrigins: c.CORS_ORIGINS.split(',')
      .map((s) => s.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, ''))
      .filter(Boolean),
  };
}
