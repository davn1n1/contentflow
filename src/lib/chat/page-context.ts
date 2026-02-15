/**
 * Client-side page context helpers for the chat widget.
 * Maps routes to human-readable labels and contextual suggestions.
 */

interface PageSuggestion {
  text: string;
  icon: "message" | "help" | "tool";
  accent: "primary" | "success" | "warning";
}

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/research": "Research",
  "/ideas": "Ideas",
  "/scripts": "Scripts",
  "/videos": "Videos",
  "/scenes": "Escenas",
  "/renders": "Renders",
  "/remotion": "Remotion",
  "/settings": "Configuracion",
  "/team": "Equipo",
  "/campanas": "Campanas",
  "/help": "Centro de Ayuda",
  "/montaje-video": "Montaje Video",
  "/app-data/avatares": "Avatares",
  "/app-data/avatares-set": "Sets de Avatares",
  "/app-data/persona": "Persona",
  "/app-data/guardarails": "Guardrails",
  "/app-data/ctas": "CTAs",
  "/app-data/broll": "B-Roll",
  "/app-data/voices": "Voces",
  "/app-data/voicedna-sources": "VoiceDNA",
  "/app-data/audiencia": "Audiencia",
  "/app-data/sponsors": "Sponsors",
  "/app-data/brands": "Marcas",
  "/app-data/identidad-visual": "Identidad Visual",
  "/app-data/default-settings": "Config. Defecto",
  "/app-data/fuentes": "Fuentes",
  "/app-data/spy": "Spy",
  "/app-data/social-profiles": "Perfiles Sociales",
  "/onboarding": "Onboarding",
};

const TAB_LABELS: Record<string, string> = {
  copy: "Copy/Script",
  audio: "Audio",
  montaje: "Montaje",
  miniaturas: "Miniaturas",
  render: "Render",
};

/** Get a short, human-readable label for the current page */
export function getPageLabel(pageContext: string): string {
  const [basePath, queryString] = pageContext.split("?");

  // Video Studio with tab
  if (queryString && /\/videos\/[^/]+$/.test(basePath)) {
    const params = new URLSearchParams(queryString);
    const tab = params.get("tab");
    if (tab && TAB_LABELS[tab]) {
      const subtab = params.get("subtab");
      return subtab === "ideas" ? "Ideas & Research" : `Video · ${TAB_LABELS[tab]}`;
    }
    return "Video Studio";
  }

  // Dynamic video route without tab
  if (/\/videos\/[^/]+$/.test(basePath)) return "Video Studio";
  if (/\/scenes\/[^/]+$/.test(basePath)) return "Escenas";
  if (/\/remotion\/[^/]+$/.test(basePath)) return "Preview Remotion";

  // Static routes
  for (const [pattern, label] of Object.entries(PAGE_LABELS)) {
    if (basePath.endsWith(pattern) || basePath.includes(pattern + "/")) {
      return label;
    }
  }

  return "";
}

/** Default suggestions (used when no page-specific ones exist) */
const DEFAULT_SUGGESTIONS: PageSuggestion[] = [
  { text: "¿Cual es el estado de mi ultimo video?", icon: "message", accent: "primary" },
  { text: "¿Como creo un nuevo video?", icon: "help", accent: "success" },
  { text: "¿Que hago si el audio falla?", icon: "tool", accent: "warning" },
];

const PAGE_SUGGESTIONS: Record<string, PageSuggestion[]> = {
  "/dashboard": [
    { text: "¿Cuantos videos tengo en produccion?", icon: "message", accent: "primary" },
    { text: "Muestrame el ultimo video terminado", icon: "message", accent: "success" },
    { text: "¿Como selecciono otra cuenta?", icon: "help", accent: "warning" },
  ],
  copy: [
    { text: "¿Como funciona la generacion de copy?", icon: "help", accent: "primary" },
    { text: "¿Puedo editar el guion despues de generarlo?", icon: "help", accent: "success" },
    { text: "El copy no se ha generado, ¿que hago?", icon: "tool", accent: "warning" },
  ],
  audio: [
    { text: "¿Como se genera el audio con ElevenLabs?", icon: "help", accent: "primary" },
    { text: "¿Puedo cambiar la voz del narrador?", icon: "help", accent: "success" },
    { text: "El audio tarda mucho, ¿es normal?", icon: "tool", accent: "warning" },
  ],
  montaje: [
    { text: "¿Como funciona el montaje con avatares?", icon: "help", accent: "primary" },
    { text: "¿Puedo cambiar el avatar de una escena?", icon: "help", accent: "success" },
    { text: "El video de avatar no se genera, ¿que hago?", icon: "tool", accent: "warning" },
  ],
  render: [
    { text: "¿Cuanto tarda el render final?", icon: "help", accent: "primary" },
    { text: "¿Donde se publica el video?", icon: "help", accent: "success" },
    { text: "El render ha fallado, ¿como lo reintento?", icon: "tool", accent: "warning" },
  ],
  miniaturas: [
    { text: "¿Como se generan las miniaturas?", icon: "help", accent: "primary" },
    { text: "¿Puedo subir mi propia miniatura?", icon: "help", accent: "success" },
    { text: "¿Que formatos soporta?", icon: "tool", accent: "warning" },
  ],
  "/help": [
    { text: "¿Cuales son los pasos del pipeline?", icon: "help", accent: "primary" },
    { text: "¿Que hago si un paso falla?", icon: "tool", accent: "success" },
    { text: "Quiero crear mi primer video", icon: "message", accent: "warning" },
  ],
  "/settings": [
    { text: "¿Como cambio mi contrasena?", icon: "help", accent: "primary" },
    { text: "¿Como configuro las notificaciones?", icon: "help", accent: "success" },
    { text: "¿Donde veo mi plan y facturacion?", icon: "message", accent: "warning" },
  ],
  "/montaje-video": [
    { text: "¿Como funciona la galeria de montaje?", icon: "help", accent: "primary" },
    { text: "¿Puedo reordenar las escenas?", icon: "help", accent: "success" },
    { text: "Un clip tiene error, ¿como lo regenero?", icon: "tool", accent: "warning" },
  ],
};

/** Get contextual suggestions based on the current page */
export function getPageSuggestions(pageContext: string): PageSuggestion[] {
  const [basePath, queryString] = pageContext.split("?");

  // Video Studio tab
  if (queryString && /\/videos\/[^/]+$/.test(basePath)) {
    const params = new URLSearchParams(queryString);
    const tab = params.get("tab");
    if (tab && PAGE_SUGGESTIONS[tab]) return PAGE_SUGGESTIONS[tab];
  }

  // Static routes
  for (const [pattern, suggestions] of Object.entries(PAGE_SUGGESTIONS)) {
    if (pattern.startsWith("/") && (basePath.endsWith(pattern) || basePath.includes(pattern + "/"))) {
      return suggestions;
    }
  }

  return DEFAULT_SUGGESTIONS;
}
