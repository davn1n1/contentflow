"use client";

import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  Draft: { color: "text-muted-foreground", bg: "bg-muted" },
  "In Progress": { color: "text-info", bg: "bg-info/10" },
  Generating: { color: "text-warning", bg: "bg-warning/10" },
  Published: { color: "text-success", bg: "bg-success/10" },
  Error: { color: "text-destructive", bg: "bg-destructive/10" },
  Completed: { color: "text-success", bg: "bg-success/10" },
};

interface StatusBadgeProps {
  status: string | null;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = status || "Draft";
  const config = STATUS_CONFIG[label] || STATUS_CONFIG["Draft"];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.bg,
        config.color,
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          label === "Generating" ? "animate-pulse bg-warning" :
          label === "In Progress" ? "animate-pulse bg-info" :
          config.color.replace("text-", "bg-")
        )}
      />
      {label}
    </span>
  );
}
