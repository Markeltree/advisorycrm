import { Link } from 'react-router-dom';
import {
  Zap,
  PhoneCall,
  CalendarCheck,
  UserCheck,
  Bot,
  ArrowRight,
  RefreshCw,
  Plus,
  AlertTriangle,
  Clock,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../api/index.js';
import { useAsync } from '../hooks/useAsync.js';
import { STAGES } from '../data/constants.js';
import { fullName, minutesLabel, percent, timeAgo } from '../lib/format.js';
import {
  Button,
  ConsentBadge,
  LicenseBadge,
  Badge,
  EmptyState,
  Loading,
  Metric,
  PageHeader,
  Panel,
  ErrorNotice,
} from '../components/ui.jsx';

export default function Dashboard() {
  const dashboard = useAsync(() => api.getDashboard(), []);
  const approvals = useAsync(() => api.listApprovals('Pending'), []);
  const contacts = useAsync(() => api.listContacts({}), []);

  const loading = dashboard.status === 'loading' || approvals.status === 'loading' || contacts.status === 'loading';
  const failed = dashboard.status === 'error' || approvals.status === 'error' || contacts.status === 'error';

  const attention = (contacts.data || []).filter(
    (c) =>
      c.consentStatus === 'Not Captured' ||
      c.licensingStatus === 'Not Licensed' ||
      c.licensingStatus === 'Pending Verification' ||
      c.aiEscalated
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today's Overview"
        lead="Action items needing human review, active pipeline progress, and automation performance."
        actions={
          <Link
            to="/contacts/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New contact</span>
          </Link>
        }
      />

      {loading && <Loading label="Loading today's metrics" />}
      {failed && <ErrorNotice>Some of this view could not load. Refresh the page to try again.</ErrorNotice>}

      {dashboard.data && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" aria-label="Key metrics">
          <Metric
            label="Speed to lead"
            value={minutesLabel(dashboard.data.speedToLeadMinutes)}
            note="Response time target: < 5m"
            icon={Zap}
          />
          <Metric
            label="Call connect rate"
            value={percent(dashboard.data.callConnectRate)}
            note="Live pick-up rate"
            icon={PhoneCall}
          />
          <Metric
            label="Discovery booking"
            value={percent(dashboard.data.bookingRate)}
            note="Qualified conversion"
            icon={CalendarCheck}
          />
          <Metric
            label="Show-up rate"
            value={percent(dashboard.data.showUpRate)}
            note="Confirmed attendees"
            icon={UserCheck}
          />
          <Metric
            label="Handled by AI"
            value={percent(dashboard.data.aiHandledShare)}
            note={`${dashboard.data.aiEscalations} escalated to advisor`}
            icon={Bot}
          />
        </section>
      )}

      {dashboard.data?.stageCounts && (
        <Panel
          title="Pipeline by Stage"
          description="Distribution of active contacts throughout the client acquisition funnel."
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {STAGES.map((stage) => {
              const count = dashboard.data.stageCounts[stage] || 0;
              return (
                <Link
                  key={stage}
                  to={`/pipeline#${encodeURIComponent(stage)}`}
                  className="group relative flex flex-col justify-between p-3.5 rounded-lg border border-zinc-200/80 bg-zinc-50/50 hover:bg-white hover:border-zinc-300 dark:bg-zinc-800/40 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-all hover:shadow-2xs"
                >
                  <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-primary">
                    {count}
                  </span>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 truncate">
                      {stage}
                    </span>
                    <ChevronRight className="w-3 h-3 text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting for approval */}
        <Panel
          title="Waiting for Approval"
          description="AI drafted messages requiring a licensed advisor review before dispatch."
          actions={
            <Link
              to="/approvals"
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          {approvals.data?.length === 0 ? (
            <EmptyState title="No drafts pending approval" children="All AI generated messages have been reviewed." />
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(approvals.data || []).slice(0, 5).map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{item.type}</p>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      For <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.contactName}</span> ·{' '}
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>
                  <Link
                    to="/approvals"
                    className="inline-flex items-center justify-center h-7 px-3 text-xs font-medium rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shrink-0 shadow-2xs"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Needs attention */}
        <Panel
          title="Needs Attention"
          description="Contacts on hold, pending licensing verification, or flagged by AI."
          actions={
            <Link
              to="/compliance"
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              <span>Compliance queue</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          {attention.length === 0 ? (
            <EmptyState title="Everything clear" children="No contacts currently blocked or needing compliance review." />
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {attention.slice(0, 5).map((c) => (
                <div key={c.id} className="py-3 flex flex-col gap-1.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/contacts/${c.id}`}
                      className="text-xs font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                    >
                      {fullName(c)}
                    </Link>
                    <span className="text-[11px] text-zinc-400 font-mono">{c.state}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <ConsentBadge status={c.consentStatus} />
                    <LicenseBadge status={c.licensingStatus} />
                    {c.aiEscalated && <Badge tone="brass">AI Escalated</Badge>}
                  </div>

                  {c.nextStep && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      Next: {c.nextStep}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => dashboard.reload()}
          className="gap-2 text-zinc-600 dark:text-zinc-300"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh metrics</span>
        </Button>
      </div>
    </div>
  );
}
