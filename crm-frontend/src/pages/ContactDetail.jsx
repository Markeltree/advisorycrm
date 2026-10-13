import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronRight,
  ArrowRightCircle,
  PhoneCall,
  MessageSquare,
  Mail,
  FileText,
  Shield,
  GitBranch,
  AlertOctagon,
  Clock,
  User,
  Building,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { api } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { STAGES } from '../data/constants.js';
import { fullName, formatDate, formatDateTime, money, timeAgo } from '../lib/format.js';
import {
  Badge,
  Button,
  ConsentBadge,
  EmptyState,
  ErrorNotice,
  LicenseBadge,
  Loading,
  Panel,
} from '../components/ui.jsx';

const APPROVAL_TONE = { Pending: 'brass', Approved: 'ok', Rejected: 'danger' };
const ACTIVITY_ICON = {
  call: PhoneCall,
  sms: MessageSquare,
  email: Mail,
  consent: Shield,
  note: FileText,
  stage: GitBranch,
};
const ACTIVITY_LABEL = {
  call: 'Call',
  sms: 'SMS',
  email: 'Email',
  consent: 'Consent',
  note: 'Note',
  stage: 'Stage',
};

export default function ContactDetail() {
  const { id } = useParams();
  const { notify } = useToast();
  const contact = useAsync(() => api.getContact(id), [id]);
  const [confirmingOptOut, setConfirmingOptOut] = useState(false);
  const [busy, setBusy] = useState(false);

  if (contact.status === 'loading') return <Loading label="Loading contact record" />;
  if (contact.status === 'error') {
    return (
      <div className="space-y-4">
        <ErrorNotice>{contact.error.message}</ErrorNotice>
        <Link to="/contacts" className="text-xs font-medium text-zinc-900 underline dark:text-zinc-100">
          Return to contacts directory
        </Link>
      </div>
    );
  }

  const c = contact.data;

  async function changeStage(stage) {
    setBusy(true);
    try {
      await api.updateContactStage(c.id, stage);
      notify(`Stage updated to ${stage}.`, 'success');
      contact.reload();
    } catch (err) {
      notify(err.message, 'danger');
    } finally {
      setBusy(false);
    }
  }

  async function recordOptOut() {
    setBusy(true);
    try {
      await api.optOutContact(c.id, { channel: 'Manual', trigger: 'Advisor flag' });
      notify('Opt-out recorded. All automated workflows are suppressed for this contact.', 'success');
      setConfirmingOptOut(false);
      contact.reload();
    } catch (err) {
      notify(err.message, 'danger');
    } finally {
      setBusy(false);
    }
  }

  const isOptedOut = c.consentStatus === 'Opted Out';
  const profile = [
    ['Resident state', c.state],
    ['Date of birth', formatDate(c.dob)],
    ['Marital status', c.maritalStatus || '—'],
    ['Dependents', c.dependents ?? '—'],
    ['Estimated income', money(c.income)],
    ['Estimated assets', money(c.assets)],
    ['Estimated debt', money(c.debt)],
    ['Employer or company', c.employer || '—'],
    ['Estate plan', c.estateStatus],
    ['Referral source', c.referralSource || '—'],
    ['Household', c.householdName || 'Not grouped'],
  ];

  const initials = `${c.firstName?.charAt(0) || ''}${c.lastName?.charAt(0) || ''}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-zinc-500" aria-label="Breadcrumb">
        <Link to="/contacts" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          Contacts
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{fullName(c)}</span>
      </nav>

      {/* Header Profile Card */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center text-lg font-bold shadow-xs shrink-0">
            {initials}
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{fullName(c)}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {c.leadCategory} · {c.productInterest} · <span className="font-mono">{c.state}</span>
              {c.phone ? ` · ${c.phone}` : ''}
              {c.email ? ` · ${c.email}` : ''}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <ConsentBadge status={c.consentStatus} />
              <LicenseBadge status={c.licensingStatus} />
              {c.aiEscalated && <Badge tone="brass">Escalated by AI</Badge>}
            </div>
          </div>
        </div>

        {/* Stage Controller */}
        <div className="flex flex-col gap-1.5 min-w-[200px] border-t md:border-t-0 pt-4 md:pt-0 border-zinc-100 dark:border-zinc-800">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500" htmlFor="stage-selector">
            Pipeline Stage
          </label>
          <select
            id="stage-selector"
            value={c.stage}
            disabled={busy}
            onChange={(e) => changeStage(e.target.value)}
            className="h-9 px-3 text-xs font-medium rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 transition-all cursor-pointer"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reason / Trigger Quote Card */}
      <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 dark:bg-zinc-900/60 p-5 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Why this person became a lead</p>
        <blockquote className="mt-2 text-sm font-medium text-zinc-800 dark:text-zinc-200 italic border-l-2 border-zinc-400 pl-3">
          "{c.leadEntryReason || 'No reason recorded.'}"
        </blockquote>
        <p className="mt-2 text-xs text-zinc-400">
          Consent source: <span className="text-zinc-600 dark:text-zinc-300 font-medium">{c.consentSource || 'Not recorded'}</span>
          {c.consentTimestamp ? ` · captured ${formatDateTime(c.consentTimestamp)}` : ''}
        </p>
      </div>

      {/* Main Grid: Discovery & Next Step vs Approvals & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Discovery Profile */}
          <Panel title="Discovery Profile" description="Financial & household profile captured during intake or discovery.">
            <dl className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs">
              {profile.map(([label, value]) => (
                <div key={label} className="py-2.5 flex items-center justify-between">
                  <dt className="text-zinc-500">{label}</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
                </div>
              ))}
            </dl>
            {c.primaryConcern && (
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Primary Concern or Goal</p>
                <p className="mt-1 text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                  {c.primaryConcern}
                </p>
              </div>
            )}
          </Panel>

          {/* Next Step */}
          <Panel title="Next Step" description="Upcoming automation or advisor milestone.">
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
              <ArrowRightCircle className="w-5 h-5 text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                {c.nextStep || 'No immediate action configured.'}
              </p>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          {/* Approvals */}
          <Panel title="Approvals for this Contact" description="Drafted messages waiting for license holder decision.">
            {c.approvals.length === 0 ? (
              <EmptyState title="No approval items" children="No pending drafts currently tied to this contact." />
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {c.approvals.map((a) => (
                  <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{a.type}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Created {timeAgo(a.createdAt)}</p>
                    </div>
                    <Badge tone={APPROVAL_TONE[a.status] || 'neutral'}>{a.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Communication Timeline */}
          <Panel title="Communication History" description="Chronological log of outreach, calls, messages and notes.">
            {c.activity.length === 0 ? (
              <EmptyState title="No recorded activity yet" children="Calls, texts, and emails will appear here." />
            ) : (
              <ol className="relative border-l border-zinc-200 dark:border-zinc-800 ml-2 space-y-4 my-2">
                {c.activity.map((a) => {
                  const Icon = ACTIVITY_ICON[a.type] || FileText;
                  return (
                    <li key={a.id} className="ml-5 relative">
                      <span className="absolute -left-7 top-1 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                        <Icon className="w-2.5 h-2.5" />
                      </span>
                      <div className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {ACTIVITY_LABEL[a.type] || a.type}
                          </span>
                          {a.outcome && (
                            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded font-medium text-zinc-600 dark:text-zinc-300">
                              {a.outcome}
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-400 ml-auto">
                            {formatDateTime(a.at)}
                          </span>
                        </div>
                        <p className="mt-1 text-zinc-600 dark:text-zinc-400 leading-normal">{a.summary}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Panel>

          {/* Consent and Opt-out */}
          <Panel title="Consent & Opt-Out Controls">
            {isOptedOut && c.optOut ? (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-200 text-xs">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>Opted Out {formatDateTime(c.optOut.at)}</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Trigger: "{c.optOut.trigger}" via {c.optOut.channel}. All automated voice, SMS and marketing outreach is strictly blocked.
                </p>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 mb-4">
                Automated outreach is restricted to verified states with recorded express consent.
              </p>
            )}

            {!isOptedOut &&
              (confirmingOptOut ? (
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 dark:bg-rose-950/30 dark:border-rose-900 space-y-3">
                  <p className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                    Are you sure you want to stop all contact for {fullName(c)}?
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    This permanently halts active automated workflows across all communication channels.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setConfirmingOptOut(false)}>
                      Cancel
                    </Button>
                    <Button variant="danger" size="sm" onClick={recordOptOut} disabled={busy}>
                      Confirm Opt-Out
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setConfirmingOptOut(true)} className="text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200">
                  Record Opt-Out
                </Button>
              ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}
