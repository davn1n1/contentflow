export interface Account {
  id: string;
  airtable_id: string | null;
  name: string | null;
  status: string | null;
  industria: string[] | null;
  product: string | null;
  logo: Record<string, unknown> | null;
  nameapp: string | null;
  created: string;
  research_diario: boolean;
  framework_guardarails: string | null;
  cf_plans_id: string | null;
}

export interface Video {
  id: string;
  account_id: string;
  airtable_id: string | null;
  name: number;
  titulo: string | null;
  post_content: string | null;
  platform: string | null;
  scheduled_date: string | null;
  estado: string | null;
  extension: string | null;
  extension_listado: string | null;
  feedback: string | null;
  elevenlabs_text: string | null;
  elevenlabs_voice_url: string | null;
  titulo_youtube_a: string | null;
  titulo_youtube_b: string | null;
  titulo_youtube_c: string | null;
  descripción: string | null;
  url_youtube: string | null;
  url_shotstack: string | null;
  url_shotstack_production: string | null;
  voice_length: number | null;
  voice_length_minutes: string | null;
  horizontalvertical: string | null;
  format: string | null;
  // Pipeline status flags
  status_copy: boolean;
  status_audio: boolean;
  status_avatares: boolean;
  status_escenas: boolean;
  status_elementos_en_escenas: boolean;
  status_renders: boolean;
  status_timeline_hooks: boolean;
  status_rendering_video: string | null;
  status_youtube_publishing: string | null;
  status_youtube: string | null;
  status_agentesia: string | null;
  status_render_video: string | null;
  // Safety toggles
  seguro: string | null;
  seguro_creación_audio: string | null;
  seguro_creación_copy: string | null;
  seguro_render_video: string | null;
  portada_a: string | null;
  // Timestamps
  created_time: string;
  last_modified_time: string;
  // Related IDs
  avatar_set_id: string | null;
  voicedna_id: string | null;
  persona_id: string | null;
  formato_diseño_slides_id: string | null;
  estilo_musical_id: string | null;
  // Linked record arrays (from API)
  voice_dna_ids: string[];
  ideas_ids: string[];
  escenas_ids: string[];
  ae_render_ids: string[];
  intro_ids: string[];
  cta_ids: string[];
  intro_broll_ids: string[];
  cta_broll_ids: string[];
  // Script fields
  feedback_copy: string | null;
  busca_videos_x: string | null;
  keywords_search: string | null;
  genera_reels: string | null;
  status_agentes: string | null;
  formato: string | null;
  draft_publicacion_ids: string[];
  sponsor_ids: string[];
}

export interface Scene {
  id: string;
  account_id: string;
  n_escena: string | null;
  clasificación_escena: string | null;
  start: number | null;
  end: number | null;
  duration: number | null;
  script: string | null;
  script_elevenlabs: string | null;
  role: string | null;
  importance: number | null;
  camera: string | null;
  slide: Record<string, unknown> | null;
  broll: string | null;
  topic: string | null;
  status: string | null;
  url_slide_s3: string | null;
  url_camera_s3: string | null;
  url_broll: string | null;
  voice_s3: string | null;
  voice_s3_nivelada: string | null;
  voice_length: number | null;
  status_audio: string | null;
  status_camera: string | null;
  status_script: string | null;
  elevenlabs_text_v3_enhanced: string | null;
  audio_revisado_ok: boolean;
  copy_revisado_ok: boolean;
  camera_table_id: string | null;
  audio_id: string | null;
}

export interface AeRender {
  id: string;
  account_id: string;
  n_render: number | null;
  status: string | null;
  slide: Record<string, unknown> | null;
  start: number | null;
  end: number | null;
  duration_total_escena: number | null;
  activa: boolean;
  url_s3_plainly: string | null;
  url_slide_s3: string | null;
  rendervideo: Record<string, unknown> | null;
  shotstackid: string | null;
  shotstackurl: string | null;
  status_timeline: string | null;
  feedback_render: string | null;
}

