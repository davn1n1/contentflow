import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const SERVICE_SLUGS = [
  "reels",
  "shorts",
  "longform",
  "stories",
  "carruseles",
  "avatar-custom",
  "voice-clone",
  "strategy-call",
] as const;

export const CallAnalysisSchema = z.object({
  summary: z
    .string()
    .describe("Resumen ejecutivo de la llamada (2-3 frases)"),
  pain_points: z
    .array(z.string())
    .describe("Puntos de dolor mencionados por el prospecto"),
  desires: z
    .array(z.string())
    .describe("Deseos y objetivos que expresó el prospecto"),
  objections: z
    .array(z.string())
    .describe("Objeciones o preocupaciones mencionadas"),
  kpi_goals: z
    .array(z.string())
    .describe("KPIs o metas específicas que busca alcanzar"),
  interest_score: z
    .number()
    .min(1)
    .max(10)
    .describe("Nivel de interés (1-10)"),
  sentiment_score: z
    .enum(["positive", "neutral", "negative"])
    .describe("Sentimiento general de la conversación"),
  urgency_score: z
    .number()
    .min(1)
    .max(10)
    .describe("Urgencia de compra (1-10)"),
  next_step: z
    .string()
    .describe("Siguiente paso acordado o recomendado"),
  mentioned_services: z
    .array(
      z.object({
        service: z.enum(SERVICE_SLUGS),
        quantity: z.number().min(1),
        notes: z.string().optional(),
      })
    )
    .describe(
      "Servicios mencionados en la llamada con cantidades mensuales estimadas"
    ),
});

export type CallAnalysis = z.infer<typeof CallAnalysisSchema>;

const SYSTEM_PROMPT = `Eres un analista de ventas experto en ContentFlow365, una empresa que ofrece producción automatizada de videos para redes sociales y YouTube.

Analiza esta transcripción de llamada de ventas y extrae insights estructurados. Enfócate en:
- Puntos de dolor del prospecto relacionados con creación de contenido
- Objetivos de negocio y KPIs que buscan mejorar
- Servicios específicos que mencionaron o mostraron interés
- Nivel de urgencia e interés de compra

Servicios disponibles de ContentFlow365:
- reels: Videos cortos verticales para Instagram/TikTok (15-60s)
- shorts: Videos cortos para YouTube Shorts
- longform: Videos largos para YouTube (5-15 min)
- stories: Historias para Instagram/Facebook
- carruseles: Posts de múltiples imágenes para Instagram
- avatar-custom: Creación de avatar IA personalizado desde la cara del cliente
- voice-clone: Clonación de voz IA con las grabaciones del cliente
- strategy-call: Sesión 1:1 de estrategia de contenido (60 min)

Si el prospecto menciona cantidades ("4 videos por semana", "2 videos largos al mes"), estima la cantidad MENSUAL para ese servicio. Si no menciona cantidades, estima basándote en el contexto.

Responde siempre en español.`;

/**
 * Analyze a call transcript using Claude via OpenRouter.
 * Returns structured insights including recommended services.
 */
export async function analyzeCallTranscript(
  transcript: string,
  prospectName: string,
  companyName?: string
): Promise<CallAnalysis> {
  const { object } = await generateObject({
    model: openrouter.chat(process.env.CHAT_MODEL || "anthropic/claude-sonnet-4-5"),
    schema: CallAnalysisSchema,
    system: SYSTEM_PROMPT,
    prompt: `Prospecto: ${prospectName}${companyName ? ` (${companyName})` : ""}\n\nTranscripción:\n${transcript}`,
  });

  return object;
}
