export interface TodayRange {
  start: Date;
  end: Date;
}

export const getToday = (): TodayRange => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
};

export const isPastDue = (dueDate: string, isComplete: boolean): boolean => {
  if (isComplete) {
    return false;
  }
  const due = new Date(dueDate);
  const now = new Date();
  return due < now;
};

export const isDueToday = (dueDate: string): boolean => {
  const due = new Date(dueDate);
  const { start, end } = getToday();
  return due >= start && due <= end;
};

export const addDaysToDate = (dateString: string, days: number): string => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export const formatDueDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const getDaysOverdue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};
