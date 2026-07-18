import { clsx } from "clsx";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    direction: "up" | "down" | "flat";
    value: string;
    positive?: boolean; // up = good (default true for most metrics)
  };
  subtext?: string;
  className?: string;
}

export function MetricCard({ label, value, trend, subtext, className }: MetricCardProps) {
  const isPositive =
    trend?.direction === "flat"
      ? null
      : trend?.positive !== false
      ? trend?.direction === "up"
      : trend?.direction === "down";

  const trendColor =
    isPositive === null
      ? "text-[#6b7280]"
      : isPositive
      ? "text-[#10b981]"
      : "text-[#f43f5e]";

  const TrendIcon =
    trend?.direction === "up"
      ? TrendingUp
      : trend?.direction === "down"
      ? TrendingDown
      : Minus;

  return (
    <div
      className={clsx(
        "bg-[#1e1f26] border border-[#2a2d3e] rounded-md p-3 flex flex-col gap-2 animate-fade-in",
        className,
      )}
    >
      <p className="text-[11px] font-medium tracking-widest uppercase text-[#c7c4d7] leading-none">
        {label}
      </p>
      <div className="flex items-end justify-between gap-2">
        <p className="text-[28px] font-semibold leading-none text-[#e2e2eb] tracking-tight">
          {value}
        </p>
        {trend && (
          <div className={clsx("flex items-center gap-1 text-[12px] font-medium", trendColor)}>
            <TrendIcon size={13} strokeWidth={2.5} />
            <span>{trend.value}</span>
          </div>
        )}
      </div>
      {subtext && (
        <p className="text-[12px] text-[#6b7280] leading-none">{subtext}</p>
      )}
    </div>
  );
}

/** Skeleton version for loading state */
export function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "bg-[#1e1f26] border border-[#2a2d3e] rounded-md p-3 flex flex-col gap-2",
        className,
      )}
    >
      <div className="skeleton h-3 w-24 rounded" />
      <div className="skeleton h-8 w-16 rounded" />
      <div className="skeleton h-3 w-20 rounded" />
    </div>
  );
}
