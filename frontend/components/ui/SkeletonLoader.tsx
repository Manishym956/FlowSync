import { clsx } from "clsx";

// ─── Skeleton primitives ─────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={clsx("skeleton rounded", className)} />;
}

// ─── Table skeleton ──────────────────────────────────────────────────────────

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full">
      {/* Header row */}
      <div className="flex gap-4 px-4 py-2 border-b border-[#2a2d3e]">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 px-4 h-10 items-center border-b border-[#2a2d3e]"
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className={clsx("h-3 flex-1", colIdx === cols - 1 && "max-w-[80px]")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Metric card skeleton ─────────────────────────────────────────────────────

export function MetricGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[#1e1f26] border border-[#2a2d3e] rounded-md p-3 flex flex-col gap-2"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

// ─── Generic card skeleton ────────────────────────────────────────────────────

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "bg-[#1e1f26] border border-[#2a2d3e] rounded-md p-4 flex flex-col gap-3",
        className,
      )}
    >
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}
