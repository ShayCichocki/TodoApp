import type { ItemsPerPage } from '../types/todoView';

interface TodoPaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: ItemsPerPage;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: ItemsPerPage) => void;
}

export const TodoPagination: React.FC<TodoPaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const totalPages =
    itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);

  const startIndex =
    itemsPerPage === 'all' ? 1 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex =
    itemsPerPage === 'all'
      ? totalItems
      : Math.min(currentPage * itemsPerPage, totalItems);

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const value = e.target.value;
    onItemsPerPageChange(
      value === 'all' ? 'all' : (parseInt(value, 10) as 25 | 50 | 100)
    );
  };

  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];

    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(currentPage + 1, totalPages - 1);
      i++
    ) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-sage-300 pt-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-forest-700">
          Showing {startIndex}-{endIndex} of {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="items-per-page" className="text-sm text-forest-700">
            Per page:
          </label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="rounded-md border border-sage-300 bg-white px-2 py-1 text-sm text-forest-800 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value="all">All</option>
          </select>
        </div>

        {itemsPerPage !== 'all' && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-md border border-sage-300 bg-white px-3 py-1 text-sm font-medium text-forest-700 hover:bg-sage-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
              aria-label="Previous page"
            >
              Previous
            </button>

            {getPageNumbers().map((page, index) =>
              typeof page === 'number' ? (
                <button
                  key={`page-${page}`}
                  onClick={() => onPageChange(page)}
                  className={`rounded-md px-3 py-1 text-sm font-medium ${
                    currentPage === page
                      ? 'bg-forest-600 text-white'
                      : 'border border-sage-300 bg-white text-forest-700 hover:bg-sage-50'
                  }`}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              ) : (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-sm text-forest-700"
                >
                  {page}
                </span>
              )
            )}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-md border border-sage-300 bg-white px-3 py-1 text-sm font-medium text-forest-700 hover:bg-sage-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
