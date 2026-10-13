import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  FileWarning,
  UserX,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { APPROVED_WORDING } from '../data/constants.js';
import { formatDateTime, fullName } from '../lib/format.js';
import {
  Badge,
  EmptyState,
  ErrorNotice,
  LicenseBadge,
  Loading,
  Metric,
  PageHeader,
  Panel,
} from '../components/ui.jsx';

export default function Compliance() {
  const { notify } = useToast();
  const contacts = useAsync(() => api.listContacts({}), []);
  const events = useAsync(() => api.listComplianceEvents(), []);
  const [copiedKey, setCopiedKey] = useState(null);

  function copyWording(key, text) {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    notify('Legal copy copied to clipboard.', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  }

  if (contacts.status === 'loading' || events.status === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Compliance Oversight" />
        <Loading label="Loading compliance data" />
      </div>
    );
  }

  if (contacts.status === 'error' || events.status === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="Compliance Oversight" />
        <ErrorNotice>Compliance data could not load. Refresh the page to try again.</ErrorNotice>
      </div>
    );
  }

  const all = contacts.data || [];
  const holdQueue = all.filter(
    (c) => c.licensingStatus === 'Not Licensed' || c.licensingStatus === 'Pending Verification'
  );
  const optedOut = all.filter((c) => c.consentStatus === 'Opted Out');
  const notCaptured = all.filter((c) => c.consentStatus === 'Not Captured');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance & Legal Oversight"
        lead="Auditing verified licenses, tracking suppressions, and maintaining legal consent disclosures across automated channels."
      />

      {/* Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Compliance summary">
        <Metric
          label="Hold Queue"
          value={holdQueue.length}
          note="Unlicensed or unverified states"
          tone="warn"
          icon={ShieldAlert}
        />
        <Metric
          label="Consent Not Captured"
          value={notCaptured.length}
          note="Automated outreach blocked"
          tone="warn"
          icon={FileWarning}
        />
        <Metric
          label="Suppressed / Opted Out"
          value={optedOut.length}
          note="Universal suppression active"
          tone="danger"
          icon={UserX}
        />
      </section>

      {/* Two Column: Hold Queue & Opt-outs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel
          title="Hold Queue"
          description="Contacts held due to state licensing constraints. Route to partner or verify state authorization."
        >
          {holdQueue.length === 0 ? (
            <EmptyState title="Hold queue is clear" children="All active leads have verified resident licenses." />
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {holdQueue.map((c) => (
                <li key={c.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div>
                    <Link
                      to={`/contacts/${c.id}`}
                      className="text-xs font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                    >
                      {fullName(c)}
                    </Link>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {c.state} · {c.leadCategory}
                    </p>
                  </div>
                  <LicenseBadge status={c.licensingStatus} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Universal Opt-Outs"
          description="Logged STOP responses and advisor suppression flags. All automated outreach is permanently halted."
        >
          {optedOut.length === 0 ? (
            <EmptyState title="No opt-outs logged" children="Zero suppression flags recorded in system." />
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {optedOut.map((c) => (
                <li key={c.id} className="py-3 flex flex-col gap-1 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/contacts/${c.id}`}
                      className="text-xs font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                    >
                      {fullName(c)}
                    </Link>
                    <Badge tone="danger">Opted Out</Badge>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {c.optOut
                      ? `${c.optOut.channel} · "${c.optOut.trigger}" · ${formatDateTime(c.optOut.at)}`
                      : 'Record timestamp missing'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Compliance Event Log Table */}
      <Panel title="Audit Trail & Compliance Log" description="Immutable sequence of consent changes, state reviews, and opt-outs.">
        {events.data?.length === 0 ? (
          <EmptyState title="No recorded compliance events" />
        ) : (
          <div className="rounded-lg border border-zinc-200/80 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                    <th scope="col" className="py-2.5 px-3">Timestamp</th>
                    <th scope="col" className="py-2.5 px-3">Contact</th>
                    <th scope="col" className="py-2.5 px-3">Event Type</th>
                    <th scope="col" className="py-2.5 px-3">Channel</th>
                    <th scope="col" className="py-2.5 px-3">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs">
                  {events.data.map((e) => (
                    <tr key={e.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-zinc-400 text-[11px] whitespace-nowrap">
                        {formatDateTime(e.at)}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {e.contactId ? (
                          <Link to={`/contacts/${e.contactId}`} className="hover:underline">
                            {e.contactName}
                          </Link>
                        ) : (
                          e.contactName
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{e.event}</span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">{e.channel}</td>
                      <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">{e.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Panel>

      {/* Approved Legal Wording */}
      <Panel
        title="Approved Legal Disclosure Wording"
        description="Pre-cleared legal language mandated for automated voice disclosures, SMS notifications, and intake checkboxes."
      >
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60 text-xs mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Mandatory script disclosures. Any modifications require General Counsel & Compliance Officer approval.</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'disclosure', title: 'AI Voice Opening Disclosure', text: APPROVED_WORDING.disclosure },
            { key: 'smsOptIn', title: 'Initial SMS Opt-In Confirmation', text: APPROVED_WORDING.smsOptIn },
            { key: 'smsFooter', title: 'Recurring SMS Footer & STOP Disclosure', text: APPROVED_WORDING.smsFooter },
            { key: 'webConsent', title: 'Web Form TCPA Checkbox Copy', text: APPROVED_WORDING.webConsent },
          ].map((item) => (
            <div
              key={item.key}
              className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</p>
                  <button
                    type="button"
                    onClick={() => copyWording(item.key, item.text)}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    title="Copy text"
                  >
                    {copiedKey === item.key ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <blockquote className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 italic bg-white dark:bg-zinc-950/80 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80 leading-relaxed">
                  "{item.text}"
                </blockquote>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
