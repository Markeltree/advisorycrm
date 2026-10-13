import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Clock,
  MapPin,
  Tag,
  ArrowRight,
  User,
  Kanban as KanbanIcon,
} from 'lucide-react';
import { api } from '../api/index.js';
import { useAsync } from '../hooks/useAsync.js';
import { STAGES } from '../data/constants.js';
import { fullName, timeAgo } from '../lib/format.js';
import { ConsentBadge, ErrorNotice, Loading, PageHeader } from '../components/ui.jsx';

export default function Pipeline() {
  const contacts = useAsync(() => api.listContacts({}), []);
  const location = useLocation();

  useEffect(() => {
    if (!location.hash || contacts.status !== 'ready') return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    target?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  }, [location.hash, contacts.status]);

  const byStage = Object.fromEntries(STAGES.map((s) => [s, []]));
  (contacts.data || []).forEach((c) => {
    if (byStage[c.stage]) byStage[c.stage].push(c);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline Board"
        lead="Manage and track prospects across acquisition stages. Click any contact to view profile details, update stage or manage consent."
      />

      {contacts.status === 'loading' && <Loading label="Loading pipeline board" />}
      {contacts.status === 'error' && <ErrorNotice>{contacts.error.message}</ErrorNotice>}

      {contacts.status === 'ready' && (
        <div
          className="flex gap-4 overflow-x-auto pb-6 pt-1 snap-x select-none"
          role="list"
          aria-label="Pipeline stages"
        >
          {STAGES.map((stage) => {
            const items = byStage[stage] || [];
            return (
              <section
                key={stage}
                id={stage}
                className="w-80 shrink-0 flex flex-col rounded-xl border border-zinc-200/80 bg-zinc-50/70 dark:bg-zinc-900/60 dark:border-zinc-800 max-h-[calc(100vh-14rem)] shadow-2xs"
                role="listitem"
                aria-label={`${stage}, ${items.length} contacts`}
              >
                {/* Column Header */}
                <header className="flex items-center justify-between p-3.5 border-b border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-t-xl sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                      {stage}
                    </h2>
                  </div>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {items.length}
                  </span>
                </header>

                {/* Cards List */}
                <ul className="flex-1 overflow-y-auto p-3 space-y-3">
                  {items.length === 0 && (
                    <li className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500 italic border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                      No contacts in this stage
                    </li>
                  )}
                  {items.map((c) => (
                    <li key={c.id}>
                      <Link
                        to={`/contacts/${c.id}`}
                        className="group block p-3.5 rounded-lg border border-zinc-200/80 bg-white hover:border-zinc-300 hover:shadow-xs dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 transition-all duration-150"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-zinc-900 group-hover:text-primary dark:text-zinc-100 line-clamp-1">
                            {fullName(c)}
                          </span>
                          <span className="text-[11px] font-mono font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            {c.state}
                          </span>
                        </div>

                        {c.leadCategory && (
                          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                            {c.leadCategory} {c.productInterest ? `· ${c.productInterest}` : ''}
                          </p>
                        )}

                        <div className="mt-2.5">
                          <ConsentBadge status={c.consentStatus} />
                        </div>

                        {c.nextStep && (
                          <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-start gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                            <ArrowRight className="w-3 h-3 text-zinc-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{c.nextStep}</span>
                          </div>
                        )}

                        <div className="mt-2 text-[10px] text-zinc-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Contacted {timeAgo(c.lastContactAt)}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
