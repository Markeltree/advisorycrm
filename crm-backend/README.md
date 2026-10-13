# Advisory CRM: Backend (MongoDB Atlas + Express)

Node.js (Express 5) API for the Advisory CRM frontend located in `../crm-frontend`.
Powered by **MongoDB Atlas** (Mongoose) for database persistence and secure **JWT** authentication.

- Implements every REST route required by the CRM frontend.
- Enforces TCPA compliance and licensing rules server-side:
  - Outreach requires verified TCPA consent and a licensed resident state.
  - Opt-outs immediately and universally suppress contacts across all workflows.
  - Only licensed advisors can approve drafts.
- Complete audit trails and compliance logs.

---

## 🚀 Setup & Integration with MongoDB Atlas

Requires **Node 20+** and a **MongoDB Atlas cluster** (or local MongoDB).

### 1. Configure Environment (`.env`)
In `crm-backend/.env` (copied from `.env.example`):

```env
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/advisory_crm?retryWrites=true&w=majority
JWT_SECRET=super-secret-advisory-crm-jwt-key-2026-secure!
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

> **Tip**: Replace `MONGODB_URI` with your connection string from the MongoDB Atlas Dashboard (`Connect > Drivers > Node.js`).

### 2. Seed Initial Database Data
Populates the default advisor/admin accounts, 12 demo contacts, approval queue, compliance events, and workflows:

```bash
npm run seed
```

Default seeded accounts:
- **Advisor**: `advisor@agency.com` / `password123`
- **Admin**: `admin@agency.com` / `admin123`

### 3. Start the Backend Server
```bash
npm run dev     # runs with --watch on port 4000
```

### 4. Connect Frontend to the Backend
In `../crm-frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
VITE_USE_MOCK=false
```

Vite is preconfigured to proxy `/api` calls directly to `http://localhost:4000`, ensuring zero CORS friction.

---

## 👥 User Roles

| Role | Permissions |
| --- | --- |
| `staff` | Read directory, add/edit contacts, update stage, log activity, record opt-outs |
| `advisor` | Everything in staff, plus approve/reject AI drafts, record consent, verify licensing |
| `admin` | Everything in advisor, plus user management, licensing state settings, and workflow lifecycle status |

---

## 📡 API Endpoints

- `POST /api/auth/login` - Sign in with email & password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Sign out
- `GET  /api/contacts` - List & search contacts (filters: q, category, consent, licensing, stage)
- `POST /api/contacts` - Add new contact
- `GET  /api/contacts/:id` - Full contact record with timeline and approvals
- `PATCH /api/contacts/:id/stage` - Update pipeline stage
- `POST /api/contacts/:id/opt-out` - Universal TCPA opt-out
- `GET  /api/approvals` - List pending/decided AI drafts
- `POST /api/approvals/:id/decision` - Approve or send back draft
- `GET  /api/metrics/dashboard` - Dashboard stats (speed to lead, connect rate, booking rate, etc.)
- `GET  /api/compliance/events` - Audit trail of compliance events
- `GET  /api/workflows` - 12 core workflow matrix
