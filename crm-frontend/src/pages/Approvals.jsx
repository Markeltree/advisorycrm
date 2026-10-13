import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCheck,
  Undo2,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Bot,
  User,
  Send,
  Loader2,
} from 'lucide-react';
import { api } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { currentUserEmail } from '../lib/session.js';
import { formatDateTime, timeAgo } from '../lib/format.js';
import { Badge, Button, EmptyState, ErrorNotice, Loading, PageHeader } from '../components/ui.jsx';

const TABS = [
  { id: 'Pending', label: 'Waiting for Review' },
  { id: 'decided', label: 'Decided History' },
];

export default function Approvals() {
  const { notify } = useToast();
  const [tab, setTab] = useState('Pending');
  const [busyId, setBusyId] = useState(null);

  const approvals = useAsync(() => api.listApprovals(), []);

  const items = (approvals.data || []).filter((a) =>
    tab === 'Pending' ? a.status === 'Pending' : a.status !== 'Pending'
  );

  async function decide(item, decision) {
    setBusyId(item.id);
    try {
      await api.decideApproval(item.id, { decision, decidedBy: currentUserEmail() });
      notify(
        decision === 'approve'
          ? `${item.type} approved and dispatched.`
          : `${item.type} sent back to draft queue.`,
        decision === 'approve' ? 'success' : 'info'
      );
      approvals.reload();
    } catch (err) {
      notify(err.message, 'danger');
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = (approvals.data || []).filter((a) => a.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals Gateway"
        lead="AI outreach drafts pause here until an authorized advisor approves the communication. Approval triggers automated dispatch."
      />

      {/* Tabs list */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 w-fit">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                active
                  ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              <span>{t.label}</span>
              {t.id === 'Pending' && pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {approvals.status === 'loading' && <Loading label="Loading approval queue" />}
      {approvals.status === 'error' && <ErrorNotice>{approvals.error.message}</ErrorNotice>}

      {approvals.status === 'ready' && items.length === 0 && (
        <EmptyState
          title={tab === 'Pending' ? 'No drafts waiting for approval' : 'No decisions recorded'}
          children={
            tab === 'Pending'
              ? 'Automation drafts will queue here automatically when scheduled steps require human authorization.'
              : 'Decided and rejected drafts will show here with decision timestamps.'
          }
        />
      )}

      {approvals.status === 'ready' && items.length > 0 && (
        <div className="space-y-4">
          {items.map((item) => {
            const pending = item.status === 'Pending';
            const isWorking = busyId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{item.type}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Target Contact:{' '}
                        {item.contactId ? (
                          <Link to={`/contacts/${item.contactId}`} className="font-semibold text-zinc-800 dark:text-zinc-200 hover:underline">
                            {item.contactName}
                          </Link>
                        ) : (
                          <span className="font-semibold">{item.contactName}</span>
                        )}{' '}
                        · Generated {timeAgo(item.createdAt)}
                      </p>
                    </div>
                  </div>

                  <Badge tone={pending ? 'brass' : item.status === 'Approved' ? 'ok' : 'danger'}>
                    {item.status}
                  </Badge>
                </div>

                {/* Draft preview message */}
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-4 border border-zinc-200/70 dark:border-zinc-800/80">
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" />
                    <span>Generated AI Message Preview</span>
                  </p>
                  <blockquote className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
                    {item.draft}
                  </blockquote>
                </div>

                {/* Actions or decision trail */}
                {pending ? (
                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => decide(item, 'reject')}
                      disabled={isWorking}
                      className="text-zinc-600 hover:text-rose-600 gap-1.5"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Send Back</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => decide(item, 'approve')}
                      disabled={isWorking}
                      className="gap-1.5"
                    >
                      {isWorking ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCheck className="w-3.5 h-3.5" />
                      )}
                      <span>Approve & Dispatch</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>
                      {item.status} by <strong className="text-zinc-600 dark:text-zinc-300">{item.decidedBy || 'advisor'}</strong> on {formatDateTime(item.decidedAt)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
