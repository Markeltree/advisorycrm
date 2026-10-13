import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  Plus,
  Filter,
  User,
  Clock,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api/index.js';
import { useAsync } from '../hooks/useAsync.js';
import {
  CONSENT_STATUSES,
  LEAD_CATEGORIES,
  LICENSING_STATUSES,
  STAGES,
} from '../data/constants.js';
import { fullName, timeAgo } from '../lib/format.js';
import { Badge, Button, EmptyState, ErrorNotice, Loading, PageHeader } from '../components/ui.jsx';

const CONSENT_TONE = { Given: 'ok', 'Not Captured': 'warn', 'Opted Out': 'danger' };
const LICENSE_TONE = { Licensed: 'ok', 'Pending Verification': 'warn', 'Not Licensed': 'danger' };

export default function Contacts() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');

  const filters = useMemo(
    () => ({
      query: params.get('q') || '',
      category: params.get('category') || '',
      consent: params.get('consent') || '',
      licensing: params.get('licensing') || '',
      stage: params.get('stage') || '',
    }),
    [params]
  );

  const contacts = useAsync(
    () => api.listContacts(filters),
    [filters.query, filters.category, filters.consent, filters.licensing, filters.stage]
  );

  function updateFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  function submitSearch(event) {
    event.preventDefault();
    updateFilter('q', query.trim());
  }

  function clearFilters() {
    setQuery('');
    setParams(new URLSearchParams(), { replace: true });
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts Directory"
        lead="Comprehensive list of prospective and enrolled clients. Review verified licensing and consent records before executing outreach."
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

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <form className="flex flex-wrap items-center gap-2.5" role="search" onSubmit={submitSearch}>
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              id="contact-search"
              type="search"
              placeholder="Search by name, state or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => updateFilter('q', query.trim())}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-zinc-200 bg-zinc-50/50 hover:bg-white focus:bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-transparent dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 transition-all placeholder:text-zinc-400"
            />
          </div>

          <select
            id="filter-category"
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="h-9 px-3 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 transition-all"
          >
            <option value="">All Categories</option>
            {LEAD_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            id="filter-consent"
            value={filters.consent}
            onChange={(e) => updateFilter('consent', e.target.value)}
            className="h-9 px-3 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 transition-all"
          >
            <option value="">Any Consent</option>
            {CONSENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            id="filter-licensing"
            value={filters.licensing}
            onChange={(e) => updateFilter('licensing', e.target.value)}
            className="h-9 px-3 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 transition-all"
          >
            <option value="">Any Licensing</option>
            {LICENSING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            id="filter-stage"
            value={filters.stage}
            onChange={(e) => updateFilter('stage', e.target.value)}
            className="h-9 px-3 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 transition-all"
          >
            <option value="">Any Stage</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-zinc-500 hover:text-zinc-900 gap-1.5">
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </Button>
          )}
        </form>
      </div>

      {contacts.status === 'loading' && <Loading label="Loading contacts directory" />}
      {contacts.status === 'error' && <ErrorNotice>{contacts.error.message}</ErrorNotice>}

      {contacts.status === 'ready' && contacts.data.length === 0 && (
        <EmptyState
          title={hasFilters ? 'No contacts match filters' : 'No contacts in system yet'}
          children={hasFilters ? 'Try adjusting your search criteria or clear the filters.' : 'Add your first contact to start tracking client lifecycles.'}
          action={
            hasFilters ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear active filters
              </Button>
            ) : (
              <Link
                to="/contacts/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add first contact</span>
              </Link>
            )
          }
        />
      )}

      {contacts.status === 'ready' && contacts.data.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
            <span>
              Showing <span className="font-semibold text-zinc-900 dark:text-zinc-100">{contacts.data.length}</span>{' '}
              {contacts.data.length === 1 ? 'contact' : 'contacts'}
            </span>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                    <th scope="col" className="py-3 px-4">Contact</th>
                    <th scope="col" className="py-3 px-3">State</th>
                    <th scope="col" className="py-3 px-3">Category</th>
                    <th scope="col" className="py-3 px-3">Stage</th>
                    <th scope="col" className="py-3 px-3">Consent</th>
                    <th scope="col" className="py-3 px-3">Licensing</th>
                    <th scope="col" className="py-3 px-4 text-right">Last Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs">
                  {contacts.data.map((c) => {
                    const initials = `${c.firstName?.charAt(0) || ''}${c.lastName?.charAt(0) || ''}`.toUpperCase();
                    return (
                      <tr
                        key={c.id}
                        className="group hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <Link
                            to={`/contacts/${c.id}`}
                            className="flex items-center gap-3 font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-primary"
                          >
                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0 border border-zinc-200/50 dark:border-zinc-700/50">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline">
                                {fullName(c)}
                              </p>
                              {c.email && (
                                <p className="text-[11px] text-zinc-400 font-normal">{c.email}</p>
                              )}
                            </div>
                          </Link>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-mono text-zinc-600 dark:text-zinc-400 font-medium">
                            {c.state}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">
                          {c.leadCategory}
                        </td>

                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                            {c.stage}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <Badge tone={CONSENT_TONE[c.consentStatus] || 'neutral'}>
                            {c.consentStatus}
                          </Badge>
                        </td>

                        <td className="py-3 px-3">
                          <Badge tone={LICENSE_TONE[c.licensingStatus] || 'neutral'}>
                            {c.licensingStatus}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right text-zinc-400 text-[11px] whitespace-nowrap">
                          {timeAgo(c.lastContactAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
