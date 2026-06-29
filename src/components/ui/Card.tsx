import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "glass" | "bordered" | "elevated";
  hover?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className,
  variant = "default",
  hover = false,
  onClick,
}: CardProps) {
  const variants = {
    default: "bg-white/[0.03] border border-white/[0.07]",
    glass: "glass",
    bordered: "border border-white/[0.1] bg-transparent",
    elevated: "bg-[#111111] border border-white/[0.07] shadow-2xl shadow-black/50",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl",
        variants[variant],
        hover &&
          "transition-all duration-300 hover:border-violet-500/20 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-violet-500/5",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-6 pb-0", className)}>{children}</div>;
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("px-6 pb-6 pt-0", className)}>{children}</div>;
}
