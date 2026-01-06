import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PriorityDistribution } from '../../types/reports';
import { ChartCard } from './ChartCard';
import { CHART_COLORS } from '../../lib/chartColors';

interface PriorityDistributionChartProps {
  data: PriorityDistribution[];
}

export const PriorityDistributionChart: React.FC<PriorityDistributionChartProps> = ({ data }) => {
  const isEmpty = data.length === 0;

  const chartData = data.map((item) => ({
    priority: item.priority,
    count: item.count,
    fill: CHART_COLORS.priority[item.priority],
  }));

  return (
    <ChartCard
      title="Priority Distribution"
      description="Todos grouped by priority level"
      isEmpty={isEmpty}
      emptyMessage="No todos found"
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="priority" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
