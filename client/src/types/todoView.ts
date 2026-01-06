export type SortOption = 'priority' | 'dueDate' | 'isComplete' | 'title' | 'createdAt';
export type SortDirection = 'asc' | 'desc';
export type ItemsPerPage = 25 | 50 | 100 | 'all';

export interface TodoViewPreferences {
  sortBy: SortOption;
  sortDirection: SortDirection;
  itemsPerPage: ItemsPerPage;
  currentPage: number;
}
