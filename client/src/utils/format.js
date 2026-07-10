export function compactNumber(n = 0) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
}

export function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(d) {
  if (!d) return '';
  const secs = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  const units = [
    ['y', 31536000],
    ['mo', 2592000],
    ['d', 86400],
    ['h', 3600],
    ['m', 60],
  ];
  for (const [label, s] of units) {
    const v = Math.floor(secs / s);
    if (v >= 1) return `${v}${label} ago`;
  }
  return 'just now';
}

export function daysLeft(deadline) {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  return diff;
}

export function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
