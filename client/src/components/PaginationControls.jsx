import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = ''
}) {
  if (!totalPages || totalPages <= 1) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 py-4 text-sm text-[#5C453C] ${className}`}>
      <div>
        Showing <span className="font-semibold text-[#33201D]">{startItem}</span> to{' '}
        <span className="font-semibold text-[#33201D]">{endItem}</span> of{' '}
        <span className="font-semibold text-[#33201D]">{totalItems}</span> results
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 rounded-xl border border-[#E7CC91] bg-white px-3 py-1.5 font-medium text-[#33201D] transition-colors hover:bg-[#FDF9F3] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span>Prev</span>
        </button>
        <span className="px-2 font-medium text-[#33201D]">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 rounded-xl border border-[#E7CC91] bg-white px-3 py-1.5 font-medium text-[#33201D] transition-colors hover:bg-[#FDF9F3] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

