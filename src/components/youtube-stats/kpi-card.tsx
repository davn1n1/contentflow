interface KpiCardProps {
  label: string;
  value: string;
  color?: string;
}

export function KpiCard({ label, value, color = "#ff2d55" }: KpiCardProps) {
  return (
    <div className="glass-card rounded-xl border border-border p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
