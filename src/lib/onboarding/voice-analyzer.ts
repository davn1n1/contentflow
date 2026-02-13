import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const voiceAnalysisSchema = z.object({
  voicename: z.string().describe("Nombre descriptivo del estilo de voz, ej: 'Profesional Cercano'"),
  tone: z.string().describe("Tono general: Profesional, Casual, Inspiracional, Educativo, Motivacional, Amigable, Autoritario"),
  style: z.string().describe("Estilo de escritura: Narrativo, Conversacional, Tecnico, Divulgativo, Persuasivo, Storytelling"),
  vocabularylevel: z.string().describe("Nivel de vocabulario: Basico, Intermedio, Avanzado, Tecnico"),
  narrativeperspective: z.string().describe("Perspectiva narrativa: Primera persona (yo), Segunda persona (tu), Tercera persona"),
  generaltype: z.string().describe("Tipo de comunicador: Experto, Mentor, Amigo, Reportero, Influencer, Profesor"),
  custom_ai_instructions: z.string().describe("Instrucciones de 2-4 frases para que una IA replique este estilo exacto"),
});

export type VoiceAnalysisResult = z.infer<typeof voiceAnalysisSchema>;

const SYSTEM_PROMPT = `Eres un analista experto en comunicacion, branding y estilo de voz.
Tu tarea es analizar un texto (transcripcion de video o articulo de blog) y extraer el perfil de voz del autor.

Reglas:
- Analiza el tono, vocabulario, estructura de frases, uso de primera/segunda/tercera persona.
- Detecta patrones: usa humor? Es tecnico? Usa ejemplos? Tutea?
- Las instrucciones IA deben ser concretas y accionables, no genericas.
- Responde siempre en espanol.
- Si el texto esta en otro idioma, analiza el estilo igualmente pero responde en espanol.`;

export async function analyzeVoiceFromText(
  text: string
): Promise<VoiceAnalysisResult> {
  // Truncate to ~3000 words for efficiency
  const words = text.split(/\s+/);
  const truncated = words.length > 3000 ? words.slice(0, 3000).join(" ") : text;

  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-5-20250929"),
    schema: voiceAnalysisSchema,
    system: SYSTEM_PROMPT,
    prompt: `Analiza el siguiente texto y extrae el perfil de voz del autor:\n\n${truncated}`,
  });

  return object;
}
