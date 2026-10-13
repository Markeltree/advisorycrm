import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { SignJWT } from 'jose';
import pino from 'pino';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { unauthorized } from '../src/lib/errors.js';
import { createTokenVerifier } from '../src/services/auth.service.js';

const MIGRATIONS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'migrations');
const JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-hs256';
export const PASSWORD = 'correct-horse-battery';

// Real Postgres (PGlite, in-process) with the real migrations. auth.users is a stand-in
// for the Supabase Auth table so the profile trigger runs as it does in production.
async function createTestDb() {
  const pg = new PGlite();
  await pg.exec(`
    create schema auth;
    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      email text,
      raw_user_meta_data jsonb not null default '{}',
      raw_app_meta_data jsonb not null default '{}'
    );
  `);
  for (const file of fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
    await pg.exec(fs.readFileSync(path.join(MIGRATIONS, file), 'utf8'));
  }

  const wrap = (runner) => ({
    async query(text, params = []) {
      const result = await runner.query(text, params);
      return { rows: result.rows, rowCount: result.affectedRows ?? result.rows.length };
    },
  });

  return {
    ...wrap(pg),
    transaction: (fn) => pg.transaction((tx) => fn(wrap(tx))),
    close: () => pg.close(),
  };
}

export async function setup() {
  const config = loadConfig({
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    DATABASE_URL: 'postgres://unused',
    SUPABASE_URL: 'https://test-project.supabase.co',
    SUPABASE_ANON_KEY: 'anon',
    SUPABASE_SERVICE_ROLE_KEY: 'service',
    SUPABASE_JWT_SECRET: JWT_SECRET,
    RATE_LIMIT_DISABLED: 'true',
    LEAD_WEBHOOK_SECRET: 'lead-secret',
    SMS_WEBHOOK_SECRET: 'sms-secret',
  });
  const db = await createTestDb();
  const secret = new TextEncoder().encode(JWT_SECRET);

  async function tokenFor(userId, { expiresIn = '1h' } = {}) {
    return new SignJWT({ role: 'authenticated' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuer(`${config.supabaseUrl}/auth/v1`)
      .setAudience('authenticated')
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secret);
  }

  async function insertAuthUser({ email, role = 'staff', fullName = '' }) {
    const { rows } = await db.query(
      'insert into auth.users (email, raw_user_meta_data, raw_app_meta_data) values ($1, $2, $3) returning id',
      [email, JSON.stringify({ full_name: fullName }), JSON.stringify({ role })]
    );
    return rows[0].id;
  }

  // Stand-in for Supabase Auth: same interface as createSupabaseAuth(), real JWT verification.
  const auth = {
    verifyToken: createTokenVerifier(config),
    async signIn(email, password) {
      const { rows } = await db.query('select id from auth.users where email = $1', [email]);
      if (!rows[0] || password !== PASSWORD) throw unauthorized('Email or password is incorrect.');
      return { accessToken: await tokenFor(rows[0].id), refreshToken: `refresh-${rows[0].id}`, expiresAt: 9999999999, userId: rows[0].id };
    },
    async refresh(refreshToken) {
      const userId = refreshToken.replace(/^refresh-/, '');
      return { accessToken: await tokenFor(userId), refreshToken, expiresAt: 9999999999, userId };
    },
    async signOut() {},
    async createUser({ email, fullName, role }) {
      return { id: await insertAuthUser({ email, fullName, role }) };
    },
  };

  const app = createApp({ config, db, auth, logger: pino({ level: 'silent' }) });

  async function createUser(role, fullName = `${role} user`) {
    const id = await insertAuthUser({ email: `${role}-${Math.random().toString(36).slice(2, 8)}@agency.test`, role, fullName });
    return { id, token: await tokenFor(id) };
  }

  const users = {
    admin: await createUser('admin', 'Avery Admin'),
    advisor: await createUser('advisor', 'Morgan Advisor'),
    staff: await createUser('staff', 'Sam Staff'),
  };

  // as('advisor').post('/api/...') sends the request signed in as that user.
  const as = (who) => {
    const token = typeof who === 'string' ? users[who].token : who.token;
    const wrap = (method) => (url) => request(app)[method](url).set('Authorization', `Bearer ${token}`);
    return { get: wrap('get'), post: wrap('post'), patch: wrap('patch'), put: wrap('put') };
  };

  return { app, db, config, users, as, tokenFor, createUser, close: () => db.close() };
}

let phoneSeq = 1000;
export function contactPayload(overrides = {}) {
  phoneSeq += 1;
  return {
    firstName: 'Maya',
    lastName: 'Chen',
    phone: `(214) 555-${String(phoneSeq).padStart(4, '0')}`,
    email: 'maya.chen@example.com',
    dob: '1978-04-02',
    state: 'TX',
    leadCategory: 'Business Owners / Corporate',
    productInterest: 'Whole Life',
    leadEntryReason: 'Downloaded the succession checklist.',
    referralSource: '',
    consentStatus: 'Given',
    consentSource: 'Website form (consent checkbox v2)',
    licensingStatus: 'Licensed',
    maritalStatus: 'Married',
    dependents: 2,
    income: 240000,
    assets: 1100000,
    debt: 380000,
    primaryConcern: 'Fund a buy-sell agreement.',
    employer: 'Chen Dental Group',
    estateStatus: 'In Progress',
    ...overrides,
  };
}
