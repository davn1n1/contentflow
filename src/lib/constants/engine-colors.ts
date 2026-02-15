/**
 * SlideEngine colors — consistent across the entire app.
 * Colors match the user's Airtable tag preferences:
 * - NanoBanana / NanoBanana Pro → Amarillo
 * - OpenAI → Azul
 * - SeeDream4 → Morado
 * - z-image → Gris
 */
export const ENGINE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  OpenAI: { text: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
  NanoBanana: { text: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" },
  "NanoBanana Pro": { text: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  SeeDream4: { text: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30" },
  "z-image": { text: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/30" },
  Flux: { text: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/30" },
  Midjourney: { text: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/30" },
  "DALL-E": { text: "text-teal-400", bg: "bg-teal-400/10", border: "border-teal-400/30" },
  Remotion: { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" },
};

export function getEngineColor(engine: string) {
  return ENGINE_COLORS[engine] || { text: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/30" };
}
