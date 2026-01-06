import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  children,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No data available',
}) => {
  return (
    <div className="rounded-lg border border-moss-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-forest-700">{title}</h3>
        {description && <p className="mt-1 text-sm text-sage-600">{description}</p>}
      </div>

      <div className="min-h-[200px]">
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="text-sage-500">Loading...</div>
          </div>
        ) : isEmpty ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="text-sage-500">{emptyMessage}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};
