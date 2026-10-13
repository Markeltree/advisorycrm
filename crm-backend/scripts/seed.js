// Loads demo contacts, approvals and compliance events into an empty database.
// Usage: npm run seed            (refuses if contacts already exist)
//        npm run seed -- --allow-production   (required when NODE_ENV=production)
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { sslOptions } from '../src/db/pool.js';
import { computeTags, normalizePhone, stageRank } from '../src/domain/rules.js';
import { approvals, complianceEvents, contacts } from './seed-data.js';

if (process.env.NODE_ENV === 'production' && !process.argv.includes('--allow-production')) {
  console.error('Refusing to seed demo data with NODE_ENV=production. Pass --allow-production to override.');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: sslOptions({ DATABASE_SSL: process.env.DATABASE_SSL || 'no-verify', DATABASE_SSL_CA_PATH: process.env.DATABASE_SSL_CA_PATH }),
});

const OUTBOUND = new Set(['call', 'sms', 'email']);

try {
  await client.connect();
  const { rows } = await client.query('select count(*)::int as n from contacts');
  if (rows[0].n > 0) throw new Error(`The database already has ${rows[0].n} contacts. Seeding only runs on an empty database.`);

  await client.query('begin');
  const ids = {};

  for (const c of contacts) {
    const id = (ids[c.id] = randomUUID());
    // Lead created a few minutes before the first outreach, so speed-to-lead looks realistic.
    const firstOutreach = c.activity.filter((a) => OUTBOUND.has(a.type)).map((a) => new Date(a.at).getTime()).sort((x, y) => x - y)[0];
    const createdAt = firstOutreach
      ? new Date(firstOutreach - 6 * 60000).toISOString()
      : c.consentTimestamp || new Date(Date.now() - 86400000).toISOString();
    await client.query(
      `insert into contacts (
         id, first_name, last_name, phone, phone_normalized, email, state, dob, lead_category, product_interest,
         stage, furthest_stage_rank, consent_status, consent_timestamp, consent_source, licensing_status,
         lead_entry_reason, marital_status, dependents, income, assets, debt, primary_concern, employer,
         estate_status, referral_source, household_name, ai_escalated, next_step, last_contact_at,
         opt_out_at, opt_out_channel, opt_out_trigger, tags, source, created_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,'seed',$35)`,
      [
        id, c.firstName, c.lastName, c.phone, normalizePhone(c.phone), c.email, c.state, c.dob, c.leadCategory, c.productInterest,
        c.stage, Math.max(stageRank(c.stage), c.stage === 'Lapsed / Lost' ? 1 : 0), c.consentStatus, c.consentTimestamp, c.consentSource, c.licensingStatus,
        c.leadEntryReason, c.maritalStatus, c.dependents, c.income, c.assets, c.debt, c.primaryConcern, c.employer,
        c.estateStatus, c.referralSource, c.householdName, c.aiEscalated, c.nextStep, c.lastContactAt,
        c.optOut?.at ?? null, c.optOut?.channel ?? null, c.optOut?.trigger ?? null, computeTags(c), createdAt,
      ]
    );

    for (const a of c.activity) {
      const inbound = /^Inbound/.test(a.summary);
      await client.query(
        `insert into activities (contact_id, type, direction, handled_by, at, summary, outcome) values ($1, $2, $3, $4, $5, $6, $7)`,
        [id, a.type, OUTBOUND.has(a.type) ? (inbound ? 'inbound' : 'outbound') : 'internal', /\bAI\b/.test(a.summary) ? 'ai' : 'human', a.at, a.summary, a.outcome]
      );
    }

    if (c.optOut) {
      await client.query(
        'insert into suppressions (phone_normalized, channel, trigger, contact_id, created_at) values ($1, $2, $3, $4, $5) on conflict do nothing',
        [normalizePhone(c.phone), c.optOut.channel, c.optOut.trigger, id, c.optOut.at]
      );
    }
  }

  for (const a of approvals) {
    await client.query(
      `insert into approvals (type, contact_id, contact_name, status, draft, created_at, decided_at, decided_by)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [a.type, a.contactId ? ids[a.contactId] : null, a.contactName, a.status, a.draft, a.createdAt, a.decidedAt ?? null, a.decidedBy ?? null]
    );
  }

  for (const e of complianceEvents) {
    await client.query(
      'insert into compliance_events (contact_id, contact_name, event, channel, at, detail) values ($1, $2, $3, $4, $5, $6)',
      [e.contactId ? ids[e.contactId] : null, e.contactName, e.event, e.channel, e.at, e.detail]
    );
  }

  await client.query('commit');
  console.log(`Seeded ${contacts.length} contacts, ${approvals.length} approvals and ${complianceEvents.length} compliance events.`);
} catch (err) {
  await client.query('rollback').catch(() => {});
  console.error(`Seeding stopped: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
