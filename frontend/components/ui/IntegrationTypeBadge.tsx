import { clsx } from "clsx";

interface IntegrationTypeBadgeProps {
  type: string;
  className?: string;
}

const typeConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  rest: {
    label: "REST API",
    bg: "bg-[#6366f1]/10",
    text: "text-[#c0c1ff]",
    border: "border-[#6366f1]/20",
  },
  fhir: {
    label: "FHIR R4",
    bg: "bg-[#10b981]/10",
    text: "text-[#10b981]",
    border: "border-[#10b981]/20",
  },
  messaging: {
    label: "Messaging",
    bg: "bg-purple-500/10",
    text: "text-purple-300",
    border: "border-purple-500/20",
  },
  mock: {
    label: "Webhook",
    bg: "bg-amber-400/10",
    text: "text-amber-300",
    border: "border-amber-400/20",
  },
};

export function IntegrationTypeBadge({ type, className }: IntegrationTypeBadgeProps) {
  const normalizedType = type?.toLowerCase() || "rest";
  const config = typeConfig[normalizedType] || {
    label: type.toUpperCase(),
    bg: "bg-[#33343b]",
    text: "text-[#c7c4d7]",
    border: "border-[#2a2d3e]",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border",
        config.bg,
        config.text,
        config.border,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
