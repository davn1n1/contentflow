import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

function getOpenRouter() {
  return createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY!,
  });
}

const SERVICE_SLUGS = [
  "video-short",
  "render-short",
  "video-long",
  "render-long",
  "hook-veo3",
  "persona-shorts",
  "persona-youtube",
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
  recommended_plan: z
    .enum(["pro", "growth", "scale"])
    .describe("Plan recomendado según el volumen y necesidades del prospecto"),
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

const SYSTEM_PROMPT = `Eres un analista de ventas experto en ContentFlow365, una empresa que ofrece producción automatizada de videos para redes sociales y YouTube usando inteligencia artificial.

Analiza esta transcripción de llamada de ventas y extrae insights estructurados. Enfócate en:
- Puntos de dolor del prospecto relacionados con creación de contenido
- Objetivos de negocio y KPIs que buscan mejorar
- Servicios específicos que mencionaron o mostraron interés
- Nivel de urgencia e interés de compra

Servicios disponibles (sistema de créditos):
- video-short (156 créditos): Video corto para Reels, TikTok o Ads (15-60s) — Instagram, Facebook, TikTok, YT Shorts, LinkedIn, Twitter, Threads
- render-short (95 créditos): Renderizado y postproducción de video corto
- video-long (542 créditos): Video largo para YouTube (5-15 min)
- render-long (157 créditos): Renderizado y postproducción de video largo
- hook-veo3 (48 créditos): Hook de tendencia generado con IA
- persona-shorts (1.660 créditos): Avatar IA personalizado para videos cortos
- persona-youtube (2.925 créditos): Avatar IA personalizado para videos largos

Planes disponibles:
- pro: €990/mes, 10.000 créditos — Para creadores que empiezan con IA
- growth: €1.990/mes, 21.000 créditos — Para marcas que quieren escalar contenido
- scale: €2.990/mes, 35.000 créditos — Para empresas con alta producción

Si el prospecto menciona cantidades ("4 videos por semana", "2 videos largos al mes"), estima la cantidad MENSUAL. Si no menciona cantidades, estima basándote en el contexto.

Recomienda el plan que mejor se ajuste al volumen de contenido que necesita el prospecto. Recuerda que cada video necesita tanto el servicio de "video" como el de "render".

Responde siempre en español.`;

/**
 * Analyze a call transcript using Claude via OpenRouter.
 * Returns structured insights including recommended services and plan.
 */
export async function analyzeCallTranscript(
  transcript: string,
  prospectName: string,
  companyName?: string
): Promise<CallAnalysis> {
  const { object } = await generateObject({
    model: getOpenRouter().chat("anthropic/claude-sonnet-4.5"),
    schema: CallAnalysisSchema,
    system: SYSTEM_PROMPT,
    prompt: `Prospecto: ${prospectName}${companyName ? ` (${companyName})` : ""}\n\nTranscripción:\n${transcript}`,
  });

  return object;
}
