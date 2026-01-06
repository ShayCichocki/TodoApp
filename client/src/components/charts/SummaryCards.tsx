import { SummaryMetrics } from '../../types/reports';

interface SummaryCardsProps {
  metrics: SummaryMetrics;
}

interface StatCardProps {
  label: string;
  value: number;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, colorClass }) => {
  return (
    <div className="rounded-lg border border-moss-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-medium text-sage-600">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${colorClass}`}>{value}</div>
    </div>
  );
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total Todos" value={metrics.totalCount} colorClass="text-forest-700" />
      <StatCard label="Open" value={metrics.openCount} colorClass="text-moss-600" />
      <StatCard label="Completed" value={metrics.closedCount} colorClass="text-forest-600" />
      <StatCard label="Overdue" value={metrics.overdueCount} colorClass="text-red-600" />
    </div>
  );
};
