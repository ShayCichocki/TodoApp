import { Link } from 'react-router-dom';

interface UpgradePromptProps {
  title: string;
  message: string;
  limit?: number | null;
  current?: number;
  remaining?: number | null;
}

export function UpgradePrompt({ title, message, limit, current, remaining }: UpgradePromptProps) {
  return (
    <div className="rounded-lg border-2 border-yellow-400 bg-yellow-50 p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-semibold text-yellow-900">{title}</h3>
          <p className="mt-2 text-sm text-yellow-800">{message}</p>

          {limit !== undefined && limit !== null && current !== undefined && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-yellow-800">
                <span>Usage: {current} / {limit}</span>
                {remaining !== null && (
                  <span className="font-medium">
                    {remaining} remaining
                  </span>
                )}
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-yellow-200">
                <div
                  className="h-2 rounded-full bg-yellow-600 transition-all"
                  style={{ width: `${limit > 0 ? (current / limit) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-4">
            <Link
              to="/pricing"
              className="inline-flex items-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
              Upgrade Now
              <svg
                className="ml-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
