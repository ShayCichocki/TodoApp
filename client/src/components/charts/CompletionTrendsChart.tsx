import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CompletionTrend } from '../../types/reports';
import { ChartCard } from './ChartCard';
import { CHART_COLORS } from '../../lib/chartColors';

interface CompletionTrendsChartProps {
  data: CompletionTrend[];
}

export const CompletionTrendsChart: React.FC<CompletionTrendsChartProps> = ({ data }) => {
  const isEmpty = data.length === 0;

  return (
    <ChartCard
      title="Completion Trends Over Time"
      description="Number of todos completed per day"
      isEmpty={isEmpty}
      emptyMessage="No completed todos found"
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            stroke={CHART_COLORS.forest[0]}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS.forest[0] }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
