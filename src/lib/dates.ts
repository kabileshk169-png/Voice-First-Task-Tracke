export function getTodayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysOffsetISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isToday(dateString?: string): boolean {
  if (!dateString) return false;
  return dateString.startsWith(getTodayISO());
}

export function isTomorrow(dateString?: string): boolean {
  if (!dateString) return false;
  return dateString.startsWith(getTomorrowISO());
}

export function isOverdue(dueDate?: string, dueTime?: string): boolean {
  if (!dueDate) return false;
  const now = new Date();
  const dateParts = dueDate.split('-').map(Number);
  if (dateParts.length < 3) return false;

  const due = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  if (dueTime) {
    const [h, m] = dueTime.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      due.setHours(h, m, 0, 0);
    } else {
      due.setHours(23, 59, 59, 999);
    }
  } else {
    due.setHours(23, 59, 59, 999);
  }

  return due.getTime() < now.getTime();
}

export function formatDateLabel(dateString?: string): string {
  if (!dateString) return 'No date';
  if (isToday(dateString)) return 'Today';
  if (isTomorrow(dateString)) return 'Tomorrow';

  const parts = dateString.split('-').map(Number);
  if (parts.length === 3) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return dateString;
}

export function formatFullDate(dateString?: string): string {
  if (!dateString) return 'No date set';
  const parts = dateString.split('-').map(Number);
  if (parts.length === 3) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
  return dateString;
}

export function formatTime12h(timeString?: string): string {
  if (!timeString) return '';
  const [hStr, mStr] = timeString.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return timeString;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.padStart(2, '0')} ${ampm}`;
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatRelativeTime(isoString: string): string {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  } catch {
    return 'Recently';
  }
}
