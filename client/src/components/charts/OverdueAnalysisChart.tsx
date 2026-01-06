import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { OverdueAnalysis } from '../../types/reports';
import { ChartCard } from './ChartCard';
import { CHART_COLORS } from '../../lib/chartColors';

interface OverdueAnalysisChartProps {
  data: OverdueAnalysis;
}

export const OverdueAnalysisChart: React.FC<OverdueAnalysisChartProps> = ({ data }) => {
  const isEmpty = data.overdueCount === 0;

  return (
    <ChartCard
      title="Overdue Analysis"
      description={`${data.overdueCount} overdue todos (avg: ${data.averageDaysOverdue} days)`}
      isEmpty={isEmpty}
      emptyMessage="No overdue todos"
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data.overdueByAge}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ageRange" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill={CHART_COLORS.status.overdue} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
