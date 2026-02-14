import { useQuery } from "@tanstack/react-query";

interface VideoDetail {
  id: string;
  name: number | null;
  titulo: string | null;
  titulo_a: string | null;
  titulo_b: string | null;
  titulo_c: string | null;
  estado: string | null;
  formato: string | null;
  post_content: string | null;
  elevenlabs_text: string | null;
  tags: string | null;
  voice_dna_ids: string[];
  feedback_copy: string | null;
  escenas_ids: string[];
  ae_render_ids: string[];
  ideas_ids: string[];
  portada_a: string | null;
  portada_b: string | null;
  portada_c: string | null;
  variaciones_multiples_titulos: string | null;
  comentario_pineado_ids: string[];
  status_copy: boolean;
  status_audio: boolean;
  status_avatares: boolean;
  status_rendering_video: boolean;
  created_time: string;
  // Script & Audio fields
  scheduled_date: string | null;
  extension_listado: string | null;
  intro_ids: string[];
  cta_ids: string[];
  intro_broll_ids: string[];
  cta_broll_ids: string[];
  busca_videos_x: string | null;
  keywords_search: string | null;
  genera_reels: string | null;
  voice_length_minutes: string | null;
  status_agentes: string | null;
  // Script 3 fields
  avatar_set_ids: string[];
  persona_ids: string[];
  engine_copy: string | null;
  sponsor_ids: string[];
  seguro_creacion_copy: string | null;
  status_copy_analysis: string | null;
  extension_palabras: number | null;
  estimated_duration: string | null;
  draft_publicacion_ids: string[];
  // Montaje fields
  formato_diseno_slides_ids: string[];
  estilo_musical_ids: string[];
}

export interface SceneDetail {
  id: string;
  n_escena: number;
  clasificación_escena: string | null;
  start: number | null;
  end: number | null;
  duration: number | null;
  script: string | null;
  script_elevenlabs: string | null;
  role: string | null;
  importance: string | null;
  topic: string | null;
  status: string | null;
  voice_s3: string | null;
  voice_length: number | null;
  status_audio: string | null;
  status_script: string | null;
  audio_revisado_ok: boolean;
  copy_revisado_ok: boolean;
  informe_resumen_emoticonos: string | null;
  solo_observaciones: string | null;
  analisis_voz_1: string | null;
  analisis_voz_2: string | null;
  analisis_voz_3: string | null;
  feedback_audio: string | null;
  elevenlabs_text_v3_enhanced: string | null;
  // Montaje / Slide fields
  slide: string | null;
  slide_full: string | null;
  slide_activa: boolean;
  status_slide: string | null;
  slide_engine: string | null;
  feedback_slide: string | null;
  prompt_slide: string | null;
  calificacion_imagen_final: string | null;
  // Broll fields
  broll_thumb: string | null;
  broll_activa: boolean;
  url_broll_s3: string | null;
  broll_offset: number | null;
  broll_duration: number | null;
  broll_custom: boolean;
  broll_video: string | null;
  // Camera / Avatar fields
  zoom_camera: string | null;
  tipo_avatar: string | null;
  photo_avatar: string | null;
  heygen_render: string | null; // status text, not image
  camera_s3_url: string | null; // actual rendered camera video URL
  // Audio fields (from linked Audio table)
  audio_tipo: string | null;
  audio_seccion: string | null;
  audio_attachment: string | null;
  estilos_musicales: string[];
  muestra_audio: string | null;
  audio_favorito: boolean;
  // Copy feedback / Informe fields
  montaje_copy_con_observaciones: string | null;
  comparativa_transcript_original: string | null;
  conclusion_general_datos_difieren_mucho: string | null;
  informe_guardarailes: string | null;
  palabras_conflictivas: string | null;
}

export interface LinkedIdea {
  id: string;
  idea_title: string | null;
  thumb_url: string | null;
  summary: string | null;
  yt_channel_name: string | null;
  domain: string | null;
  url_fuente: string | null;
}

export interface LinkedIdeaFull extends LinkedIdea {
  tipo_idea: string | null;
  status: string | null;
  status_start_calculado: string | null;
  contenido_coincide_copy: boolean;
  n_escena: string | null;
  publica_video: string | null;
  clasificacion_escena: string | null;
  fuentes_inspiracion_ids: string[];
}

