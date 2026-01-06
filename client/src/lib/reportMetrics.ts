import { Todo, Priority } from '../types/api';
import {
  SummaryMetrics,
  TagDistribution,
  PriorityDistribution,
  OnTimeCompletionRate,
  CompletionTime,
  CompletionTrend,
  OverdueAnalysis,
  OverdueByAge,
  TimeGrouping,
} from '../types/reports';
import { isPastDue, getDaysOverdue } from './dateUtils';

export const calculateSummaryMetrics = (todos: Todo[]): SummaryMetrics => {
  const openCount = todos.filter((todo) => !todo.isComplete).length;
  const closedCount = todos.filter((todo) => todo.isComplete).length;
  const overdueCount = todos.filter((todo) => isPastDue(todo.dueDate, todo.isComplete)).length;

  return {
    totalCount: todos.length,
    openCount,
    closedCount,
    overdueCount,
  };
};

export const getTagDistribution = (todos: Todo[]): TagDistribution[] => {
  const tagCounts = new Map<string, { count: number; color?: string }>();

  todos.forEach((todo) => {
    todo.tags.forEach((todoTag) => {
      const tagName = todoTag.tag.name;
      const existing = tagCounts.get(tagName);
      if (existing) {
        existing.count++;
      } else {
        tagCounts.set(tagName, {
          count: 1,
          color: todoTag.tag.color,
        });
      }
    });
  });

  const distribution = Array.from(tagCounts.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      color: data.color,
    }))
    .sort((a, b) => b.count - a.count);

  if (distribution.length > 10) {
    const top10 = distribution.slice(0, 10);
    const otherCount = distribution.slice(10).reduce((sum, item) => sum + item.count, 0);
    if (otherCount > 0) {
      top10.push({ name: 'Other', count: otherCount, color: undefined });
    }
    return top10;
  }

  return distribution;
};

const PRIORITY_ORDER: Record<Priority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const getPriorityDistribution = (todos: Todo[]): PriorityDistribution[] => {
  const priorityCounts = new Map<Priority, number>();

  todos.forEach((todo) => {
    const count = priorityCounts.get(todo.priority) ?? 0;
    priorityCounts.set(todo.priority, count + 1);
  });

  return Array.from(priorityCounts.entries())
    .map(([priority, count]) => ({ priority, count }))
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
};

export const calculateOnTimeCompletionRate = (todos: Todo[]): OnTimeCompletionRate => {
  const completedTodos = todos.filter((todo) => todo.isComplete);

  if (completedTodos.length === 0) {
    return {
      onTimeCount: 0,
      lateCount: 0,
      onTimePercentage: 0,
    };
  }

  let onTimeCount = 0;
  let lateCount = 0;

  completedTodos.forEach((todo) => {
    const dueDate = new Date(todo.dueDate);
    const completedDate = new Date(todo.updatedAt);

    if (completedDate <= dueDate) {
      onTimeCount++;
    } else {
      lateCount++;
    }
  });

  const onTimePercentage = completedTodos.length > 0
    ? (onTimeCount / completedTodos.length) * 100
    : 0;

  return {
    onTimeCount,
    lateCount,
    onTimePercentage: Math.round(onTimePercentage * 10) / 10,
  };
};

export const calculateAverageCompletionTime = (todos: Todo[]): CompletionTime => {
  const completedTodos = todos.filter((todo) => todo.isComplete);

  if (completedTodos.length === 0) {
    return {
      averageHours: 0,
      averageDays: 0,
    };
  }

  let totalHours = 0;

  completedTodos.forEach((todo) => {
    const created = new Date(todo.createdAt);
    const completed = new Date(todo.updatedAt);
    const diffMs = completed.getTime() - created.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    totalHours += diffHours;
  });

  const averageHours = totalHours / completedTodos.length;
  const averageDays = averageHours / 24;

  return {
    averageHours: Math.round(averageHours * 10) / 10,
    averageDays: Math.round(averageDays * 10) / 10,
  };
};

const formatDate = (date: Date, groupBy: TimeGrouping): string => {
  if (groupBy === 'day') {
    return date.toISOString().split('T')[0] ?? '';
  } else if (groupBy === 'week') {
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const daysSinceFirstDay = Math.floor(
      (date.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24)
    );
    const weekNumber = Math.ceil((daysSinceFirstDay + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  } else {
    return date.toISOString().substring(0, 7);
  }
};

export const getCompletionTrends = (
  todos: Todo[],
  groupBy: TimeGrouping = 'day'
): CompletionTrend[] => {
  const completedTodos = todos.filter((todo) => todo.isComplete);

  if (completedTodos.length === 0) {
    return [];
  }

  const trendMap = new Map<string, number>();

  completedTodos.forEach((todo) => {
    const completedDate = new Date(todo.updatedAt);
    const key = formatDate(completedDate, groupBy);
    const count = trendMap.get(key) ?? 0;
    trendMap.set(key, count + 1);
  });

  return Array.from(trendMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const getOverdueAnalysis = (todos: Todo[]): OverdueAnalysis => {
  const overdueTodos = todos.filter((todo) => isPastDue(todo.dueDate, todo.isComplete));

  if (overdueTodos.length === 0) {
    return {
      overdueCount: 0,
      averageDaysOverdue: 0,
      overdueByAge: [],
    };
  }

  let totalDaysOverdue = 0;
  const ageRanges: Record<string, number> = {
    '0-3 days': 0,
    '4-7 days': 0,
    '8-14 days': 0,
    '15-30 days': 0,
    '30+ days': 0,
  };

  overdueTodos.forEach((todo) => {
    const daysOverdue = getDaysOverdue(todo.dueDate);
    totalDaysOverdue += daysOverdue;

    if (daysOverdue <= 3) {
      ageRanges['0-3 days'] = (ageRanges['0-3 days'] ?? 0) + 1;
    } else if (daysOverdue <= 7) {
      ageRanges['4-7 days'] = (ageRanges['4-7 days'] ?? 0) + 1;
    } else if (daysOverdue <= 14) {
      ageRanges['8-14 days'] = (ageRanges['8-14 days'] ?? 0) + 1;
    } else if (daysOverdue <= 30) {
      ageRanges['15-30 days'] = (ageRanges['15-30 days'] ?? 0) + 1;
    } else {
      ageRanges['30+ days'] = (ageRanges['30+ days'] ?? 0) + 1;
    }
  });

  const averageDaysOverdue = totalDaysOverdue / overdueTodos.length;

  const overdueByAge: OverdueByAge[] = Object.entries(ageRanges)
    .filter(([, count]) => count > 0)
    .map(([ageRange, count]) => ({ ageRange, count }));

  return {
    overdueCount: overdueTodos.length,
    averageDaysOverdue: Math.round(averageDaysOverdue * 10) / 10,
    overdueByAge,
  };
};
