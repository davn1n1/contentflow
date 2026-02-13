/**
 * Extracts main text content from a blog/article URL.
 * Uses a simple fetch + regex approach (no external dependencies).
 */

export async function fetchBlogContent(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
      Accept: "text/html",
    },
  });

  if (!res.ok) {
    throw new Error(`No se pudo acceder a la URL (${res.status}). Verifica el enlace.`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    throw new Error("La URL no contiene contenido HTML. Intenta con un articulo o blog.");
  }

  const html = await res.text();

  // Remove scripts, styles, nav, footer, header, aside
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "");

  // Try to extract article/main content first
  const articleMatch =
    cleaned.match(/<article[\s\S]*?<\/article>/i) ||
    cleaned.match(/<main[\s\S]*?<\/main>/i) ||
    cleaned.match(/<div[^>]*class="[^"]*(?:content|post|article|entry)[^"]*"[\s\S]*?<\/div>/i);

  if (articleMatch) {
    cleaned = articleMatch[0];
  }

  // Strip all remaining HTML tags
  const text = cleaned
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length < 100) {
    throw new Error(
      "No se pudo extraer suficiente texto de esta URL. Intenta con otro articulo."
    );
  }

  // Limit to ~5000 words to avoid huge AI prompts
  const words = text.split(/\s+/);
  if (words.length > 5000) {
    return words.slice(0, 5000).join(" ");
  }

  return text;
}
