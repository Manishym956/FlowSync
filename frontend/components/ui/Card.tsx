import { clsx } from "clsx";

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPad?: boolean;
}

export function Card({ children, className, noPad }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-[#1e1f26] border border-[#2a2d3e] rounded-md",
        !noPad && "p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── Card Header ─────────────────────────────────────────────────────────────

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between px-4 py-3 border-b border-[#2a2d3e]",
        className,
      )}
    >
      <div>
        <h2 className="text-[14px] font-semibold text-[#e2e2eb] leading-5">{title}</h2>
        {description && (
          <p className="text-[12px] text-[#6b7280] mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
