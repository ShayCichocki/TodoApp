import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { format } from 'date-fns';

export function Profile() {
  const { user } = useAuth();
  const { data: todos = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: api.getTodos,
  });

  if (!user) {
    return null;
  }

  const activeTodos = todos.filter((todo) => !todo.isComplete);
  const completedTodos = todos.filter((todo) => todo.isComplete);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-lg text-gray-900">{user.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Member since</h3>
              <p className="mt-1 text-lg text-gray-900">
                {format(new Date(user.createdAt), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-xl font-semibold text-gray-900">Todo Statistics</h3>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="overflow-hidden rounded-lg bg-gray-50 px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Total Todos</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {todos.length}
              </dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-blue-50 px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-blue-600">Active Todos</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-blue-900">
                {activeTodos.length}
              </dd>
            </div>
            <div className="overflow-hidden rounded-lg bg-green-50 px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-green-600">Completed Todos</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-900">
                {completedTodos.length}
              </dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
