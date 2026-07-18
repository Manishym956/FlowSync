import { clsx } from "clsx";
import type { StatusVariant } from "@/lib/types";

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

const statusConfig: Record<
  StatusVariant,
  { dot: string; bg: string; text: string; label: string }
> = {
  healthy:  { dot: "bg-[#10b981]", bg: "bg-[rgba(16,185,129,0.10)]",  text: "text-[#10b981]", label: "Healthy"  },
  degraded: { dot: "bg-[#f59e0b]", bg: "bg-[rgba(245,158,11,0.10)]",  text: "text-[#f59e0b]", label: "Degraded" },
  failed:   { dot: "bg-[#f43f5e]", bg: "bg-[rgba(244,63,94,0.10)]",   text: "text-[#f43f5e]", label: "Failed"   },
  syncing:  { dot: "bg-[#3b82f6]", bg: "bg-[rgba(59,130,246,0.10)]",  text: "text-[#3b82f6]", label: "Syncing"  },
  pending:  { dot: "bg-[#6b7280]", bg: "bg-[rgba(107,114,128,0.10)]", text: "text-[#6b7280]", label: "Pending"  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label ?? config.label;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[12px] font-medium leading-4 tracking-wide",
        config.bg,
        config.text,
        className,
      )}
    >
      <span
        className={clsx(
          "inline-block w-1.5 h-1.5 rounded-full flex-shrink-0",
          config.dot,
          status === "syncing" && "animate-pulse",
        )}
        aria-hidden="true"
      />
      {displayLabel}
    </span>
  );
}

/** Maps integration status → StatusBadge variant */
export function integrationStatusToVariant(status: string): StatusVariant {
  switch (status) {
    case "active":   return "healthy";
    case "inactive": return "pending";
    case "error":    return "failed";
    default:         return "pending";
  }
}

/** Maps sync job status → StatusBadge variant */
export function syncJobStatusToVariant(status: string): StatusVariant {
  switch (status) {
    case "COMPLETED":  return "healthy";
    case "PROCESSING": return "syncing";
    case "PENDING":    return "pending";
    case "FAILED":     return "failed";
    default:           return "pending";
  }
}

/** Maps log status → StatusBadge variant */
export function logStatusToVariant(status: string): StatusVariant {
  switch (status) {
    case "SUCCESS":  return "healthy";
    case "RETRYING": return "degraded";
    case "FAILED":   return "failed";
    default:         return "pending";
  }
}
