export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString("es-ES");
}

export function formatNumberFull(n: number): string {
  return n.toLocaleString("es-ES");
}

export function formatDuration(secs: number): string {
  if (!secs) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// YouTube chart color palette
export const YT_COLORS = {
  red: "rgba(255, 45, 85, 0.7)",
  redBg: "rgba(255, 45, 85, 0.1)",
  blue: "rgba(10, 132, 255, 0.7)",
  blueBg: "rgba(10, 132, 255, 0.1)",
  green: "rgba(48, 209, 88, 0.7)",
  greenBg: "rgba(48, 209, 88, 0.1)",
  yellow: "rgba(255, 214, 10, 0.7)",
  yellowBg: "rgba(255, 214, 10, 0.1)",
  purple: "rgba(191, 90, 242, 0.7)",
  purpleBg: "rgba(191, 90, 242, 0.1)",
  orange: "rgba(255, 159, 10, 0.7)",
  orangeBg: "rgba(255, 159, 10, 0.1)",
  cyan: "rgba(100, 210, 255, 0.6)",
  cyanBg: "rgba(100, 210, 255, 0.1)",
};
