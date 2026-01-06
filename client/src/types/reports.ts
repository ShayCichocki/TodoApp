import { Priority } from './api';

export interface SummaryMetrics {
  totalCount: number;
  openCount: number;
  closedCount: number;
  overdueCount: number;
}

export interface TagDistribution {
  name: string;
  count: number;
  color?: string;
}

export interface PriorityDistribution {
  priority: Priority;
  count: number;
}

export interface OnTimeCompletionRate {
  onTimeCount: number;
  lateCount: number;
  onTimePercentage: number;
}

export interface CompletionTime {
  averageHours: number;
  averageDays: number;
}

export interface CompletionTrend {
  date: string;
  count: number;
}

export interface OverdueByAge {
  ageRange: string;
  count: number;
}

export interface OverdueAnalysis {
  overdueCount: number;
  averageDaysOverdue: number;
  overdueByAge: OverdueByAge[];
}

export type TimeGrouping = 'day' | 'week' | 'month';
