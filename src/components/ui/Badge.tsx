import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
  dot = false,
}: BadgeProps) {
  const variants = {
    default: "bg-white/[0.06] text-white/70 border border-white/[0.08]",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20",
    info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    purple: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn("size-1.5 rounded-full", {
            "bg-white/50": variant === "default",
            "bg-emerald-400": variant === "success",
            "bg-amber-400": variant === "warning",
            "bg-red-400": variant === "danger",
            "bg-blue-400": variant === "info",
            "bg-violet-400": variant === "purple",
          })}
        />
      )}
      {children}
    </span>
  );
}
