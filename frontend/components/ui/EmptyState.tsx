import { clsx } from "clsx";
import { RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center py-16 px-8 text-center",
        className,
      )}
    >
      {icon && (
        <div className="w-10 h-10 rounded-md bg-[#282a30] flex items-center justify-center mb-4 text-[#6b7280]">
          {icon}
        </div>
      )}
      <h3 className="text-[14px] font-semibold text-[#e2e2eb] mb-1">{title}</h3>
      {description && (
        <p className="text-[13px] text-[#6b7280] max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = "Unable to load data.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center py-12 px-8 text-center",
        className,
      )}
    >
      <div className="w-10 h-10 rounded-md bg-[rgba(244,63,94,0.10)] flex items-center justify-center mb-4">
        <span className="text-[#f43f5e] text-lg font-bold" aria-hidden="true">!</span>
      </div>
      <p className="text-[13px] text-[#c7c4d7] mb-4 max-w-xs">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          icon={<RefreshCw size={13} />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
