import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Layers,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { isSignedIn, saveSession } from '../lib/session.js';
import { api, usingMockData } from '../api/index.js';
import { Button, Field, ErrorNotice } from '../components/ui.jsx';

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (isSignedIn()) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!email.includes('@')) {
      setError('Please enter a valid advisor email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setBusy(true);
    try {
      saveSession(await api.login(email.trim(), password));
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
      setBusy(false);
    }
  }

  function autofillDemo() {
    setEmail('advisor@agency.com');
    setPassword('password123');
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-zinc-50 dark:bg-zinc-950 font-sans">
      {/* Left side: Editorial / Value props */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-zinc-900 text-white relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-800/60 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <Link to="/" className="relative z-10 flex items-center gap-3 w-fit">
          <div className="w-9 h-9 rounded-xl bg-white text-zinc-950 flex items-center justify-center shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight">Advisory CRM</span>
            <span className="block text-[11px] text-zinc-400">Client Lifecycle Automation</span>
          </div>
        </Link>

        <div className="relative z-10 max-w-lg space-y-6">
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-zinc-50">
            Every lead gets a recorded reason, verified consent, and a licensed advisor.
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Engineered specifically for financial and insurance advisory practices. Automated outreach operates with strict TCPA consent gating and licensed state restrictions.
          </p>

          <div className="space-y-3 pt-2">
            {[
              'Autonomous lead ingestion with mandatory entry reason recording',
              'Real-time resident state license validation prior to contact',
              'Human-in-the-loop approval gate for every AI outbound draft',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-zinc-500">
          © {new Date().getFullYear()} Advisory Lifecycle CRM. Protected under SEC & TCPA compliance rules.
        </div>
      </div>

      {/* Right side: Modern Sign In Card */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile brand header */}
          <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-6 w-fit">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">Advisory CRM</span>
          </Link>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Welcome back
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Enter your advisor credentials to access your pipeline and approval queues.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/70 text-zinc-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 text-xs flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">Advisor Account Ready</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                advisor@agency.com · password123
              </p>
            </div>
            <button
              type="button"
              onClick={autofillDemo}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shrink-0 transition-colors"
            >
              Autofill
            </button>
          </div>

          {error && <ErrorNotice>{error}</ErrorNotice>}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="advisor@agency.com"
                  className="w-full h-10 pl-9 pr-3 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 pl-9 pr-3 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="w-full h-10 text-xs font-semibold gap-2 mt-2"
            >
              {busy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Advisory CRM</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
