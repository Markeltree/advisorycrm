# Advisory CRM: frontend

React + Vite frontend for the insurance and financial advisory CRM described in the
requirements document. This folder is the frontend only. The backend is Node.js with
Supabase and is built separately.

## Run it

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173. Any email and password signs in while `VITE_USE_MOCK=true`.

## Connect to the Node.js backend

The API lives in `../crm-backend` (Node.js + Supabase). See its README for setup.

1. Start the API and create a user (`npm run create-user` in `crm-backend`).
2. In `.env`, set `VITE_API_URL` to the API base URL and `VITE_USE_MOCK=false`.
3. Sign in with that user. Sign-in goes through `POST /auth/login` on the API, so the
   browser never holds Supabase keys. The session (access and refresh token) is kept
   in `sessionStorage` and refreshed automatically before it expires.

The switch between sample data and the real API happens in one place: `src/api/index.js`.

## API contract the frontend expects

All responses are JSON. Errors return `{ "message": "..." }` with a non-2xx status.

| Method | Route | Used by | Notes |
| --- | --- | --- | --- |
| GET | `/contacts?query&category&consent&licensing&stage` | Contacts, Pipeline, Compliance | Returns an array of contacts. Filters are optional. |
| GET | `/contacts/:id` | Contact detail | Includes `activity[]` and `approvals[]`. |
| POST | `/contacts` | New contact | Server sets `consentTimestamp` when `consentStatus` is `Given`. |
| PATCH | `/contacts/:id/stage` | Contact detail | Body `{ "stage": "..." }`. |
| POST | `/contacts/:id/opt-out` | Contact detail | Body `{ "channel", "trigger" }`. Must suppress all workflows. |
| GET | `/approvals?status=Pending` | Approvals, Today | Omit `status` to get all items. |
| POST | `/approvals/:id/decision` | Approvals | Body `{ "decision": "approve" \| "reject", "decidedBy" }`. |
| GET | `/workflows` | Workflows | Twelve core workflows (Appendix A.4). |
| GET | `/metrics/dashboard` | Today | Includes `stageCounts` keyed by stage name. |
| GET | `/compliance/events` | Compliance | Newest first. |

### Contact object

```json
{
  "id": "c1",
  "firstName": "Maya",
  "lastName": "Chen",
  "phone": "(214) 555-0182",
  "email": "maya.chen@example.com",
  "state": "TX",
  "dob": "1978-04-02",
  "leadCategory": "Business Owners / Corporate",
  "productInterest": "Whole Life",
  "stage": "Discovery Call Booked",
  "consentStatus": "Given",
  "consentTimestamp": "2026-10-09T08:42:00Z",
  "consentSource": "Website form",
  "licensingStatus": "Licensed",
  "leadEntryReason": "Downloaded the succession checklist and asked about funding a buy-sell.",
  "maritalStatus": "Married",
  "dependents": 2,
  "income": 240000,
  "assets": 1100000,
  "debt": 380000,
  "primaryConcern": "Fund a buy-sell agreement.",
  "employer": "Chen Dental Group",
  "estateStatus": "In Progress",
  "referralSource": "",
  "householdName": "Chen household",
  "aiEscalated": false,
  "nextStep": "Discovery call, Thursday 10:00 AM",
  "lastContactAt": "2026-10-13T02:00:00Z",
  "optOut": null,
  "activity": [{ "id": "a1", "type": "call", "at": "...", "summary": "...", "outcome": "Connected" }],
  "approvals": []
}
```

Enum values match `src/data/constants.js`. Keep the backend enums identical to these.

## Compliance rules the UI relies on

- Outreach is blocked unless `consentStatus` is `Given` and `licensingStatus` is `Licensed`.
  The UI shows this on every contact, but the backend must enforce it.
- Consent and opt-out events are shown in the Compliance screen. Keep them in the audit log.
- The approved wording on the Compliance screen (Appendix B) is read-only in the UI.
  Changes need legal review, so they should not be editable from the app.

## Project layout

```
src/
  api/          HTTP client, sample-data client, and the switch between them
  components/   Layout, toast notifications, shared UI primitives
  data/         Enums and wording from the requirements document
  hooks/        useAsync data-loading hook
  lib/          Formatting helpers and the placeholder session
  pages/        Today, Pipeline, Contacts, New contact, Contact detail,
                Approvals, Compliance, Workflows, Sign in
  styles.css    Design tokens and all component styles
```

## Not built yet (out of scope for this frontend)

- Live calls, SMS, email sending, and the AI voice integration
- Calendar booking and reminders
- Carrier illustration and underwriting portal automation
- E-signature and document upload
- Role-based field access (Section 3.5). The API enforces roles per action (staff, advisor, admin); fields are not hidden by role.

## Open decisions that affect the UI

These come from Section 10 of the requirements. The UI uses placeholders for each:

- `LICENSED_STATES` in `src/data/constants.js` is a placeholder list. Replace it with the real licensing footprint.
- Lead categories and product lists were merged from Sections 1 and Appendix A.1. Confirm the final list.
- The approval team is shown as a single queue. Change this if approvals are split by advisor.
- Metric targets show "Target not set" until baseline data exists (Section 8).
