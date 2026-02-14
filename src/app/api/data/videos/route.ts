import { NextRequest, NextResponse } from "next/server";
import { airtableFetch, airtableUpdate, TABLES } from "@/lib/airtable/client";
import { authenticateApiRequest } from "@/lib/auth/api-guard";

// Correct Airtable field names (verified from API)
const VIDEO_FIELDS = [
  "Name", "Estado", "Status Audio", "Status Avatares",
  "Status Render Video", "Status Escenas", "Status Renders",
  "🏢Account", "Escenas", "AE Render", "Format",
  "Post Content", "ElevenLabs Text",
  "Titulo Youtube A", "Titulo Youtube B", "Titulo Youtube C",
  "Tags IA", "VoiceDNA", "Feedback",
  "Voice Length", "Created Time", "Platform",
  "Horizontal/Vertical", "Seguro", "Seguro Creación Audio", "Seguro Creación Copy",
  "Portada Youtube A",
  "💡Ideas Inspiracion",
  // Script & Audio fields
  "Scheduled Date",
  "Extension Listado",
  "Intro", "CTA", "Intro Broll", "CTA Broll",
  "Busca Videos en X",
  "Keywords Search",
  "Genera Reels",
  "Voice Length Minutes",
  "Status AgentesIA",
  // Script 3 fields
  "Avatar Set",
  "Persona",
  "Engine Copy",
  "Sponsors",
  "Status & Copy Analysis",
  "Extensión Palabras",
  "Estimated Duration mm:ss",
];

interface VideoFields {
  Name?: number;
  Estado?: string;
  "Status Audio"?: boolean;
  "Status Avatares"?: boolean;
  "Status Render Video"?: boolean;
  "Status Escenas"?: boolean;
  "Status Renders"?: boolean;
  "🏢Account"?: string[];
  Escenas?: string[];
  "AE Render"?: string[];
  Format?: string;
  "Post Content"?: string;
  "ElevenLabs Text"?: string;
  "Titulo Youtube A"?: string;
  "Titulo Youtube B"?: string;
  "Titulo Youtube C"?: string;
  "Tags IA"?: string;
  VoiceDNA?: string[];
  Feedback?: string;
  "Voice Length"?: number;
  "Created Time"?: string;
  Platform?: string;
  "Horizontal/Vertical"?: string;
  Seguro?: boolean;
  "Seguro Creación Audio"?: boolean;
  "Seguro Creación Copy"?: boolean;
  "Portada Youtube A"?: { url: string; thumbnails?: { large?: { url: string } } }[];
  "💡Ideas Inspiracion"?: string[];
  "Scheduled Date"?: string;
  "Extension Listado"?: string;
  Intro?: string[];
  CTA?: string[];
  "Intro Broll"?: string[];
  "CTA Broll"?: string[];
  "Busca Videos en X"?: string;
  "Keywords Search"?: string;
  "Genera Reels"?: string;
  "Voice Length Minutes"?: string;
  "Status AgentesIA"?: string;
  "Avatar Set"?: string[];
  Persona?: string[];
  "Engine Copy"?: string;
  Sponsors?: string[];
  "Status & Copy Analysis"?: string;
  "Extensión Palabras"?: number;
  "Estimated Duration mm:ss"?: string;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const estado = searchParams.get("estado");
    const search = searchParams.get("search");
    const videoId = searchParams.get("id");
    const limit = parseInt(searchParams.get("limit") || "100");

    // Single video fetch
    if (videoId) {
      const { records } = await airtableFetch<VideoFields>(TABLES.VIDEOS, {
        filterByFormula: `RECORD_ID()='${videoId}'`,
        fields: VIDEO_FIELDS,
        maxRecords: 1,
      });

      if (records.length === 0) {
        return NextResponse.json(null);
      }

      return NextResponse.json(mapVideo(records[0]));
    }

    // List videos with filters
    const filters: string[] = [];
    if (accountId) {
      // Linked record fields in formulas resolve to display names, not record IDs.
      // Resolve account name first, then filter by name.
      const accountResult = await airtableFetch<{ Name?: string }>(TABLES.ACCOUNT, {
        filterByFormula: `RECORD_ID()='${accountId}'`,
        fields: ["Name"],
        maxRecords: 1,
      });
      const accountName = accountResult.records[0]?.fields?.Name;
      if (accountName) {
        filters.push(`FIND('${accountName}', ARRAYJOIN({🏢Account}, ','))`);
      }
    }
    if (estado) {
      filters.push(`{Estado} = '${estado}'`);
    }
    if (search) {
      filters.push(`FIND(LOWER('${search}'), LOWER(Name & ''))`);
    }

