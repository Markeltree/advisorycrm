import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { twilioSignature } from '../src/middleware/webhookAuth.js';
import { contactPayload, PASSWORD, setup } from './helpers.js';

let t;
beforeAll(async () => {
  t = await setup();
}, 60_000);
afterAll(() => t?.close());

const createContact = async (overrides, who = 'staff') => {
  const res = await t.as(who).post('/api/contacts').send(contactPayload(overrides));
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body;
};
const getContact = async (id) => (await t.as('staff').get(`/api/contacts/${id}`)).body;
const events = async () => (await t.as('staff').get('/api/compliance/events')).body;

describe('health and routing', () => {
  it('reports liveness and database readiness', async () => {
    expect((await request(t.app).get('/api/health')).body).toEqual({ status: 'ok' });
    expect((await request(t.app).get('/api/health/ready')).body).toEqual({ status: 'ok', database: 'ok' });
  });

  it('returns JSON 404 for unknown routes and echoes a request id', async () => {
    const res = await t.as('staff').get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/No route/);
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('rejects malformed JSON with a readable message', async () => {
    const res = await t.as('staff').post('/api/contacts').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('The request body is not valid JSON.');
  });
});

describe('authentication', () => {
  it('requires a bearer token', async () => {
    const res = await request(t.app).get('/api/contacts');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Sign in to continue.');
  });

  it('rejects forged, expired and wrong-audience tokens', async () => {
    expect((await request(t.app).get('/api/contacts').set('Authorization', 'Bearer not.a.jwt')).status).toBe(401);
    const expired = await t.tokenFor(t.users.staff.id, { expiresIn: '-1m' });
    const res = await request(t.app).get('/api/contacts').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expired/);
  });

  it('signs in through the API and returns the profile', async () => {
    const { rows } = await t.db.query('select email from profiles where id = $1', [t.users.advisor.id]);
    const res = await request(t.app).post('/api/auth/login').send({ email: rows[0].email, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user).toMatchObject({ role: 'advisor', fullName: 'Morgan Advisor', isActive: true });

    const me = await request(t.app).get('/api/auth/me').set('Authorization', `Bearer ${res.body.accessToken}`);
    expect(me.body.id).toBe(t.users.advisor.id);

    const refreshed = await request(t.app).post('/api/auth/refresh').send({ refreshToken: res.body.refreshToken });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.user.id).toBe(t.users.advisor.id);
  });

  it('rejects a wrong password and validates input', async () => {
    const { rows } = await t.db.query('select email from profiles where id = $1', [t.users.staff.id]);
    expect((await request(t.app).post('/api/auth/login').send({ email: rows[0].email, password: 'nope' })).status).toBe(401);
    const bad = await request(t.app).post('/api/auth/login').send({ email: 'x', password: '' });
    expect(bad.status).toBe(400);
  });

  it('blocks deactivated users', async () => {
    const temp = await t.createUser('staff');
    await t.db.query('update profiles set is_active = false where id = $1', [temp.id]);
    const res = await t.as(temp).get('/api/contacts');
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/);
  });
});

