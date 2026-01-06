import type { Todo } from '../types/api';
import { isPastDue, isDueToday } from '../lib/dateUtils';

interface DueTodayHeaderProps {
  todos: Todo[];
}

export const DueTodayHeader: React.FC<DueTodayHeaderProps> = ({ todos }) => {
  const pastDueCount = todos.filter((todo) => isPastDue(todo.dueDate, todo.isComplete)).length;
  const dueTodayCount = todos.filter((todo) => !todo.isComplete && isDueToday(todo.dueDate)).length;

  if (pastDueCount === 0 && dueTodayCount === 0) {
    return null;
  }

  return (
    <div className="rounded-lg bg-white border border-sage-300 p-4 shadow-sm mb-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-forest-800">Quick Summary</h3>
        <div className="flex items-center gap-2">
          {pastDueCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-100 border border-red-300 px-3 py-1 text-xs font-medium text-red-800">
              {pastDueCount} overdue
            </span>
          )}
          {dueTodayCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-orange-100 border border-orange-300 px-3 py-1 text-xs font-medium text-orange-800">
              {dueTodayCount} due today
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
