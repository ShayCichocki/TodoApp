import { CompletionTime } from '../../types/reports';
import { ChartCard } from './ChartCard';

interface AverageCompletionTimeCardProps {
  data: CompletionTime;
}

export const AverageCompletionTimeCard: React.FC<AverageCompletionTimeCardProps> = ({ data }) => {
  const isEmpty = data.averageDays === 0;

  return (
    <ChartCard
      title="Average Completion Time"
      description="Average time from creation to completion"
      isEmpty={isEmpty}
      emptyMessage="No completed todos found"
    >
      <div className="flex h-[200px] items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-bold text-forest-700">{data.averageDays}</div>
          <div className="mt-2 text-lg text-sage-600">days</div>
          <div className="mt-4 text-sm text-sage-500">
            ({data.averageHours} hours)
          </div>
        </div>
      </div>
    </ChartCard>
  );
};