export interface Timeline {
  id: string;
  account_id: string;
  name: string | null;
  status: string | null;
  start: number | null;
  end: number | null;
  duration: number | null;
}

export interface AccountSettings {
  id: string;
  account_id: string;
  name: string | null;
  status: string | null;
  notes: string | null;
  feedback_ae_hooks: string | null;
}

// Supabase profile (auth link to Airtable)
export interface Profile {
  id: string;
  email: string;
  airtable_user_id: string | null;
  created_at: string;
  updated_at: string;
}

// Airtable user (source of truth)
export interface User {
  id: string;
  airtable_id: string;
  name: string | null;
  email: string | null;
  status: string | null;
  rol: string[];
  account_ids: string[];
  account_names: string[];
  agency_ids: string[];
  user_val: string | null;
  notes: string | null;
  created: string;
}

export interface Idea {
  id: string;
  idea_title: string | null;
  status: string | null;
  tipo_idea: string | null;
  favorita: boolean;
  summary: string | null;
  url_fuente: string | null;
  domain: string | null;
  thumb_url: string | null;
  tags: string[] | null;
  short_long: string | null;
  // YouTube fields
  yt_channel_name: string | null;
  yt_views_count: number | null;
  yt_views_count_k: string | null;
  yt_comments_count: number | null;
  yt_duration: string | null;
  yt_video_id: string | null;
  yt_channel_subs: number | null;
  yt_publish_date: string | null;
  // Meta
  score: number | null;
  notas_ia: string | null;
  status_emoticonos: string | null;
  created: string;
  account_id: string | null;
  status_transcript: string | null;
  fuentes_inspiracion_ids: string[];
  yt_estructure: string | null;
  priority_level: string | null;
}

export interface Research {
  id: string;
  titulo: string | null;
  fecha: string | null;
  status: string | null;
  account_id: string | null;
  // Research Últimas 24 Horas
  tendencia_hoy: string | null;
  temas_recomendados: string | null;
  formatos_propuestos: string | null;
  // Perplexity web research
  web_fuentes: string | null;
  web_query_investigacion: string | null;
  web_conclusion_perplexity: string | null;
  // Links
  soporte_url: string | null;
  ideas_inspiracion_url: string | null;
  // Linked records
  ideas_inspiracion_ids: string[];
  finalistas_ids: string[];
  // Conclusion
  conclusion: string | null;
  // Media
  logo_url: string | null;
  thumb_url: string | null;
  // Meta
  created: string;
}

// Expanded idea data for Research "Ideas Seleccionadas" tab
export interface ResearchSelectedIdea {
  id: string;
  idea_title: string | null;
  thumb_url: string | null;
  research_puesto: number | null;
  yt_new: string | null;
  fuentes_inspiracion: string | null;
  fuentes_inspiracion_is_id?: boolean;
  logo_url: string | null;
  research_evaluacion: string | null;
  research_resumen: string | null;
  yt_duration: string | null;
  yt_views_count: number | null;
  yt_video_id: string | null;
  yt_channel_name?: string | null;
}

export interface DraftPublicacion {
  id: string;
  name: string | null;
  titulo: string | null;
  status: string | null;
  numero_concepto: string | null;
  miniatura_url: string | null;
  url_miniatura: string | null;
  descripcion: string | null;
  prompt_miniatura: string | null;
  portada: boolean;
  portada_youtube_abc: string | null;
  favorita: boolean;
  tipo_creatividad: string | null;
  formato: string | null;
  status_nuevas_miniaturas: string | null;
  slideengine: string | null;
  pone_persona: string | null;
  expresion_ids: string[];
  feedback: string | null;
  notes: string | null;
  video_ids: string[];
  created: string;
}

export type PipelineStep = "copy" | "audio" | "video" | "render";

export interface PipelineStatus {
  copy: "pending" | "running" | "completed" | "error";
  audio: "pending" | "running" | "completed" | "error";
  video: "pending" | "running" | "completed" | "error";
  render: "pending" | "running" | "completed" | "error";
}
