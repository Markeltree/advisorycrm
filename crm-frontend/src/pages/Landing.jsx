import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Sparkles,
  Workflow,
  ClipboardCheck,
  PhoneOff,
  History,
  Kanban,
  UserPlus,
  CalendarCheck,
  Gift,
  Bot,
  Menu,
  X,
} from 'lucide-react';
import { LEAD_CATEGORIES } from '../data/constants.js';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#compliance', label: 'Compliance' },
];

const STATS = [
  { value: '12', label: 'Automated workflows' },
  { value: '11', label: 'Pipeline stages tracked' },
  { value: '100%', label: 'AI drafts reviewed by an advisor' },
  { value: '0', label: 'Calls placed without consent' },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Consent-gated outreach',
    body: 'No call, text or email goes out until consent is recorded with a timestamp and source. Every workflow checks it first.',
  },
  {
    icon: MapPin,
    title: 'Licensed-state checks',
    body: "A lead's resident state is matched against your licensing footprint before anyone reaches out.",
  },
  {
    icon: ClipboardCheck,
    title: 'Advisor approval queue',
    body: 'Illustrations, document requests and recap emails are drafted by AI and wait for an advisor to approve, edit or reject.',
  },
  {
    icon: Kanban,
    title: 'End-to-end pipeline',
    body: 'Follow each case from new lead through discovery, illustration, underwriting and in-force, all on one board.',
  },
  {
    icon: Workflow,
    title: 'Workflow automation',
    body: 'Reminders, no-answer follow-ups, booking confirmations and greetings run on schedule without manual work.',
  },
  {
    icon: History,
    title: 'Full audit trail',
    body: 'Every consent change, opt-out and approval is written to the compliance log with who did it and when.',
  },
];

const STEPS = [
  {
    icon: UserPlus,
    title: 'Lead comes in',
    body: 'From a web form or a lead vendor webhook, with the reason for entry recorded.',
  },
  {
    icon: ShieldCheck,
    title: 'Consent and license verified',
    body: 'Outreach stays locked until consent is given and the state is licensed.',
  },
  {
    icon: Bot,
    title: 'AI drafts, advisor approves',
    body: 'Calls, follow-ups and illustrations are prepared for you. Nothing sensitive goes out unreviewed.',
  },
  {
    icon: Gift,
    title: 'Client stays engaged',
    body: 'Annual reviews, greetings and referral asks keep in-force clients close.',
  },
];

const COMPLIANCE_POINTS = [
  'STOP replies and verbal opt-outs are honoured immediately across every workflow',
  'Fixed disclosure lines on AI voice calls',
  'Do-not-call flags suppress all automated contact',
  'Consent timestamp and source kept on every contact record',
];

function Brand({ inverted = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          inverted ? 'bg-white text-zinc-950' : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
        }`}
      >
        <Layers className="w-4 h-4" />
      </span>
      <span className={`font-bold text-sm tracking-tight ${inverted ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>
        Advisory CRM
      </span>
    </span>
  );
}

