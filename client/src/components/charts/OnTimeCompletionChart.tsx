import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { OnTimeCompletionRate } from '../../types/reports';
import { ChartCard } from './ChartCard';
import { CHART_COLORS } from '../../lib/chartColors';

interface OnTimeCompletionChartProps {
  data: OnTimeCompletionRate;
}

export const OnTimeCompletionChart: React.FC<OnTimeCompletionChartProps> = ({ data }) => {
  const isEmpty = data.onTimeCount === 0 && data.lateCount === 0;

  const chartData = [
    { name: 'On Time', value: data.onTimeCount, fill: CHART_COLORS.status.onTime },
    { name: 'Late', value: data.lateCount, fill: CHART_COLORS.status.late },
  ].filter((item) => item.value > 0);

  return (
    <ChartCard
      title="On-Time Completion Rate"
      description={`${data.onTimePercentage}% completed on or before due date`}
      isEmpty={isEmpty}
      emptyMessage="No completed todos found"
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={(entry) => `${entry.name}: ${entry.value}`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
