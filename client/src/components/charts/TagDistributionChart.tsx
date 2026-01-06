import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TagDistribution } from '../../types/reports';
import { ChartCard } from './ChartCard';
import { getColorForIndex } from '../../lib/chartColors';

interface TagDistributionChartProps {
  data: TagDistribution[];
}

export const TagDistributionChart: React.FC<TagDistributionChartProps> = ({ data }) => {
  const isEmpty = data.length === 0;

  return (
    <ChartCard
      title="Tag Distribution"
      description="Todos grouped by tags"
      isEmpty={isEmpty}
      emptyMessage="No tags found"
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data as never}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color ?? getColorForIndex(index, 'forest')}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
