import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  tall?: boolean;
}

export function ChartCard({
  title,
  subtitle,
  children,
  className,
  tall,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl border border-border p-5",
        className
      )}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className={cn("relative", tall ? "h-[350px]" : "h-[250px]")}>
        {children}
      </div>
    </div>
  );
}
