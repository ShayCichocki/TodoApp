import type { Todo, Priority } from '../types/api';
import type { SortOption, SortDirection } from '../types/todoView';

const priorityOrder: Record<Priority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const comparePriority = (a: Todo, b: Todo, direction: SortDirection): number => {
  const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
  return direction === 'asc' ? diff : -diff;
};

const compareDueDate = (a: Todo, b: Todo, direction: SortDirection): number => {
  const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  return direction === 'asc' ? diff : -diff;
};

const compareIsComplete = (a: Todo, b: Todo, direction: SortDirection): number => {
  const diff = Number(a.isComplete) - Number(b.isComplete);
  return direction === 'asc' ? diff : -diff;
};

const compareTitle = (a: Todo, b: Todo, direction: SortDirection): number => {
  const diff = a.title.localeCompare(b.title);
  return direction === 'asc' ? diff : -diff;
};

const compareCreatedAt = (a: Todo, b: Todo, direction: SortDirection): number => {
  const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  return direction === 'asc' ? diff : -diff;
};

export const sortTodos = (
  todos: Todo[],
  sortBy: SortOption,
  direction: SortDirection
): Todo[] => {
  return [...todos].sort((a, b) => {
    let primaryComparison = 0;

    switch (sortBy) {
      case 'priority':
        primaryComparison = comparePriority(a, b, direction);
        break;
      case 'dueDate':
        primaryComparison = compareDueDate(a, b, direction);
        break;
      case 'isComplete':
        primaryComparison = compareIsComplete(a, b, direction);
        break;
      case 'title':
        primaryComparison = compareTitle(a, b, direction);
        break;
      case 'createdAt':
        primaryComparison = compareCreatedAt(a, b, direction);
        break;
    }

    if (primaryComparison !== 0) {
      return primaryComparison;
    }

    if (sortBy !== 'priority') {
      const secondaryPriority = comparePriority(a, b, 'desc');
      if (secondaryPriority !== 0) {
        return secondaryPriority;
      }
    }

    if (sortBy !== 'dueDate') {
      return compareDueDate(a, b, 'asc');
    }

    return 0;
  });
};
