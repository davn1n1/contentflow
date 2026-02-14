export function TabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse px-6 py-6">
      <div className="h-6 w-48 bg-muted rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="h-40 bg-muted rounded-xl" />
      <div className="h-64 bg-muted rounded-xl" />
    </div>
  );
}
