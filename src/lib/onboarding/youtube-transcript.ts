/**
 * Extracts transcript from a YouTube video URL.
 * Uses YouTube's built-in timedtext API (no API key needed for public videos).
 */

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export async function fetchYouTubeTranscript(url: string): Promise<string> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error("URL de YouTube no valida. Verifica el enlace e intenta de nuevo.");
  }

  // Fetch the video page to get the captions track URL
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
    },
  });

  if (!pageRes.ok) {
    throw new Error("No se pudo acceder al video de YouTube.");
  }

  const html = await pageRes.text();

  // Extract captions from the page's player response
  const captionsMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
  if (!captionsMatch) {
    throw new Error(
      "Este video no tiene transcripcion disponible. Intenta con otro video o completa los campos manualmente."
    );
  }

  let captionTracks: Array<{ baseUrl: string; languageCode: string }>;
  try {
    captionTracks = JSON.parse(captionsMatch[1]);
  } catch {
    throw new Error("Error al procesar las transcripciones del video.");
  }

  if (captionTracks.length === 0) {
    throw new Error("Este video no tiene transcripcion disponible.");
  }

  // Prefer Spanish, then English, then first available
  const track =
    captionTracks.find((t) => t.languageCode === "es") ||
    captionTracks.find((t) => t.languageCode === "en") ||
    captionTracks[0];

  // Fetch the transcript XML
  const transcriptRes = await fetch(track.baseUrl);
  if (!transcriptRes.ok) {
    throw new Error("Error al descargar la transcripcion.");
  }

  const xml = await transcriptRes.text();

  // Parse XML to extract text segments
  const segments: string[] = [];
  const textRegex = /<text[^>]*>([^<]*)<\/text>/g;
  let match;
  while ((match = textRegex.exec(xml)) !== null) {
    const text = match[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (text) segments.push(text);
  }

  if (segments.length === 0) {
    throw new Error("La transcripcion del video esta vacia.");
  }

  return segments.join(" ");
}

export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}