describe('contacts', () => {
  it('creates a licensed, consented lead with server-set consent time and logs it', async () => {
    const before = Date.now();
    const c = await createContact({ licensingStatus: 'Not Licensed' /* ignored: the server decides */ });
    expect(c).toMatchObject({
      stage: 'New Lead',
      consentStatus: 'Given',
      licensingStatus: 'Licensed',
      nextStep: 'Ready for AI voice outreach',
      outreachAllowed: true,
      optOut: null,
      dob: '1978-04-02',
      income: 240000,
      dependents: 2,
    });
    expect(new Date(c.consentTimestamp).getTime()).toBeGreaterThanOrEqual(before - 1000);

    const detail = await getContact(c.id);
    expect(detail.activity[0]).toMatchObject({ type: 'consent', outcome: 'Given' });
    expect(detail.approvals).toEqual([]);
    expect((await events()).find((e) => e.contactId === c.id && e.event === 'Consent captured')).toBeTruthy();
  });

  it('routes out-of-footprint states to the hold queue and blocks unconsented outreach', async () => {
    const c = await createContact({ state: 'WA', consentStatus: 'Not Captured', consentSource: '' });
    expect(c).toMatchObject({ licensingStatus: 'Not Licensed', consentStatus: 'Not Captured', consentTimestamp: null, outreachAllowed: false });
    expect(c.nextStep).toBe('Route to licensed referral partner (out of state)');
    const mine = (await events()).filter((e) => e.contactId === c.id).map((e) => e.event);
    expect(mine).toEqual(expect.arrayContaining(['Routed to hold queue', 'Outreach blocked']));
  });

  it('accepts the exact payload the New contact form sends, including blanks', async () => {
    const c = await createContact({ email: '', dob: '', maritalStatus: '', dependents: null, income: null, assets: null, debt: null });
    expect(c).toMatchObject({ email: '', dob: null, income: null, dependents: null });
  });

  it('returns field-level validation errors', async () => {
    const res = await t.as('staff').post('/api/contacts').send({ ...contactPayload(), firstName: ' ', phone: '12', state: 'ZZ' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toMatchObject({
      firstName: 'Enter a first name.',
      phone: 'Enter a phone number with area code.',
      state: 'Choose a valid resident state.',
    });
  });

  it('filters and searches the list and reports the total', async () => {
    await createContact({ firstName: 'Zelda', lastName: 'Quintero', leadCategory: 'Veterans', state: 'AZ' });
    const res = await t.as('staff').get('/api/contacts').query({ query: 'quinter', category: 'Veterans' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].firstName).toBe('Zelda');
    expect(Number(res.headers['x-total-count'])).toBe(1);

    const none = await t.as('staff').get('/api/contacts').query({ query: '100%_' });
    expect(none.body).toEqual([]);

    const bad = await t.as('staff').get('/api/contacts').query({ stage: 'Nope' });
    expect(bad.status).toBe(400);
  });

  it('returns 404 for unknown and malformed ids', async () => {
    expect((await t.as('staff').get('/api/contacts/00000000-0000-0000-0000-000000000000')).status).toBe(404);
    expect((await t.as('staff').get('/api/contacts/c1')).status).toBe(404);
  });

  it('patches only the fields sent and re-checks licensing when the state changes', async () => {
    const c = await createContact({ state: 'TX' });
    const res = await t.as('staff').patch(`/api/contacts/${c.id}`).send({ state: 'CA', employer: 'New Co' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      state: 'CA',
      employer: 'New Co',
      email: c.email,
      estateStatus: c.estateStatus,
      licensingStatus: 'Not Licensed',
      nextStep: 'Route to licensed referral partner (out of state)',
    });
    expect((await t.as('staff').patch(`/api/contacts/${c.id}`).send({ consentStatus: 'Given' })).status).toBe(400);
  });
});

describe('pipeline stages and workflow triggers', () => {
  it('moves stage, logs it, and raises one referral request on Client (In-Force)', async () => {
    const c = await createContact();
    const res = await t.as('staff').patch(`/api/contacts/${c.id}/stage`).send({ stage: 'Client (In-Force)' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ stage: 'Client (In-Force)', nextStep: 'Referral request ready for advisor to personalize' });

    await t.as('staff').patch(`/api/contacts/${c.id}/stage`).send({ stage: 'Lapsed / Lost' });
    await t.as('staff').patch(`/api/contacts/${c.id}/stage`).send({ stage: 'Client (In-Force)' });

    const detail = await getContact(c.id);
    expect(detail.approvals.filter((a) => a.type === 'Referral request')).toHaveLength(1);
    expect(detail.activity.filter((a) => a.type === 'stage')).toHaveLength(3);
  });

  it('rejects unknown stages', async () => {
    const c = await createContact();
    const res = await t.as('staff').patch(`/api/contacts/${c.id}/stage`).send({ stage: 'Won' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Choose a valid pipeline stage.');
  });
});

describe('outreach gate', () => {
  it('refuses outbound outreach without consent and logs the attempt', async () => {
    const c = await createContact({ consentStatus: 'Not Captured', consentSource: '' });
    const res = await t.as('staff').post(`/api/contacts/${c.id}/activities`).send({ type: 'call', summary: 'Tried calling' });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/^Outreach blocked: Consent not captured/);
    const blocked = (await events()).filter((e) => e.contactId === c.id && e.event === 'Outreach blocked');
    expect(blocked.some((e) => /Attempted outbound call/.test(e.detail))).toBe(true);

    const note = await t.as('staff').post(`/api/contacts/${c.id}/activities`).send({ type: 'note', summary: 'Left internal note' });
    expect(note.status).toBe(201);
  });

  it('logs allowed outreach, sets last contact and advances New Lead to Contacted', async () => {
    const c = await createContact();
    const res = await t
      .as('staff')
      .post(`/api/contacts/${c.id}/activities`)
      .send({ type: 'call', handledBy: 'ai', summary: 'AI voice call completed.', outcome: 'Connected' });
    expect(res.status).toBe(201);
    expect(res.body.stage).toBe('Contacted');
    expect(res.body.lastContactAt).toBeTruthy();
    expect(res.body.activity[0].type).toBe('stage');
    expect(res.body.activity.some((a) => a.type === 'call' && a.direction === 'outbound')).toBe(true);
  });
});

describe('opt-out (workflow 12)', () => {
  it('suppresses the contact, cancels pending approvals and keeps the number suppressed', async () => {
    const c = await createContact();
    await t.as('staff').post('/api/approvals').send({ type: 'Missing document request', contactId: c.id, draft: 'Please send pay stubs.' });

    const res = await t.as('staff').post(`/api/contacts/${c.id}/opt-out`).send({ channel: 'Manual', trigger: 'Advisor flag' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      consentStatus: 'Opted Out',
      nextStep: 'None. Suppressed for all workflows',
      outreachAllowed: false,
      optOut: { channel: 'Manual', trigger: 'Advisor flag' },
    });

    const detail = await getContact(c.id);
    expect(detail.approvals[0]).toMatchObject({ status: 'Rejected', decidedBy: 'System (opt-out)' });
    const ev = (await events()).find((e) => e.contactId === c.id && e.event === 'Opt-out');
    expect(ev.detail).toMatch(/All workflows suppressed\. 1 pending approval/);

    // Idempotent
    expect((await t.as('staff').post(`/api/contacts/${c.id}/opt-out`).send({ channel: 'Manual', trigger: 'Again' })).status).toBe(200);

    // Re-entering the same phone number stays suppressed.
    const again = await createContact({ phone: c.phone, firstName: 'Re', lastName: 'Entered' });
    expect(again.consentStatus).toBe('Opted Out');
    expect(again.optOut).toMatchObject({ channel: 'Manual', trigger: 'Advisor flag' });

    // No new drafts or outreach for opted-out contacts.
    expect((await t.as('staff').post('/api/approvals').send({ type: 'Referral request', contactId: c.id, draft: 'x' })).status).toBe(409);
    expect((await t.as('staff').post(`/api/contacts/${c.id}/activities`).send({ type: 'sms', summary: 'hi' })).status).toBe(409);
  });

  it('validates the channel', async () => {
    const c = await createContact();
    expect((await t.as('staff').post(`/api/contacts/${c.id}/opt-out`).send({ channel: 'Pigeon', trigger: 'x' })).status).toBe(400);
  });

  it('lets an advisor record re-consent, which lifts the suppression', async () => {
    const c = await createContact();
    await t.as('staff').post(`/api/contacts/${c.id}/opt-out`).send({ channel: 'SMS', trigger: 'STOP' });
    expect((await t.as('staff').post(`/api/contacts/${c.id}/consent`).send({ source: 'Signed form' })).status).toBe(403);

    const res = await t.as('advisor').post(`/api/contacts/${c.id}/consent`).send({ source: 'Signed paper form, 13 Oct' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ consentStatus: 'Given', optOut: null, outreachAllowed: true });
    const { rows } = await t.db.query('select 1 from suppressions where phone_normalized = (select phone_normalized from contacts where id = $1)', [c.id]);
    expect(rows).toHaveLength(0);
  });
});

describe('approvals', () => {
  it('lets only advisors and admins decide, records who decided, and blocks double decisions', async () => {
    const c = await createContact();
    const created = await t.as('staff').post('/api/approvals').send({ type: 'Missing document request', contactId: c.id, draft: 'Need licence.' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ status: 'Pending', contactName: 'Maya Chen' });

    expect((await t.as('staff').post(`/api/approvals/${created.body.id}/decision`).send({ decision: 'approve' })).status).toBe(403);

    const res = await t
      .as('advisor')
      .post(`/api/approvals/${created.body.id}/decision`)
      .send({ decision: 'approve', decidedBy: 'spoofed@evil.test' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'Approved', decidedBy: 'Morgan Advisor' });
    expect(res.body.decidedAt).toBeTruthy();

    const again = await t.as('advisor').post(`/api/approvals/${created.body.id}/decision`).send({ decision: 'reject' });
    expect(again.status).toBe(409);
    expect(again.body.message).toBe('This item was already decided.');
  });

  it('will not approve a send for a contact who fails the consent/licensing gate', async () => {
    const c = await createContact({ state: 'WA' });
    const a = (await t.as('staff').post('/api/approvals').send({ type: 'Referral request', contactId: c.id, draft: 'x' })).body;
    const res = await t.as('advisor').post(`/api/approvals/${a.id}/decision`).send({ decision: 'approve' });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/^Cannot approve: Not licensed in WA/);
    expect((await t.as('advisor').post(`/api/approvals/${a.id}/decision`).send({ decision: 'reject' })).status).toBe(200);
  });

  it('flags and clears AI escalation with the escalation item', async () => {
    const c = await createContact();
    const a = (await t.as('staff').post('/api/approvals').send({ type: 'Objection escalation', contactId: c.id, draft: 'Wants spouse on call.' })).body;
    expect((await getContact(c.id)).aiEscalated).toBe(true);
    await t.as('advisor').post(`/api/approvals/${a.id}/decision`).send({ decision: 'approve' });
    const after = await getContact(c.id);
    expect(after.aiEscalated).toBe(false);
    expect(after.tags).not.toContain('ai-escalated');
  });

  it('advances the stage when an illustration is approved', async () => {
    const c = await createContact();
    await t.as('staff').patch(`/api/contacts/${c.id}/stage`).send({ stage: 'Illustration Sent (Pending Advisor Approval)' });
    const a = (await t.as('staff').post('/api/approvals').send({ type: 'Illustration', contactId: c.id, draft: 'IUL summary' })).body;
    await t.as('admin').post(`/api/approvals/${a.id}/decision`).send({ decision: 'approve' });
    expect((await getContact(c.id)).stage).toBe('Illustration Approved & Sent');
  });

  it('supports contact-less items and status filtering', async () => {
    const res = await t.as('staff').post('/api/approvals').send({ type: 'Friday recap email', contactName: 'Weekly recap', draft: 'Three calls.' });
    expect(res.status).toBe(201);
    const pending = (await t.as('staff').get('/api/approvals').query({ status: 'Pending' })).body;
    expect(pending.every((a) => a.status === 'Pending')).toBe(true);
    expect(pending.some((a) => a.id === res.body.id)).toBe(true);
    expect((await t.as('staff').post('/api/approvals').send({ type: 'Illustration', draft: 'x' })).status).toBe(400);
  });
});

describe('webhooks', () => {
  it('creates leads from the lead webhook with a valid secret only', async () => {
    const payload = { ...contactPayload(), income: '95,000', dependents: '1' };
    expect((await request(t.app).post('/api/webhooks/leads').send(payload)).status).toBe(401);
    const res = await request(t.app).post('/api/webhooks/leads').set('X-Webhook-Secret', 'lead-secret').send(payload);
    expect(res.status).toBe(201);
    const c = await getContact(res.body.id);
    expect(c).toMatchObject({ source: 'webhook', income: 95000, dependents: 1 });
  });

  it('opts out every contact on a number that replies STOP', async () => {
    const c = await createContact({ phone: '(305) 555-0147' });
    const res = await request(t.app)
      .post('/api/webhooks/sms/inbound?token=sms-secret')
      .type('form')
      .send({ From: '+13055550147', Body: 'stop' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);
    const after = await getContact(c.id);
    expect(after).toMatchObject({ consentStatus: 'Opted Out', optOut: { channel: 'SMS', trigger: 'STOP' } });
  });

  it('suppresses a STOP from an unknown number and logs ordinary replies', async () => {
    await request(t.app).post('/api/webhooks/sms/inbound').set('X-Webhook-Secret', 'sms-secret').type('form').send({ From: '+14155550000', Body: 'UNSUBSCRIBE' });
    const later = await createContact({ phone: '415-555-0000' });
    expect(later.consentStatus).toBe('Opted Out');

    const c = await createContact();
    await request(t.app).post('/api/webhooks/sms/inbound').set('X-Webhook-Secret', 'sms-secret').type('form').send({ From: c.phone, Body: 'Thursday works' });
    const detail = await getContact(c.id);
    expect(detail.activity[0]).toMatchObject({ type: 'sms', direction: 'inbound', summary: 'Inbound SMS: "Thursday works"' });
    expect(detail.consentStatus).toBe('Given');
  });

  it('rejects SMS webhooks without the secret', async () => {
    expect((await request(t.app).post('/api/webhooks/sms/inbound').type('form').send({ From: '+1', Body: 'STOP' })).status).toBe(401);
  });

  it('computes Twilio signatures per the documented algorithm', () => {
    // Example from Twilio's request-validation docs.
    const sig = twilioSignature('12345', 'https://mycompany.com/myapp.php?foo=1&bar=2', {
      CallSid: 'CA1234567890ABCDE',
      Caller: '+12349013030',
      Digits: '1234',
      From: '+12349013030',
      To: '+18005551212',
    });
    expect(sig).toBe('0/KCTR6DLpKmkAf8muzZqo1nDgQ=');
  });
});

describe('metrics, compliance, workflows, settings', () => {
  it('returns the dashboard shape the Today page reads', async () => {
    const res = await t.as('staff').get('/api/metrics/dashboard');
    expect(res.status).toBe(200);
    const d = res.body;
    expect(d.sampleData).toBe(false);
    for (const key of ['speedToLeadMinutes', 'callConnectRate', 'bookingRate', 'showUpRate', 'aiHandledShare', 'pendingApprovals', 'aiEscalations']) {
      expect(d).toHaveProperty(key);
    }
    expect(d.callConnectRate).toBe(1); // the one logged call was Connected
    expect(d.aiHandledShare).toBe(1);
    expect(d.speedToLeadMinutes).toBeGreaterThanOrEqual(0);
    const { rows } = await t.db.query('select count(*)::int as n from contacts');
    expect(Object.values(d.stageCounts).reduce((a, b) => a + b, 0)).toBe(rows[0].n);
  });

  it('lists compliance events newest first and keeps them append-only', async () => {
    const list = await events();
    const times = list.map((e) => new Date(e.at).getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    await expect(t.db.query('update compliance_events set detail = $1', ['tampered'])).rejects.toThrow(/append-only/);
    await expect(t.db.query('delete from compliance_events')).rejects.toThrow(/append-only/);
  });

  it('serves the twelve workflows and lets admins set build status', async () => {
    const list = (await t.as('staff').get('/api/workflows')).body;
    expect(list).toHaveLength(12);
    expect(list[0]).toMatchObject({ id: 1, name: 'New Lead Intake & Consent Capture', phase: 1, buildStatus: 'Planned' });
    expect((await t.as('staff').patch('/api/workflows/1').send({ buildStatus: 'Live' })).status).toBe(403);
    const res = await t.as('admin').patch('/api/workflows/12').send({ buildStatus: 'Live' });
    expect(res.body.buildStatus).toBe('Live');
  });

  it('updates the licensed footprint and re-evaluates contacts', async () => {
    const c = await createContact({ state: 'OR' });
    expect(c.licensingStatus).toBe('Not Licensed');
    expect((await t.as('advisor').put('/api/settings/licensed-states').send({ states: ['OR'] })).status).toBe(403);

    const current = (await t.as('staff').get('/api/settings/licensed-states')).body.states;
    const res = await t.as('admin').put('/api/settings/licensed-states').send({ states: [...current, 'OR'] });
    expect(res.status).toBe(200);
    expect(res.body.states).toContain('OR');
    const after = await getContact(c.id);
    expect(after).toMatchObject({ licensingStatus: 'Licensed', nextStep: 'Ready for AI voice outreach' });
  });

  it('lets an advisor set licensing to Pending Verification', async () => {
    const c = await createContact();
    const res = await t.as('advisor').patch(`/api/contacts/${c.id}/licensing`).send({ status: 'Pending Verification', note: 'Renewal pending' });
    expect(res.body).toMatchObject({ licensingStatus: 'Pending Verification', outreachAllowed: false });
  });

  it('serves reference data', async () => {
    const meta = (await t.as('staff').get('/api/meta')).body;
    expect(meta.stages).toHaveLength(11);
    expect(meta.licensedStates).toContain('TX');
    expect(meta.approvedWording.smsFooter).toBe('Reply STOP to opt out.');
  });
});

describe('user administration', () => {
  it('lets admins create and update users, with lockout protection', async () => {
    expect((await t.as('staff').get('/api/users')).status).toBe(403);

    const res = await t.as('admin').post('/api/users').send({ email: 'New.Advisor@Agency.test', password: 'a-long-password-123', fullName: 'New Advisor', role: 'advisor' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: 'new.advisor@agency.test', role: 'advisor', fullName: 'New Advisor' });

    const upd = await t.as('admin').patch(`/api/users/${res.body.id}`).send({ isActive: false });
    expect(upd.body.isActive).toBe(false);

    const self = await t.as('admin').patch(`/api/users/${t.users.admin.id}`).send({ role: 'staff' });
    expect(self.status).toBe(400);

    expect((await t.as('admin').post('/api/users').send({ email: 'x@y.z', password: 'short' })).status).toBe(400);
  });
});

describe('audit trail', () => {
  it('records API writes with the actor', async () => {
    const { rows } = await t.db.query(`select actor_id, action from audit_log where action = 'contact.create' limit 1`);
    expect(rows[0].actor_id).toBe(t.users.staff.id);
    await expect(t.db.query('delete from audit_log')).rejects.toThrow(/append-only/);
  });
});
