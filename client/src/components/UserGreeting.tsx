import { useState } from 'react';
import { useHelloById } from '../hooks/useApi';

export const UserGreeting: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [submittedId, setSubmittedId] = useState('');

  const { data, isLoading, error } = useHelloById(
    submittedId,
    submittedId.length > 0
  );

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setSubmittedId(userId);
  };

  return (
    <div className="rounded-lg border border-moss-200 bg-forest-50 p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-forest-800">
        GET /api/:id
      </h2>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={userId}
            onChange={(e): void => setUserId(e.target.value)}
            placeholder="Enter user ID..."
            className="flex-1 rounded-md border border-sage-300 bg-white px-4 py-2 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
          />
          <button
            type="submit"
            disabled={userId.length === 0}
            className="rounded-md bg-forest-600 px-6 py-2 text-white hover:bg-forest-700 disabled:cursor-not-allowed disabled:bg-sage-400"
          >
            Submit
          </button>
        </div>
      </form>

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
          <p className="text-lg font-medium text-moss-900">{data.message}</p>
        </div>
      )}
    </div>
  );
};