export interface LinkedAvatarSet {
  id: string;
  name: string | null;
  status: string | null;
  tipo_avatar: string | null;
  image_url: string | null;
}

export interface LinkedPersona {
  id: string;
  name: string | null;
  status: string | null;
  account_name: string | null;
  image_url: string | null;
}

export interface LinkedRecord {
  id: string;
  name: string | null;
  image_url: string | null;
  status: string | null;
}

export interface VideoWithScenes extends VideoDetail {
  scenes: SceneDetail[];
  linkedIdea: LinkedIdea | null;
  linkedIdeas: LinkedIdeaFull[];
  linkedAvatarSet: LinkedAvatarSet | null;
  linkedPersona: LinkedPersona | null;
  linkedIntros: LinkedRecord[];
  linkedCtas: LinkedRecord[];
  linkedIntroBrolls: LinkedRecord[];
  linkedCtaBrolls: LinkedRecord[];
  linkedSponsors: LinkedRecord[];
  linkedComentarioPineado: LinkedRecord[];
  linkedFormatoDisenoSlides: LinkedRecord | null;
  linkedEstiloMusical: LinkedRecord | null;
}

// Fetch a single linked record from app-data
async function fetchLinkedRecord(table: string, recordId: string) {
  try {
    const res = await fetch(`/api/data/app-data?table=${table}&id=${recordId}`);
    if (res.ok) return res.json();
  } catch {
    // Non-critical
  }
  return null;
}

// Fetch multiple linked records from app-data
async function fetchLinkedRecords(table: string, ids: string[]): Promise<LinkedRecord[]> {
  if (!ids || ids.length === 0) return [];
  try {
    const res = await fetch(`/api/data/app-data?table=${table}&ids=${ids.join(",")}`);
    if (res.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any[] = await res.json();
      return data.map((r) => ({
        id: r.id,
        name: findTextField(r) || r.id,
        image_url: findAttachmentUrl(r),
        status: r["Status"] || null,
      }));
    }
  } catch {
    // Non-critical
  }
  return [];
}

// Extract URL from an Airtable attachment value (array of {url, thumbnails, ...})
function extractAttachmentValue(val: unknown): string | null {
  if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && val[0] !== null && "url" in val[0]) {
    return val[0]?.thumbnails?.large?.url || val[0]?.url || null;
  }
  return null;
}

// Auto-detect first attachment field, then fall back to URL string fields
function findAttachmentUrl(data: Record<string, unknown>): string | null {
  // First pass: look for Airtable attachment fields (array with objects containing `url`)
  for (const [key, val] of Object.entries(data)) {
    if (key === "id" || key === "createdTime") continue;
    const url = extractAttachmentValue(val);
    if (url) return url;
  }
  // Second pass: look for string fields containing an image/video URL
  for (const [key, val] of Object.entries(data)) {
    if (key === "id" || key === "createdTime") continue;
    if (typeof val === "string" && /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|webm)/i.test(val)) {
      return val;
    }
  }
  return null;
}

// Extract image URL from specific named fields, then fall back to generic detection
function extractImageUrl(data: Record<string, unknown>, ...fieldNames: string[]): string | null {
  // Try specific field names first (in priority order)
  for (const name of fieldNames) {
    const val = data[name];
    if (!val) continue;
    // Airtable attachment field
    const attachUrl = extractAttachmentValue(val);
    if (attachUrl) return attachUrl;
    // Direct URL string
    if (typeof val === "string" && val.startsWith("http")) return val;
  }
  // Fall back to generic detection
  return findAttachmentUrl(data);
}

// Auto-detect first text field that looks like a name/title
function findTextField(data: Record<string, unknown>): string | null {
  // Check explicit name fields first
  for (const key of ["Name", "Nombre", "Titulo", "Title"]) {
    if (typeof data[key] === "string" && data[key]) return data[key] as string;
  }
  return null;
}

