import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  AlertCircle,
  Inbox
} from 'lucide-react';
import { cn } from '../lib/utils.js';

export function Button({
  variant = 'primary',
  size = 'default',
  className = '',
  type = 'button',
  children,
  disabled,
  ...props
}) {
  const variantStyles = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80 border border-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700',
    outline: 'border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:text-zinc-100',
    ghost: 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm dark:bg-rose-700 dark:hover:bg-rose-800',
    link: 'text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100 p-0 h-auto',
  };

  const sizeStyles = {
    default: 'h-9 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs rounded-md',
    lg: 'h-10 px-6 text-sm rounded-lg',
    icon: 'h-9 w-9 p-0 rounded-md',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
        variantStyles[variant] || variantStyles.primary,
        sizeStyles[size] || sizeStyles.default,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({ tone = 'neutral', children, title, className = '', dot = true }) {
  const tones = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    warn: 'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    brass: 'bg-orange-50 text-orange-700 border-orange-200/70 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60',
    info: 'bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200/70 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  };

  const dotColors = {
    ok: 'bg-emerald-500',
    warn: 'bg-amber-500',
    danger: 'bg-rose-500',
    brass: 'bg-orange-500',
    info: 'bg-sky-500',
    neutral: 'bg-zinc-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-2xs transition-colors',
        tones[tone] || tones.neutral,
        className
      )}
      title={title}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[tone] || dotColors.neutral)} />}
      {children}
    </span>
  );
}

const CONSENT_TONE = { Given: 'ok', 'Not Captured': 'warn', 'Opted Out': 'danger' };
const LICENSE_TONE = { Licensed: 'ok', 'Pending Verification': 'warn', 'Not Licensed': 'danger' };

export function ConsentBadge({ status, className = '' }) {
  const tone = CONSENT_TONE[status] || 'neutral';
  return (
    <Badge tone={tone} className={className}>
      Consent: {status || 'Not captured'}
    </Badge>
  );
}

export function LicenseBadge({ status, className = '' }) {
  const tone = LICENSE_TONE[status] || 'neutral';
  return (
    <Badge tone={tone} className={className}>
      License: {status || 'Unknown'}
    </Badge>
  );
}

export function Panel({ title, description, actions, children, className = '', id }) {
  return (
    <section
      className={cn(
        'rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 transition-all',
        className
      )}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-zinc-100 dark:border-zinc-800/80">
          <div>
            {title && (
              <h2
                className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
                id={id ? `${id}-title` : undefined}
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, lead, actions, className = '' }) {
  return (
    <header className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-6 border-b border-zinc-200/80 dark:border-zinc-800', className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h1>
        {lead && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">{lead}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </header>
  );
}

export function Field({ label, hint, error, htmlFor, children, wide = false, className = '' }) {
  return (
    <div className={cn('flex flex-col gap-1.5', wide && 'col-span-full', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
      {error && (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export function EmptyState({ title, children, action, className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 my-2', className)}>
      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
        <Inbox className="w-5 h-5" />
      </div>
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
      {children && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-md">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Loading({ label = 'Loading', className = '' }) {
  return (
    <div className={cn('flex items-center justify-center gap-2.5 py-12 text-sm text-zinc-500 dark:text-zinc-400 font-medium', className)} role="status">
      <Loader2 className="w-4 h-4 animate-spin text-zinc-900 dark:text-zinc-100" />
      <span>{label}...</span>
    </div>
  );
}

export function ErrorNotice({ children, className = '' }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3.5 text-sm rounded-lg bg-rose-50 text-rose-800 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900/60 my-3',
        className
      )}
      role="alert"
    >
      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function Metric({ label, value, note, tone, icon: Icon, className = '' }) {
  const toneBg = {
    warn: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    ok: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">{label}</p>
        {Icon && (
          <div className={cn('p-1.5 rounded-md text-zinc-500 bg-zinc-100 dark:bg-zinc-800', tone && toneBg[tone])}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</p>
      {note && (
        <p className={cn('mt-1.5 text-xs text-zinc-500 dark:text-zinc-400', tone === 'warn' && 'text-amber-600 dark:text-amber-400', tone === 'danger' && 'text-rose-600 dark:text-rose-400')}>
          {note}
        </p>
      )}
    </div>
  );
}
