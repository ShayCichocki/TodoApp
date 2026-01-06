import { useHello } from '../hooks/useApi';

export const HelloDisplay: React.FC = () => {
  const { data, isLoading, error } = useHello();

  return (
    <div className="rounded-lg border border-moss-200 bg-forest-50 p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-forest-800">GET /api</h2>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-moss-500 border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">Error: {error.message}</p>
        </div>
      )}

      {data && (
        <div className="rounded-md bg-moss-100 p-4">
          <p className="text-lg font-medium text-moss-900">{data}</p>
        </div>
      )}
    </div>
  );
};
