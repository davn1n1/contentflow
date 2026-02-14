import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { readFile } from "fs/promises";
import { join } from "path";
import type { KBSource, KBSourceFile } from "./source-map";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export interface GeneratedArticle {
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
}

/**
 * Read source files from disk and collect their contents.
 * Paths are relative to the Next.js project root (ContentFlow365/app/).
 */
async function readSourceFiles(
  sources: KBSourceFile[]
): Promise<string[]> {
  const projectRoot = process.cwd();
  const contents: string[] = [];

  for (const source of sources) {
    if (source.type === "inline" && source.content) {
      contents.push(`[Contexto inline]\n${source.content}`);
      continue;
    }

    if (!source.path) continue;

    try {
      const fullPath = join(projectRoot, source.path);
      const raw = await readFile(fullPath, "utf-8");
      // Truncate large files to ~8000 chars to stay within prompt limits
      const truncated = raw.length > 8000 ? raw.slice(0, 8000) + "\n\n... [truncado]" : raw;
      const label = source.type === "route" ? "Pagina" :
                    source.type === "doc" ? "Documentacion" :
                    source.type === "component" ? "Componente" :
                    source.type === "api" ? "API" : "Archivo";
      contents.push(`[${label}: ${source.path}]\n${truncated}`);
    } catch {
      // File doesn't exist or can't be read — skip silently
    }
  }

  return contents;
}

/**
 * Generate a help article using Claude via OpenRouter.
 * Reads the source files, builds a prompt, and returns the structured article.
 */
export async function generateArticle(
  source: KBSource
): Promise<GeneratedArticle> {
  const sourceContents = await readSourceFiles(source.sources);

  const sourcesBlock = sourceContents.length > 0
    ? `\n\n## Archivos fuente para analizar\n\n${sourceContents.join("\n\n---\n\n")}`
    : "";

  const { text } = await generateText({
    model: openrouter.chat(process.env.CHAT_MODEL || "anthropic/claude-sonnet-4-5"),
    system: `Eres un escritor tecnico para ContentFlow365, una plataforma SaaS de produccion automatizada de video para YouTube.

Tu tarea es generar un articulo de ayuda para la Knowledge Base de la app.

## Reglas estrictas:
1. Escribe en ESPANOL
2. Tono: cercano pero profesional, orientado al usuario final (no tecnico)
3. NO uses jerga de programacion ni menciones codigo fuente
4. Estructura: Que es → Como usarlo (pasos numerados) → Tips/Notas → Errores comunes (si aplica)
5. Longitud: 400-1200 palabras de contenido
6. Formato: Markdown con headers (##, ###), listas y bold para elementos clave
7. NO incluyas links externos ni URLs
8. Responde SOLO con JSON valido, sin markdown wrapping

## Formato de respuesta (JSON):
{
  "title": "Titulo del articulo (claro y descriptivo)",
  "summary": "Resumen de 1-2 oraciones que describe lo que cubre el articulo",
  "content": "Contenido completo en Markdown (sin el titulo, que ya va aparte)"
}`,
    prompt: `Genera un articulo de ayuda con estos parametros:

- **Slug**: ${source.id}
- **Titulo sugerido**: ${source.title}
- **Categoria**: ${source.category}
- **Tags**: ${source.tags.join(", ")}
${sourcesBlock}

Analiza los archivos fuente para entender que hace esta funcionalidad y genera un articulo util para el usuario final. Si no hay archivos fuente, usa el titulo y tags como guia.`,
    maxOutputTokens: 2000,
  });

  try {
    // Try to extract JSON from the response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      slug: source.id,
      title: parsed.title || source.title,
      summary: parsed.summary || "",
      content: parsed.content || "",
      category: source.category,
      tags: source.tags,
    };
  } catch {
    // Fallback: use the raw text as content
    return {
      slug: source.id,
      title: source.title,
      summary: `Articulo sobre ${source.title.toLowerCase()}`,
      content: text.slice(0, 3000),
      category: source.category,
      tags: source.tags,
    };
  }
}

/**
 * Generate multiple articles in parallel with concurrency control.
 */
export async function generateArticles(
  sources: KBSource[],
  concurrency: number = 3
): Promise<{ article: GeneratedArticle; error?: string }[]> {
  const results: { article: GeneratedArticle; error?: string }[] = [];

  for (let i = 0; i < sources.length; i += concurrency) {
    const batch = sources.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((source) => generateArticle(source))
    );

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      if (result.status === "fulfilled") {
        results.push({ article: result.value });
      } else {
        results.push({
          article: {
            slug: batch[j].id,
            title: batch[j].title,
            summary: "",
            content: "",
            category: batch[j].category,
            tags: batch[j].tags,
          },
          error: result.reason instanceof Error ? result.reason.message : "Unknown error",
        });
      }
    }
  }

  return results;
}
