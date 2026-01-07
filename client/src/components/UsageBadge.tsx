import { Link } from 'react-router-dom';

interface UsageBadgeProps {
  current: number;
  limit: number | null;
  resourceName: string;
}

export function UsageBadge({ current, limit, resourceName }: UsageBadgeProps) {
  if (limit === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
        Unlimited {resourceName}
      </span>
    );
  }

  const percentage = (current / limit) * 100;

  // Determine badge color based on usage percentage
  let badgeColor = 'bg-green-100 text-green-800';
  let showWarning = false;

  if (percentage >= 100) {
    badgeColor = 'bg-red-100 text-red-800';
    showWarning = true;
  } else if (percentage >= 80) {
    badgeColor = 'bg-yellow-100 text-yellow-800';
    showWarning = true;
  }

  return (
    <div className="inline-flex items-center space-x-2">
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${badgeColor}`}>
        {current} / {limit} {resourceName}
      </span>

      {showWarning && percentage < 100 && (
        <Link
          to="/pricing"
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          Upgrade
        </Link>
      )}

      {percentage >= 100 && (
        <Link
          to="/pricing"
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Upgrade to Continue
        </Link>
      )}
    </div>
  );
}
