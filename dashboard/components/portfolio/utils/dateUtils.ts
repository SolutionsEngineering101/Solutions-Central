export function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;

  const days = Math.floor(seconds / 86400);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString();
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export function getDaysUntil(date: Date): number {
  const now = new Date();
  const future = new Date(date);
  return Math.ceil((future.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDaysOverdue(date: Date): number {
  const daysUntil = getDaysUntil(date);
  return daysUntil < 0 ? Math.abs(daysUntil) : 0;
}

export function isOverdue(date: Date): boolean {
  return getDaysUntil(date) < 0;
}

export function isUrgent(date: Date): boolean {
  const daysUntil = getDaysUntil(date);
  return daysUntil <= 3 && daysUntil >= 0;
}
