import { useParams, Link } from 'react-router-dom';
import { useWorkspace, useWorkspaceStats } from '../hooks/useWorkspaces';
import { useWorkspaceMembers } from '../hooks/useWorkspaceMembers';
import { useActivityFeed } from '../hooks/useActivityFeed';
import { ActivityItem } from '../components/ActivityItem';

export default function WorkspaceDashboard() {
  const { id } = useParams<{ id: string }>();
  const workspaceId = parseInt(id ?? '0', 10);

  const { data: workspace, isLoading: loadingWorkspace } = useWorkspace(workspaceId);
  const { data: stats } = useWorkspaceStats(workspaceId);
  const { data: members } = useWorkspaceMembers(workspaceId);
  const { data: activityFeed } = useActivityFeed(workspaceId, { limit: 10 });

  if (loadingWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading workspace...</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Workspace not found</p>
          <Link to="/workspaces" className="text-blue-600 hover:text-blue-800">
            Back to workspaces
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Link to="/workspaces" className="hover:text-blue-600">
            Workspaces
          </Link>
          <span>/</span>
          <span>{workspace.name}</span>
        </div>
        <h1 className="text-3xl font-bold">{workspace.name}</h1>
        {workspace.description && (
          <p className="text-gray-600 mt-2">{workspace.description}</p>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Todos</div>
            <div className="text-2xl font-bold">{stats.totalTodos}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-2xl font-bold">{stats.completedTodos}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Completion Rate</div>
            <div className="text-2xl font-bold">{stats.completionRate.toFixed(0)}%</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Members</div>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          <Link
            to={`/workspaces/${workspaceId}`}
            className="py-2 border-b-2 border-blue-600 text-blue-600 font-medium"
          >
            Overview
          </Link>
          <Link
            to={`/workspaces/${workspaceId}/todos`}
            className="py-2 border-b-2 border-transparent hover:border-gray-300 text-gray-600"
          >
            Todos
          </Link>
          <Link
            to={`/workspaces/${workspaceId}/members`}
            className="py-2 border-b-2 border-transparent hover:border-gray-300 text-gray-600"
          >
            Members
          </Link>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            {activityFeed && activityFeed.activities.length > 0 ? (
              <div className="space-y-2">
                {activityFeed.activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent activity</p>
            )}
          </div>
        </div>

        {/* Members */}
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Members</h2>
              <Link
                to={`/workspaces/${workspaceId}/members`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Manage
              </Link>
            </div>
            {members && members.length > 0 ? (
              <div className="space-y-2">
                {members.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold">
                      {(member.user.name ?? member.user.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {member.user.name ?? member.user.email}
                      </div>
                      <div className="text-xs text-gray-500">{member.role}</div>
                    </div>
                  </div>
                ))}
                {members.length > 5 && (
                  <div className="text-sm text-gray-500 mt-2">
                    +{members.length - 5} more
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No members yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
