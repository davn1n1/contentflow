export interface ChatConversation {
  id: string;
  user_id: string;
  title: string | null;
  account_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls: unknown[] | null;
  tool_results: unknown[] | null;
  created_at: string;
}

export interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  category: HelpCategory;
  tags: string[];
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export type HelpCategory =
  | "getting-started"
  | "copy-script"
  | "audio"
  | "video"
  | "render"
  | "troubleshooting"
  | "account"
  | "remotion";

export const HELP_CATEGORIES: Record<HelpCategory, { label: string; description: string; icon: string }> = {
  "getting-started": {
    label: "Primeros Pasos",
    description: "Aprende lo basico para empezar a usar ContentFlow365",
    icon: "Rocket",
  },
  "copy-script": {
    label: "Copy & Script",
    description: "Creacion y edicion de guiones con IA",
    icon: "PenTool",
  },
  audio: {
    label: "Audio",
    description: "Generacion de voz con ElevenLabs y configuracion de audio",
    icon: "Mic",
  },
  video: {
    label: "Video & Avatares",
    description: "Creacion de avatares con HeyGen y produccion de video",
    icon: "Video",
  },
  render: {
    label: "Render & Publicacion",
    description: "Render final con Shotstack y publicacion en YouTube",
    icon: "Upload",
  },
  troubleshooting: {
    label: "Solucion de Problemas",
    description: "Errores comunes y como resolverlos",
    icon: "AlertTriangle",
  },
  account: {
    label: "Cuenta & Configuracion",
    description: "Gestion de cuenta, avatares, voces y ajustes",
    icon: "Settings",
  },
  remotion: {
    label: "Editor de Video",
    description: "Preview y edicion de videos con Remotion",
    icon: "Film",
  },
};
