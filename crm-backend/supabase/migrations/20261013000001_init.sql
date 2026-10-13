-- Advisory CRM schema.
-- Enum values in CHECK constraints must match src/domain/constants.js.
-- The Node API connects as the database owner, so it is not subject to RLS.
-- RLS is enabled with no policies on every table so the public Supabase REST API
-- (anon / authenticated keys) cannot read or write CRM data directly.

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        text not null default 'staff' check (role in ('admin', 'advisor', 'staff')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Every Supabase Auth user gets a profile. The role comes from app_metadata, which
-- only the service role can set, so users cannot grant themselves a role.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when new.raw_app_meta_data ->> 'role' in ('admin', 'advisor', 'staff') then new.raw_app_meta_data ->> 'role'
      else 'staff'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Licensing footprint (Section 10: replace the seed list with the real one)
-- ---------------------------------------------------------------------------

create table public.licensed_states (
  state       char(2) primary key,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Contacts
-- ---------------------------------------------------------------------------

create table public.contacts (
  id                   uuid primary key default gen_random_uuid(),
  first_name           text not null check (char_length(first_name) between 1 and 100),
  last_name            text not null check (char_length(last_name) between 1 and 100),
  phone                text not null,
  phone_normalized     text not null,
  email                text not null default '',
  state                char(2) not null,
  dob                  date,
  lead_category        text not null check (lead_category in (
                         'Mortgage Protection', 'High Income / Doctors', 'Business Owners / Corporate',
                         'Affinity / Community', 'Veterans', 'Family Offices', 'Retirement / 55+')),
  product_interest     text not null check (product_interest in (
                         'Whole Life', 'Indexed Universal Life', 'Term', 'Annuity', 'Disability',
                         'Long Term Care', 'Mortgage Protection')),
  stage                text not null default 'New Lead' check (stage in (
                         'New Lead', 'Contacted', 'Discovery Call Booked', 'Discovery Call Completed',
                         'Illustration Sent (Pending Advisor Approval)', 'Illustration Approved & Sent',
                         'Application Submitted', 'Underwriting', 'Approved / Issued', 'Client (In-Force)',
                         'Lapsed / Lost')),
  furthest_stage_rank  smallint not null default 0,
  consent_status       text not null default 'Not Captured' check (consent_status in ('Not Captured', 'Given', 'Opted Out')),
  consent_timestamp    timestamptz,
  consent_source       text not null default '',
  licensing_status     text not null check (licensing_status in ('Licensed', 'Not Licensed', 'Pending Verification')),
  lead_entry_reason    text not null check (char_length(lead_entry_reason) >= 1),
  marital_status       text not null default '' check (marital_status in ('', 'Single', 'Married', 'Divorced', 'Widowed', 'Other')),
  dependents           integer check (dependents >= 0),
  income               numeric(14, 2) check (income >= 0),
  assets               numeric(14, 2) check (assets >= 0),
  debt                 numeric(14, 2) check (debt >= 0),
  primary_concern      text not null default '',
  employer             text not null default '',
  estate_status        text not null default 'None' check (estate_status in ('None', 'In Progress', 'Complete')),
  referral_source      text not null default '',
  household_name       text not null default '',
  ai_escalated         boolean not null default false,
  next_step            text not null default '',
  last_contact_at      timestamptz,
  opt_out_at           timestamptz,
  opt_out_channel      text,
  opt_out_trigger      text,
  tags                 text[] not null default '{}',
  source               text not null default 'manual' check (source in ('manual', 'webhook', 'seed')),
  created_by           uuid references public.profiles (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint consent_given_has_timestamp check (consent_status <> 'Given' or consent_timestamp is not null),
  constraint opt_out_has_details check (consent_status <> 'Opted Out' or opt_out_at is not null)
);

create index contacts_stage_idx on public.contacts (stage);
create index contacts_consent_idx on public.contacts (consent_status);
create index contacts_licensing_idx on public.contacts (licensing_status);
create index contacts_category_idx on public.contacts (lead_category);
create index contacts_phone_idx on public.contacts (phone_normalized);
create index contacts_created_idx on public.contacts (created_at desc);

-- ---------------------------------------------------------------------------
-- Communication log
-- clock_timestamp() rather than now(): several entries written in one transaction
-- (call logged, then stage changed) must keep their order on the timeline.
-- ---------------------------------------------------------------------------

create table public.activities (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references public.contacts (id) on delete cascade,
  type        text not null check (type in ('call', 'sms', 'email', 'consent', 'note', 'stage')),
  direction   text not null default 'internal' check (direction in ('inbound', 'outbound', 'internal')),
  handled_by  text not null default 'human' check (handled_by in ('ai', 'human', 'system')),
  at          timestamptz not null default clock_timestamp(),
  summary     text not null,
  outcome     text not null default '',
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default clock_timestamp()
);

create index activities_contact_idx on public.activities (contact_id, at desc);
create index activities_outreach_idx on public.activities (type, direction, at);

-- ---------------------------------------------------------------------------
-- Approval queue (Section 7)
-- ---------------------------------------------------------------------------

create table public.approvals (
  id                  uuid primary key default gen_random_uuid(),
  type                text not null check (type in (
                        'Illustration', 'Missing document request', 'Friday recap email',
                        'Referral request', 'Objection escalation')),
  contact_id          uuid references public.contacts (id) on delete cascade,
  contact_name        text not null,
  status              text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  draft               text not null check (char_length(draft) >= 1),
  decision_note       text not null default '',
  created_by          uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now(),
  decided_at          timestamptz,
  decided_by          text,
  decided_by_user_id  uuid references public.profiles (id) on delete set null,
  constraint decided_fields check ((status = 'Pending') = (decided_at is null))
);

create index approvals_status_idx on public.approvals (status, created_at desc);
create index approvals_contact_idx on public.approvals (contact_id);

-- Workflow 11 fires on every move to Client (In-Force); keep one open referral ask per contact.
create unique index approvals_one_pending_referral
  on public.approvals (contact_id)
  where status = 'Pending' and type = 'Referral request';

-- ---------------------------------------------------------------------------
-- Compliance: append-only event log and phone-level suppression list
-- ---------------------------------------------------------------------------

create table public.compliance_events (
  id            uuid primary key default gen_random_uuid(),
  contact_id    uuid references public.contacts (id),
  contact_name  text not null default '',
  event         text not null,
  channel       text not null,
  detail        text not null default '',
  actor_id      uuid references public.profiles (id),
  actor         text not null default 'System',
  at            timestamptz not null default clock_timestamp()
);

create index compliance_events_at_idx on public.compliance_events (at desc);
create index compliance_events_contact_idx on public.compliance_events (contact_id);

create function public.reject_change()
returns trigger
language plpgsql
as $$
begin
  raise exception '% is append-only', tg_table_name using errcode = '42501';
end;
$$;

create trigger compliance_events_append_only
  before update or delete on public.compliance_events
  for each row execute function public.reject_change();

-- An opted-out phone number stays suppressed even if the contact is re-entered.
create table public.suppressions (
  phone_normalized  text primary key,
  channel           text not null,
  trigger           text not null,
  contact_id        uuid references public.contacts (id) on delete set null,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Workflows (Appendix A.4)
-- ---------------------------------------------------------------------------

create table public.workflows (
  id            integer primary key,
  name          text not null,
  trigger       text not null,
  mode          text not null,
  gate          text not null,
  phase         integer not null,
  build_status  text not null default 'Planned' check (build_status in ('Planned', 'In Progress', 'Live', 'Paused')),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audit trail of every write made through the API
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id           bigint generated always as identity primary key,
  actor_id     uuid,
  action       text not null,
  entity_type  text not null,
  entity_id    text,
  data         jsonb not null default '{}',
  at           timestamptz not null default now()
);

create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);

create trigger audit_log_append_only
  before update or delete on public.audit_log
  for each row execute function public.reject_change();

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger contacts_touch before update on public.contacts
  for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger workflows_touch before update on public.workflows
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Lock the tables away from the public Supabase REST API
-- ---------------------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.licensed_states   enable row level security;
alter table public.contacts          enable row level security;
alter table public.activities        enable row level security;
alter table public.approvals         enable row level security;
alter table public.compliance_events enable row level security;
alter table public.suppressions      enable row level security;
alter table public.workflows         enable row level security;
alter table public.audit_log         enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on all tables in schema public from anon, authenticated;
    revoke all on all sequences in schema public from anon, authenticated;
  end if;
end;
$$;
