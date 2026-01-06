import { Todo, Priority } from '../types/api';
import { RescheduleButtons } from './RescheduleButtons';
import { isPastDue, isDueToday, getDaysOverdue } from '../lib/dateUtils';

interface TodoItemProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (id: number) => void;
  onToggleComplete: (id: number, isComplete: boolean) => void;
  onReschedule: (id: number, newDueDate: string) => void;
}

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getPriorityStyles = (priority: Priority): { bg: string; text: string; label: string } => {
  switch (priority) {
    case 'URGENT':
      return { bg: 'bg-red-100', text: 'text-red-800', label: 'Urgent' };
    case 'HIGH':
      return { bg: 'bg-orange-100', text: 'text-orange-800', label: 'High' };
    case 'MEDIUM':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium' };
    case 'LOW':
      return { bg: 'bg-green-100', text: 'text-green-800', label: 'Low' };
  }
};

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onEdit,
  onDelete,
  onToggleComplete,
  onReschedule,
}) => {
  const handleToggle = (): void => {
    onToggleComplete(todo.id, !todo.isComplete);
  };

  const handleEdit = (): void => {
    onEdit(todo);
  };

  const handleDelete = (): void => {
    if (confirm('Are you sure you want to delete this todo?')) {
      onDelete(todo.id);
    }
  };

  const priorityStyle = getPriorityStyles(todo.priority);
  const isOverdue = isPastDue(todo.dueDate, todo.isComplete);
  const isTodayDue = isDueToday(todo.dueDate);
  const daysOverdue = isOverdue ? getDaysOverdue(todo.dueDate) : 0;

  return (
    <div
      className={`rounded-lg border p-4 shadow-sm transition-colors ${
        isOverdue
          ? 'border-red-300 bg-red-50 border-l-4 border-l-red-600'
          : todo.isComplete
            ? 'border-sage-300 bg-sage-100'
            : 'border-moss-200 bg-forest-50'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <input
            type="checkbox"
            checked={todo.isComplete}
            onChange={handleToggle}
            className="mt-1 h-5 w-5 rounded border-sage-300 text-forest-600 focus:ring-forest-500"
          />

          <div className="flex-1">
            <h3
              className={`text-lg font-semibold ${
                todo.isComplete
                  ? 'text-sage-700 line-through'
                  : 'text-forest-900'
              }`}
            >
              {todo.title}
            </h3>

            {todo.description && (
              <p
                className={`mt-1 text-sm ${
                  todo.isComplete ? 'text-sage-600' : 'text-forest-700'
                }`}
              >
                {todo.description}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}
              >
                {priorityStyle.label}
              </span>

              {todo.tags.map(({ tag }) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white border border-sage-300 px-2.5 py-0.5 text-xs"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color || '#9CA3AF' }}
                  />
                  <span className="text-forest-700">{tag.name}</span>
                </span>
              ))}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <p
                className={`text-xs ${
                  isOverdue
                    ? 'text-red-700 font-semibold'
                    : isTodayDue
                      ? 'text-orange-700 font-semibold'
                      : todo.isComplete
                        ? 'text-sage-500'
                        : 'text-forest-600'
                }`}
              >
                Due: {formatDate(todo.dueDate)}
              </p>
              {isOverdue && (
                <span className="inline-flex items-center rounded-full bg-red-200 border border-red-400 px-2 py-0.5 text-xs font-medium text-red-800">
                  {daysOverdue > 30
                    ? '30+ days overdue'
                    : `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="rounded-md bg-moss-500 px-4 py-2 text-sm text-white hover:bg-moss-600"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
          <RescheduleButtons
            todoId={todo.id}
            currentDueDate={todo.dueDate}
            onReschedule={onReschedule}
            isComplete={todo.isComplete}
          />
        </div>
      </div>
    </div>
  );
};
