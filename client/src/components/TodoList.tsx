import { useState, useMemo } from 'react';
import { useTodos, useDeleteTodo, useUpdateTodo } from '../hooks/useApi';
import { TodoItem } from './TodoItem';
import { TodoModal } from './TodoModal';
import { DueTodayHeader } from './DueTodayHeader';
import { TodoSortControls } from './TodoSortControls';
import { TodoPagination } from './TodoPagination';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { sortTodos } from '../lib/todoSorting';
import type { Todo } from '../types/api';
import type { TodoViewPreferences, SortOption, SortDirection, ItemsPerPage } from '../types/todoView';

export const TodoList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>(undefined);

  const [viewPrefs, setViewPrefs] = useLocalStorage<TodoViewPreferences>('todoViewPreferences', {
    sortBy: 'priority',
    sortDirection: 'desc',
    itemsPerPage: 25,
    currentPage: 1,
  });

  const { data: todos, isLoading, error } = useTodos();
  const deleteTodo = useDeleteTodo();
  const updateTodo = useUpdateTodo();

  const filteredTodos = useMemo(() => {
    return (todos ?? []).filter((todo) => todo.deletedAt === null);
  }, [todos]);

  const sortedTodos = useMemo(() => {
    return sortTodos(filteredTodos, viewPrefs.sortBy, viewPrefs.sortDirection);
  }, [filteredTodos, viewPrefs.sortBy, viewPrefs.sortDirection]);

  const paginatedTodos = useMemo(() => {
    const startIndex =
      viewPrefs.itemsPerPage === 'all'
        ? 0
        : (viewPrefs.currentPage - 1) * viewPrefs.itemsPerPage;

    const endIndex =
      viewPrefs.itemsPerPage === 'all'
        ? sortedTodos.length
        : startIndex + viewPrefs.itemsPerPage;

    return sortedTodos.slice(startIndex, endIndex);
  }, [sortedTodos, viewPrefs.itemsPerPage, viewPrefs.currentPage]);

  const handleAdd = (): void => {
    setEditingTodo(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (todo: Todo): void => {
    setEditingTodo(todo);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number): void => {
    deleteTodo.mutate(id);
  };

  const handleToggleComplete = (id: number, isComplete: boolean): void => {
    updateTodo.mutate({ id, updates: { isComplete } });
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setEditingTodo(undefined);
  };

  const handleSortChange = (sortBy: SortOption): void => {
    setViewPrefs({ ...viewPrefs, sortBy, currentPage: 1 });
  };

  const handleDirectionChange = (sortDirection: SortDirection): void => {
    setViewPrefs({ ...viewPrefs, sortDirection });
  };

  const handlePageChange = (page: number): void => {
    setViewPrefs({ ...viewPrefs, currentPage: page });
  };

  const handleItemsPerPageChange = (itemsPerPage: ItemsPerPage): void => {
    setViewPrefs({ ...viewPrefs, itemsPerPage, currentPage: 1 });
  };

  const handleReschedule = (id: number, newDueDate: string): void => {
    updateTodo.mutate({ id, updates: { dueDate: newDueDate } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-moss-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DueTodayHeader todos={filteredTodos} />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-forest-800">Your Todos</h2>
        <button
          onClick={handleAdd}
          className="rounded-md bg-forest-600 px-6 py-2 text-white hover:bg-forest-700"
        >
          Add Todo
        </button>
      </div>

      <TodoSortControls
        sortBy={viewPrefs.sortBy}
        sortDirection={viewPrefs.sortDirection}
        onSortChange={handleSortChange}
        onDirectionChange={handleDirectionChange}
      />

      {filteredTodos.length === 0 ? (
        <div className="rounded-lg bg-forest-50 p-8 text-center">
          <p className="text-forest-700">
            No todos yet. Click "Add Todo" to get started!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
                onReschedule={handleReschedule}
              />
            ))}
          </div>

          <TodoPagination
            currentPage={viewPrefs.currentPage}
            totalItems={sortedTodos.length}
            itemsPerPage={viewPrefs.itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </>
      )}

      <TodoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        todo={editingTodo}
      />
    </div>
  );
};
