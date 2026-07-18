import { clsx } from "clsx";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[#6366f1] text-white hover:bg-[#5558e3] active:bg-[#4749d9] border border-transparent",
  secondary:
    "bg-transparent text-[#e2e2eb] hover:bg-[#282a30] active:bg-[#33343b] border border-[#2a2d3e]",
  ghost:
    "bg-transparent text-[#c7c4d7] hover:bg-[#1e1f26] active:bg-[#282a30] border border-transparent",
  danger:
    "bg-transparent text-[#f43f5e] hover:bg-[rgba(244,63,94,0.08)] active:bg-[rgba(244,63,94,0.15)] border border-[#f43f5e]",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[12px] gap-1.5",
  md: "h-8 px-3 text-[13px] gap-2",
  lg: "h-9 px-4 text-[14px] gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      loading = false,
      icon,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "inline-flex items-center justify-center font-medium rounded-md",
          "transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-[#6366f1] focus-visible:outline-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <span
            className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
        ) : (
          icon
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
