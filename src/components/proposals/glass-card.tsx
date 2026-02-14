import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
}

export function GlassCard({ children, className, highlight }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl glass-card p-6",
        highlight && "border-[#2996d7]/30 ring-1 ring-[#2996d7]/10",
        className
      )}
    >
      {children}
    </div>
  );
}
