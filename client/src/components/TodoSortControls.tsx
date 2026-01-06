import type { SortOption, SortDirection } from '../types/todoView';

interface TodoSortControlsProps {
  sortBy: SortOption;
  sortDirection: SortDirection;
  onSortChange: (sortBy: SortOption) => void;
  onDirectionChange: (direction: SortDirection) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'isComplete', label: 'Status' },
  { value: 'title', label: 'Title' },
  { value: 'createdAt', label: 'Created Date' },
];

export const TodoSortControls: React.FC<TodoSortControlsProps> = ({
  sortBy,
  sortDirection,
  onSortChange,
  onDirectionChange,
}) => {
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onSortChange(e.target.value as SortOption);
  };

  const toggleDirection = (): void => {
    onDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-by" className="text-sm font-medium text-forest-700">
        Sort by:
      </label>
      <select
        id="sort-by"
        value={sortBy}
        onChange={handleSortChange}
        className="rounded-md border border-sage-300 bg-white px-3 py-2 text-sm text-forest-800 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        onClick={toggleDirection}
        className="rounded-md border border-sage-300 bg-white px-3 py-2 text-sm font-medium text-forest-700 hover:bg-sage-50 focus:outline-none focus:ring-2 focus:ring-forest-500"
        aria-label={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
      >
        {sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
      </button>
    </div>
  );
};
