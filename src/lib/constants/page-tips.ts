/**
 * Page Tips: contextual onboarding content per route.
 * Each entry maps a route pattern to a tip description and relevant help article slugs.
 * Article slugs reference help_articles.slug in Supabase.
 *
 * Shown once per page when a user visits for the first time.
 */

export interface PageTip {
  description: string;
  articleSlugs: string[];
}

export const PAGE_TIPS: Record<string, PageTip> = {
  // Getting Started
  "/dashboard": {
    description:
      "Desde el Dashboard puedes seleccionar tu cuenta y ver un resumen general del estado de produccion.",
    articleSlugs: ["primeros-pasos", "seleccionar-cuenta"],
  },

  // Produccion YT
  "/research": {
    description:
      "Research muestra ideas de contenido basadas en tendencias de YouTube y tus fuentes de inspiracion. Selecciona una idea para crear un nuevo video.",
    articleSlugs: ["research-ideas"],
  },
  "/ideas": {
    description:
      "Ideas de Inspiracion son sugerencias generadas por IA basadas en tus fuentes y audiencia. Puedes crear un video directamente desde cualquier idea.",
    articleSlugs: ["ideas-inspiracion"],
  },
  "/scripts": {
    description:
      "Aqui ves el guion de cada video con sus escenas, audio y feedback de IA. Es el paso 1 del pipeline: CREAR COPY.",
    articleSlugs: ["crear-copy-guion", "configurar-voicedna"],
  },
  "/videos": {
    description:
      "Lista todos tus videos con el estado de cada paso del pipeline. Usa los filtros para encontrar videos rapidamente.",
    articleSlugs: ["buscar-videos-filtros", "ver-detalle-video"],
  },
  "/renders": {
    description:
      "Renders muestra el estado del render final y publicacion en YouTube. Este es el ultimo paso del pipeline.",
    articleSlugs: ["render-final-publicacion"],
  },

  // Remotion
  "/remotion": {
    description:
      "El editor Remotion te permite previsualizar tus videos antes de publicar, con todas las capas (avatar, slides, B-roll, audio).",
    articleSlugs: ["remotion-preview", "remotion-lista-timelines"],
  },

  // Account & Settings
  "/settings": {
    description:
      "Configuracion de tu cuenta: nombre, conexiones y ajustes generales.",
    articleSlugs: ["gestionar-cuenta"],
  },
  "/team": {
    description:
      "Gestiona los miembros de tu equipo, invita colaboradores y asigna permisos.",
    articleSlugs: ["gestionar-equipo"],
  },
  "/campanas": {
    description:
      "Crea y gestiona campanas de marketing y publicidad para Ads y Reels.",
    articleSlugs: ["gestionar-campanas"],
  },

  // App Data
  "/app-data/avatares": {
    description:
      "Configura los avatares de HeyGen disponibles para tus videos. Cada avatar es un personaje virtual que narra.",
    articleSlugs: ["configurar-avatares"],
  },
  "/app-data/avatares-set": {
    description:
      "Los Sets de Avatares permiten rotar automaticamente entre varios avatares en un mismo video para mayor variedad.",
    articleSlugs: ["configurar-avatares"],
  },
  "/app-data/persona": {
    description:
      "Define la Persona del narrador: tono, estilo y personalidad que la IA usara para generar tus scripts.",
    articleSlugs: ["configurar-persona"],
  },
  "/app-data/guardarails": {
    description:
      "Los Guardrails son reglas y limites para la IA: que NO decir, temas a evitar y formato preferido.",
    articleSlugs: ["configurar-persona"],
  },
  "/app-data/ctas": {
    description:
      "Configura las llamadas a la accion (CTAs) que se insertan automaticamente en tus videos.",
    articleSlugs: ["configurar-ctas"],
  },
  "/app-data/broll": {
    description:
      "Gestiona tu B-Roll personalizado: clips e imagenes que se superponen al avatar durante el video.",
    articleSlugs: ["gestionar-broll"],
  },
  "/app-data/voices": {
    description:
      "Configura las voces de ElevenLabs disponibles para narrar tus videos.",
    articleSlugs: ["configurar-voces"],
  },
  "/app-data/voicedna-sources": {
    description:
      "Agrega fuentes de texto (transcripciones, posts) para que la IA aprenda tu estilo de comunicacion.",
    articleSlugs: ["configurar-voicedna-sources"],
  },
  "/app-data/audiencia": {
    description:
      "Define los segmentos de tu audiencia objetivo para que la IA adapte el contenido a tu publico.",
    articleSlugs: ["configurar-audiencia"],
  },
  "/app-data/sponsors": {
    description:
      "Gestiona patrocinadores cuyas menciones se pueden integrar en tus videos automaticamente.",
    articleSlugs: ["gestionar-sponsors-brands"],
  },
  "/app-data/brands": {
    description:
      "Gestiona tus marcas propias para generar menciones contextuales en los scripts.",
    articleSlugs: ["gestionar-sponsors-brands"],
  },
  "/app-data/identidad-visual": {
    description:
      "Define colores, tipografias y estilos visuales para mantener consistencia en tus videos.",
    articleSlugs: ["identidad-visual"],
  },
  "/app-data/default-settings": {
    description:
      "Configura valores por defecto: avatar, voz, duracion, musica de fondo y mas.",
    articleSlugs: ["configuracion-defecto"],
  },
  "/app-data/fuentes": {
    description:
      "Configura canales de YouTube, blogs y newsletters que inspiran tu contenido.",
    articleSlugs: ["fuentes-inspiracion"],
  },
  "/app-data/spy": {
    description:
      "Analiza anuncios y reels de la competencia para inspiracion y benchmarking.",
    articleSlugs: ["spy-ads-reels"],
  },
  "/app-data/social-profiles": {
    description:
      "Conecta tus perfiles de redes sociales para publicacion automatica y analisis.",
    articleSlugs: ["perfiles-sociales"],
  },

  // Help
  "/help": {
    description:
      "El Centro de Ayuda tiene guias y tutoriales para todas las funciones de ContentFlow365.",
    articleSlugs: ["usar-chat-ia", "primeros-pasos"],
  },
};

/**
 * Match a pathname to a page tip key.
 * Handles dynamic segments like /[client-slug]/ by checking endsWith/includes.
 */
export function matchPageTipKey(pathname: string): string | null {
  for (const pattern of Object.keys(PAGE_TIPS)) {
    if (pathname.endsWith(pattern) || pathname.includes(pattern + "/")) {
      return pattern;
    }
  }
  return null;
}
