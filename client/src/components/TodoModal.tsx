import { useState, useEffect } from 'react';
import { useCreateTodo, useUpdateTodo, useTags, useCreateTag } from '../hooks/useApi';
import { Todo, Priority } from '../types/api';

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  todo?: Todo;
}

const toDatetimeLocal = (isoString: string): string => {
  return new Date(isoString).toISOString().slice(0, 16);
};

const toISOString = (datetimeLocal: string): string => {
  return new Date(datetimeLocal).toISOString();
};

export const TodoModal: React.FC<TodoModalProps> = ({ isOpen, onClose, todo }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [error, setError] = useState('');

  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const { data: tags = [] } = useTags();
  const createTag = useCreateTag();

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description);
      setDueDate(toDatetimeLocal(todo.dueDate));
      setIsComplete(todo.isComplete);
      setPriority(todo.priority);
      setSelectedTagIds(todo.tags.map(t => t.tag.id));
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setIsComplete(false);
      setPriority('MEDIUM');
      setSelectedTagIds([]);
    }
    setNewTagName('');
    setNewTagColor('#3B82F6');
    setError('');
  }, [todo, isOpen]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!dueDate) {
      setError('Due date is required');
      return;
    }

    try {
      const todoData = {
        title: title.trim(),
        description: description.trim(),
        dueDate: toISOString(dueDate),
        isComplete,
        priority,
        tagIds: selectedTagIds,
      };

      if (todo) {
        await updateTodo.mutateAsync({ id: todo.id, updates: todoData });
      } else {
        await createTodo.mutateAsync(todoData);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleCreateTag = async (): Promise<void> => {
    if (!newTagName.trim()) return;

    try {
      const newTag = await createTag.mutateAsync({
        name: newTagName.trim(),
        color: newTagColor,
      });
      setSelectedTagIds([...selectedTagIds, newTag.id]);
      setNewTagName('');
      setNewTagColor('#3B82F6');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag');
    }
  };

  const handleToggleTag = (tagId: number): void => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleClose = (): void => {
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg rounded-lg bg-forest-50 p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-forest-900">
          {todo ? 'Edit Todo' : 'Create Todo'}
        </h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-forest-800">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e): void => setTitle(e.target.value)}
              placeholder="Enter todo title..."
              maxLength={100}
              className="w-full rounded-md border border-sage-300 bg-white px-4 py-2 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-forest-800">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e): void => setDescription(e.target.value)}
              placeholder="Enter description..."
              maxLength={500}
              rows={4}
              className="w-full rounded-md border border-sage-300 bg-white px-4 py-2 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="mb-1 block text-sm font-medium text-forest-800">
              Due Date *
            </label>
            <input
              id="dueDate"
              type="datetime-local"
              value={dueDate}
              onChange={(e): void => setDueDate(e.target.value)}
              className="w-full rounded-md border border-sage-300 bg-white px-4 py-2 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
            />
          </div>

          <div className="flex items-center">
            <input
              id="isComplete"
              type="checkbox"
              checked={isComplete}
              onChange={(e): void => setIsComplete(e.target.checked)}
              className="h-4 w-4 rounded border-sage-300 text-forest-600 focus:ring-forest-500"
            />
            <label htmlFor="isComplete" className="ml-2 text-sm font-medium text-forest-800">
              Mark as complete
            </label>
          </div>

          <div>
            <label htmlFor="priority" className="mb-1 block text-sm font-medium text-forest-800">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e): void => setPriority(e.target.value as Priority)}
              className="w-full rounded-md border border-sage-300 bg-white px-4 py-2 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-forest-800">
              Tags
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 rounded-md border border-sage-300 bg-white px-3 py-1.5 cursor-pointer hover:bg-sage-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={(): void => handleToggleTag(tag.id)}
                      className="h-4 w-4 rounded border-sage-300 text-forest-600 focus:ring-forest-500"
                    />
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: tag.color || '#9CA3AF' }}
                    />
                    <span className="text-sm text-forest-800">{tag.name}</span>
                  </label>
                ))}
              </div>

              <div className="border-t border-sage-200 pt-3">
                <p className="mb-2 text-xs font-medium text-forest-700">Create New Tag</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e): void => setNewTagName(e.target.value)}
                    placeholder="Tag name..."
                    maxLength={50}
                    className="flex-1 rounded-md border border-sage-300 bg-white px-3 py-1.5 text-sm focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
                  />
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e): void => setNewTagColor(e.target.value)}
                    className="h-9 w-12 rounded-md border border-sage-300 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim() || createTag.isPending}
                    className="rounded-md bg-moss-500 px-4 py-1.5 text-sm text-white hover:bg-moss-600 disabled:cursor-not-allowed disabled:bg-sage-400"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-sage-300 bg-white px-6 py-2 text-forest-700 hover:bg-sage-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTodo.isPending || updateTodo.isPending}
              className="rounded-md bg-forest-600 px-6 py-2 text-white hover:bg-forest-700 disabled:cursor-not-allowed disabled:bg-sage-400"
            >
              {createTodo.isPending || updateTodo.isPending
                ? 'Saving...'
                : todo
                  ? 'Update'
                  : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