function PrimaryLink({ children, className = '' }) {
  return (
    <Link
      to="/signin"
      className={`inline-flex items-center justify-center gap-2 h-11 px-5 text-sm font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors ${className}`}
    >
      {children}
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

// Static illustration of the product, not live data.
function ProductPreview() {
  const columns = [
    { stage: 'New Lead', count: 4 },
    { stage: 'Discovery Booked', count: 3 },
    { stage: 'Underwriting', count: 2 },
  ];
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-200/40 via-transparent to-zinc-200/60 blur-2xl rounded-3xl dark:from-emerald-900/20 dark:to-zinc-800/40" />
      <div className="relative rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/5 overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <span className="ml-3 text-[11px] font-medium text-zinc-400">Today</span>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2.5">
            {columns.map((c) => (
              <div key={c.stage} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-[10px] font-medium text-zinc-500 truncate">{c.stage}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{c.count}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Approval queue</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                2 waiting
              </span>
            </div>
            {[
              { name: 'Maya Chen', item: 'Whole Life illustration', tag: 'Draft ready' },
              { name: 'Friday recap', item: 'Weekly client email', tag: 'Needs review' },
            ].map((row) => (
              <div key={row.name} className="flex items-center justify-between gap-3 px-3.5 py-3 border-b last:border-b-0 border-zinc-100 dark:border-zinc-800">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{row.name}</p>
                  <p className="text-[11px] text-zinc-500 truncate">{row.item}</p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                  <CheckCircle2 className="w-3 h-3" />
                  Approve
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 border border-emerald-100 px-3.5 py-2.5 dark:bg-emerald-950/40 dark:border-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-[11px] text-emerald-900 dark:text-emerald-200">
              Consent verified · TX licensed · Outreach unlocked
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-zinc-100 bg-white/80 backdrop-blur dark:border-zinc-900 dark:bg-zinc-950/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#top" aria-label="Advisory CRM home">
            <Brand />
          </a>
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/signin"
              className="hidden sm:inline-flex items-center h-9 px-4 text-sm font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
            >
              Sign in
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden w-9 h-9 inline-flex items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-zinc-100 px-4 py-3 space-y-1 bg-white dark:border-zinc-900 dark:bg-zinc-950">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block px-2 py-2 text-sm rounded-md text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                {l.label}
              </a>
            ))}
            <Link to="/signin" className="block px-2 py-2 text-sm font-semibold rounded-md text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900">
              Sign in
            </Link>
          </div>
        )}
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-60 dark:opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(228 228 231) 1px, transparent 0)',
              backgroundSize: '24px 24px',
              maskImage: 'linear-gradient(to bottom, black, transparent 85%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 85%)',
            }}
          />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 grid lg:grid-cols-2 gap-14 items-center">
            <div className="space-y-7">
              <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Built for insurance and financial advisory practices
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight leading-[1.08]">
                Automate client follow-up.{' '}
                <span className="text-zinc-400 dark:text-zinc-500">Stay compliant by default.</span>
              </h1>
              <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                Advisory CRM takes every lead from first contact to in-force client. Consent checks, licensed-state rules
                and advisor approval are built into each step.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <PrimaryLink>Open the CRM</PrimaryLink>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center h-11 px-5 text-sm font-semibold rounded-lg border border-zinc-200 text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  See how it works
                </a>
              </div>
              <p className="text-xs text-zinc-500">
                Demo login: <span className="font-medium text-zinc-700 dark:text-zinc-300">advisor@agency.com</span> ·{' '}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">password123</span>
              </p>
            </div>
            <ProductPreview />
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-zinc-100 bg-zinc-50/60 dark:border-zinc-900 dark:bg-zinc-900/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold tracking-tight">{s.value}</p>
                <p className="text-sm text-zinc-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Features</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Everything a practice needs, in one place</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Replace spreadsheets, sticky notes and separate dialers with one system that knows the rules.
            </p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="group rounded-2xl border border-zinc-200 p-6 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-900/5 transition-all dark:border-zinc-800 dark:hover:border-zinc-700"
              >
                <span className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors dark:bg-zinc-900 dark:text-zinc-100 dark:group-hover:bg-white dark:group-hover:text-zinc-900">
                  <Icon className="w-5 h-5" />
                </span>
                <h3 className="mt-5 font-bold">{title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 bg-zinc-50 border-y border-zinc-100 dark:bg-zinc-900/40 dark:border-zinc-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">How it works</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">From first form to lifelong client</h2>
            </div>
            <ol className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="relative rounded-2xl bg-white border border-zinc-200 p-6 dark:bg-zinc-950 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center dark:bg-white dark:text-zinc-900">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="text-4xl font-extrabold text-zinc-100 dark:text-zinc-800">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 font-bold">{title}</h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Compliance */}
        <section id="compliance" className="scroll-mt-20 max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="rounded-3xl bg-zinc-900 text-white p-8 sm:p-12 lg:p-16 grid lg:grid-cols-2 gap-12 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="relative space-y-4">
              <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 text-emerald-300">
                <PhoneOff className="w-3.5 h-3.5" />
                DNC and opt-out handler
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Compliance isn't a checklist. It's the default.</h2>
              <p className="text-zinc-400 leading-relaxed">
                TCPA consent, do-not-call lists and licensing rules are enforced by the system itself, so your team
                doesn't have to remember them on every call.
              </p>
            </div>
            <ul className="relative space-y-4 self-center">
              {COMPLIANCE_POINTS.map((p) => (
                <li key={p} className="flex gap-3 text-sm text-zinc-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Lead categories */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28 text-center">
          <p className="text-sm font-semibold text-zinc-500">Organised around the markets you serve</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {LEAD_CATEGORIES.map((c) => (
              <span
                key={c}
                className="text-sm px-4 py-2 rounded-full border border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
              >
                {c}
              </span>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-zinc-100 dark:border-zinc-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-24 text-center space-y-6">
            <span className="inline-flex w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 items-center justify-center dark:bg-emerald-950/50 dark:text-emerald-400">
              <CalendarCheck className="w-6 h-6" />
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Spend your time with clients, not on follow-ups</h2>
            <p className="text-zinc-600 dark:text-zinc-400">Sign in with the demo advisor account and explore the full pipeline.</p>
            <PrimaryLink>Get started</PrimaryLink>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-100 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Brand />
          <p className="text-xs text-zinc-500">© {new Date().getFullYear()} Advisory CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