export function useVideoDetail(videoId: string | null) {
  return useQuery({
    queryKey: ["video-detail", videoId],
    queryFn: async (): Promise<VideoWithScenes> => {
      // Fetch video
      const videoRes = await fetch(`/api/data/videos?id=${videoId}`);
      if (!videoRes.ok) throw new Error("Failed to fetch video");
      const video: VideoDetail = await videoRes.json();

      // Fetch all linked records in parallel
      const [
        scenes, linkedIdea, linkedIdeas, linkedAvatarSet, linkedPersona,
        linkedIntros, linkedCtas, linkedIntroBrolls, linkedCtaBrolls,
        linkedSponsors, linkedComentarioPineado,
        linkedFormatoDisenoSlides, linkedEstiloMusical,
      ] = await Promise.all([
        // Scenes
        (async () => {
          if (video.escenas_ids?.length > 0) {
            const res = await fetch(`/api/data/scenes?ids=${video.escenas_ids.join(",")}`);
            if (res.ok) return res.json() as Promise<SceneDetail[]>;
          }
          return [] as SceneDetail[];
        })(),
        // Linked idea (first one, for backward compat)
        (async () => {
          if (video.ideas_ids?.length > 0) {
            const res = await fetch(`/api/data/ideas?id=${video.ideas_ids[0]}`);
            if (res.ok) return res.json() as Promise<LinkedIdea>;
          }
          return null;
        })(),
        // All linked ideas (for Ideas section)
        (async () => {
          if (video.ideas_ids?.length > 0) {
            const res = await fetch(`/api/data/ideas?ids=${video.ideas_ids.join(",")}`);
            if (res.ok) return res.json() as Promise<LinkedIdeaFull[]>;
          }
          return [] as LinkedIdeaFull[];
        })(),
        // Avatar Set
        (async () => {
          if (video.avatar_set_ids?.length > 0) {
            const data = await fetchLinkedRecord("avatares-set", video.avatar_set_ids[0]);
            if (data) {
              return {
                id: data.id,
                name: data["Name"] || data["Nombre"] || null,
                status: data["Status"] || null,
                tipo_avatar: data["Tipo Avatar"] || null,
                image_url: extractImageUrl(data, "Foto Avatar", "Image", "Foto"),
              } as LinkedAvatarSet;
            }
          }
          return null;
        })(),
        // Persona
        (async () => {
          if (video.persona_ids?.length > 0) {
            const data = await fetchLinkedRecord("persona", video.persona_ids[0]);
            if (data) {
              return {
                id: data.id,
                name: data["Name"] || data["Nombre"] || null,
                status: data["Status"] || null,
                account_name: Array.isArray(data["🏢Account"]) ? data["🏢Account"][0] : null,
                image_url: extractImageUrl(data, "Foto", "Image", "Avatar"),
              } as LinkedPersona;
            }
          }
          return null;
        })(),
        // Intros (CTAs table)
        fetchLinkedRecords("ctas", video.intro_ids),
        // CTAs (CTAs table)
        fetchLinkedRecords("ctas", video.cta_ids),
        // Intro Brolls (Videos Broll table)
        fetchLinkedRecords("broll", video.intro_broll_ids),
        // CTA Brolls (Videos Broll table)
        fetchLinkedRecords("broll", video.cta_broll_ids),
        // Sponsors
        fetchLinkedRecords("sponsors", video.sponsor_ids),
        // Comentario Pineado
        fetchLinkedRecords("comentario-pineado", video.comentario_pineado_ids),
        // Formato Diseño Slides
        (async () => {
          if (video.formato_diseno_slides_ids?.length > 0) {
            const data = await fetchLinkedRecord("formato-diseno-slides", video.formato_diseno_slides_ids[0]);
            if (data) {
              return {
                id: data.id,
                name: data["Formato Diseño"] || findTextField(data) || null,
                image_url: extractImageUrl(data, "Muestra"),
                status: null,
              } as LinkedRecord;
            }
          }
          return null;
        })(),
        // Estilo Musical
        (async () => {
          if (video.estilo_musical_ids?.length > 0) {
            const data = await fetchLinkedRecord("estilos-musicales", video.estilo_musical_ids[0]);
            if (data) {
              return {
                id: data.id,
                name: data["style_es"] || data["style_key"] || findTextField(data) || null,
                image_url: extractImageUrl(data, "Muestra"),
                status: null,
              } as LinkedRecord;
            }
          }
          return null;
        })(),
      ]);

      return {
        ...video, scenes, linkedIdea, linkedIdeas, linkedAvatarSet, linkedPersona,
        linkedIntros, linkedCtas, linkedIntroBrolls, linkedCtaBrolls,
        linkedSponsors, linkedComentarioPineado,
        linkedFormatoDisenoSlides, linkedEstiloMusical,
      };
    },
    enabled: !!videoId,
  });
}
