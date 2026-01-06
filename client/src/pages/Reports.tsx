import { useMemo } from 'react';
import { useTodos, useDeletedTodos } from '../hooks/useApi';
import {
  calculateSummaryMetrics,
  getTagDistribution,
  getPriorityDistribution,
  calculateOnTimeCompletionRate,
  calculateAverageCompletionTime,
  getCompletionTrends,
  getOverdueAnalysis,
} from '../lib/reportMetrics';
import { SummaryCards } from '../components/charts/SummaryCards';
import { TagDistributionChart } from '../components/charts/TagDistributionChart';
import { PriorityDistributionChart } from '../components/charts/PriorityDistributionChart';
import { OnTimeCompletionChart } from '../components/charts/OnTimeCompletionChart';
import { CompletionTrendsChart } from '../components/charts/CompletionTrendsChart';
import { AverageCompletionTimeCard } from '../components/charts/AverageCompletionTimeCard';
import { OverdueAnalysisChart } from '../components/charts/OverdueAnalysisChart';

export const Reports: React.FC = () => {
  const { data: activeTodos = [], isLoading: loadingActive } = useTodos();
  const { data: deletedTodos = [], isLoading: loadingDeleted } = useDeletedTodos();

  const isLoading = loadingActive || loadingDeleted;

  const allTodos = useMemo(
    () => [...activeTodos, ...deletedTodos],
    [activeTodos, deletedTodos]
  );

  const currentTodos = useMemo(
    () => activeTodos.filter((todo) => todo.deletedAt === null),
    [activeTodos]
  );

  const summaryMetrics = useMemo(
    () => calculateSummaryMetrics(currentTodos),
    [currentTodos]
  );

  const tagDistribution = useMemo(() => getTagDistribution(currentTodos), [currentTodos]);

  const priorityDistribution = useMemo(
    () => getPriorityDistribution(currentTodos),
    [currentTodos]
  );

  const onTimeRate = useMemo(() => calculateOnTimeCompletionRate(allTodos), [allTodos]);

  const avgCompletionTime = useMemo(
    () => calculateAverageCompletionTime(allTodos),
    [allTodos]
  );

  const completionTrends = useMemo(() => getCompletionTrends(allTodos, 'day'), [allTodos]);

  const overdueAnalysis = useMemo(() => getOverdueAnalysis(currentTodos), [currentTodos]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-lg text-sage-600">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-forest-700">Todo Reports</h1>
        <p className="mt-2 text-sage-600">Analytics and insights for your todo list</p>
      </header>

      <SummaryCards metrics={summaryMetrics} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TagDistributionChart data={tagDistribution} />
        <PriorityDistributionChart data={priorityDistribution} />
        <OnTimeCompletionChart data={onTimeRate} />
        <OverdueAnalysisChart data={overdueAnalysis} />
      </div>

      <CompletionTrendsChart data={completionTrends} />

      <AverageCompletionTimeCard data={avgCompletionTime} />
    </div>
  );
};
