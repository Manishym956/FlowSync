import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: PaginationProps) {
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#2a2d3e] text-[12px] text-[#c7c4d7]">
      <div>
        Showing <span className="font-mono text-[#e2e2eb] font-semibold">{startItem}</span> to{" "}
        <span className="font-mono text-[#e2e2eb] font-semibold">{endItem}</span> of{" "}
        <span className="font-mono text-[#e2e2eb] font-semibold">{total}</span> results
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e1f26] border border-[#2a2d3e] text-[#c7c4d7] hover:text-[#e2e2eb] hover:bg-[#33343b] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
          <span>Previous</span>
        </button>

        <span className="px-2 font-mono text-[11px] text-[#6b7280]">
          Page {page} of {Math.max(totalPages, 1)}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e1f26] border border-[#2a2d3e] text-[#c7c4d7] hover:text-[#e2e2eb] hover:bg-[#33343b] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
