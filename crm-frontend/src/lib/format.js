const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function money(value) {
  if (value === null || value === undefined || value === '') return '—';
  return currency.format(Number(value));
}

export function formatDate(iso) {
  return iso ? dateFormat.format(new Date(iso)) : '—';
}

export function formatDateTime(iso) {
  return iso ? dateTimeFormat.format(new Date(iso)) : '—';
}

export function timeAgo(iso) {
  if (!iso) return '—';
  const minutes = (Date.now() - new Date(iso).getTime()) / 60000;
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${Math.round(minutes)} min ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} h ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function fullName(contact) {
  return `${contact.firstName} ${contact.lastName}`.trim();
}

export function percent(ratio) {
  if (ratio === null || ratio === undefined) return '—';
  return `${Math.round(ratio * 100)}%`;
}

export function minutesLabel(minutes) {
  if (minutes === null || minutes === undefined) return '—';
  const whole = Math.floor(minutes);
  const seconds = Math.round((minutes - whole) * 60);
  return `${whole}m ${String(seconds).padStart(2, '0')}s`;
}