    const filterByFormula = filters.length > 0
      ? filters.length === 1 ? filters[0] : `AND(${filters.join(",")})`
      : undefined;

    const { records } = await airtableFetch<VideoFields>(TABLES.VIDEOS, {
      fields: VIDEO_FIELDS,
      filterByFormula,
      maxRecords: limit,
      sort: [{ field: "Name", direction: "desc" }],
    });

    return NextResponse.json(records.map(mapVideo));
  } catch (error) {
    console.error("Airtable videos error:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}

// PATCH: Update video fields (Scheduled Date, Feedback, etc.)
export async function PATCH(request: NextRequest) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { id, fields } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    if (!fields || typeof fields !== "object") {
      return NextResponse.json({ error: "fields required" }, { status: 400 });
    }

    const updated = await airtableUpdate<VideoFields>(TABLES.VIDEOS, id, fields);
    return NextResponse.json(mapVideo(updated));
  } catch (error) {
    console.error("Airtable video update error:", error);
    return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
  }
}

function mapVideo(r: { id: string; createdTime: string; fields: VideoFields }) {
  return {
    id: r.id,
    airtable_id: r.id,
    account_id: r.fields["🏢Account"]?.[0] || null,
    name: r.fields.Name || null,
    titulo: r.fields["Titulo Youtube A"] || `Video #${r.fields.Name || ""}`,
    estado: r.fields.Estado || null,
    status_copy: r.fields["Seguro Creación Copy"] || false,
    status_audio: r.fields["Status Audio"] || false,
    status_avatares: r.fields["Status Avatares"] || false,
    status_rendering_video: r.fields["Status Render Video"] || false,
    url_youtube: null,
    formato: r.fields.Format || r.fields["Horizontal/Vertical"] || null,
    duracion_total_escenas: null,
    post_content: r.fields["Post Content"] || null,
    elevenlabs_text: r.fields["ElevenLabs Text"] || null,
    titulo_a: r.fields["Titulo Youtube A"] || null,
    titulo_b: r.fields["Titulo Youtube B"] || null,
    titulo_c: r.fields["Titulo Youtube C"] || null,
    descripcion: null,
    tags: r.fields["Tags IA"] || null,
    voice_dna_ids: r.fields.VoiceDNA || [],
    feedback_copy: r.fields.Feedback || null,
    escenas_ids: r.fields.Escenas || [],
    ae_render_ids: r.fields["AE Render"] || [],
    ideas_ids: r.fields["💡Ideas Inspiracion"] || [],
    portada_a: r.fields["Portada Youtube A"]?.[0]?.thumbnails?.large?.url || r.fields["Portada Youtube A"]?.[0]?.url || null,
    created_time: r.fields["Created Time"] || r.createdTime,
    // Script & Audio fields
    scheduled_date: r.fields["Scheduled Date"] || null,
    extension_listado: r.fields["Extension Listado"] || null,
    intro_ids: r.fields.Intro || [],
    cta_ids: r.fields.CTA || [],
    intro_broll_ids: r.fields["Intro Broll"] || [],
    cta_broll_ids: r.fields["CTA Broll"] || [],
    busca_videos_x: r.fields["Busca Videos en X"] || null,
    keywords_search: r.fields["Keywords Search"] || null,
    genera_reels: r.fields["Genera Reels"] || null,
    voice_length_minutes: r.fields["Voice Length Minutes"] || null,
    status_agentes: r.fields["Status AgentesIA"] || null,
    // Script 3 fields
    avatar_set_ids: r.fields["Avatar Set"] || [],
    persona_ids: r.fields.Persona || [],
    engine_copy: r.fields["Engine Copy"] || null,
    sponsor_ids: r.fields.Sponsors || [],
    seguro_creacion_copy: r.fields["Seguro Creación Copy"] || null,
    status_copy_analysis: r.fields["Status & Copy Analysis"] || null,
    extension_palabras: r.fields["Extensión Palabras"] ?? null,
    estimated_duration: r.fields["Estimated Duration mm:ss"] || null,
  };
}
