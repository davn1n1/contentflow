import { NextRequest, NextResponse } from "next/server";
import { airtableFetch, airtableFetchByIds, TABLES } from "@/lib/airtable/client";
import { authenticateApiRequest } from "@/lib/auth/api-guard";

const DRAFT_FIELDS = [
  "Name",
  "Titulo",
  "Status",
  "Numero Concepto",
  "Miniatura",
  "URL Miniatura",
  "Descripcion",
  "Prompt Miniatura",
  "Portada",
  "Portada Youtube ABC",
  "Favorita",
  "Tipo Creatividad",
  "Formato",
  "Status Nuevas Miniaturas",
  "Slideengine",
  "Pone Persona",
  "Expresión",
  "Feedback",
  "Notes",
  "Youtube 365 Full Posts",
  "🏢Account",
  "Created",
];

interface DraftFields {
  Name?: string;
  Titulo?: string;
  Status?: string;
  "Numero Concepto"?: string;
  Miniatura?: { url: string; thumbnails?: { large?: { url: string } } }[];
  "URL Miniatura"?: string;
  Descripcion?: string;
  "Prompt Miniatura"?: string;
  Portada?: boolean;
  "Portada Youtube ABC"?: string;
  Favorita?: boolean;
  "Tipo Creatividad"?: string;
  Formato?: string;
  "Status Nuevas Miniaturas"?: string;
  Slideengine?: string;
  "Pone Persona"?: string;
  "Expresión"?: string[];
  Feedback?: string;
  Notes?: string;
  "Youtube 365 Full Posts"?: string[];
  "🏢Account"?: string[];
  Created?: string;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");
    const ids = searchParams.get("ids");

    if (ids) {
      const recordIds = ids.split(",").filter(Boolean);
      if (recordIds.length === 0) {
        return NextResponse.json([]);
      }
      const records = await airtableFetchByIds<DraftFields>(
        TABLES.DRAFT_PUBLICACION,
        recordIds,
        DRAFT_FIELDS
      );
      return NextResponse.json(records.map(mapDraft));
    }

    if (videoId) {
      const { records } = await airtableFetch<DraftFields>(TABLES.DRAFT_PUBLICACION, {
        filterByFormula: `FIND('${videoId}', ARRAYJOIN({Youtube 365 Full Posts}, ','))`,
        fields: DRAFT_FIELDS,
        sort: [{ field: "Name", direction: "asc" }],
      });
      return NextResponse.json(records.map(mapDraft));
    }

    return NextResponse.json({ error: "videoId or ids required" }, { status: 400 });
  } catch (error) {
    console.error("Draft Publicacion fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch drafts" }, { status: 500 });
  }
}

function mapDraft(r: { id: string; createdTime: string; fields: DraftFields }) {
  return {
    id: r.id,
    name: r.fields.Name || null,
    titulo: r.fields.Titulo || null,
    status: r.fields.Status || null,
    numero_concepto: r.fields["Numero Concepto"] || null,
    miniatura_url:
      r.fields.Miniatura?.[0]?.thumbnails?.large?.url ||
      r.fields.Miniatura?.[0]?.url ||
      null,
    url_miniatura: r.fields["URL Miniatura"] || null,
    descripcion: r.fields.Descripcion || null,
    prompt_miniatura: r.fields["Prompt Miniatura"] || null,
    portada: r.fields.Portada || false,
    portada_youtube_abc: r.fields["Portada Youtube ABC"] || null,
    favorita: r.fields.Favorita || false,
    tipo_creatividad: r.fields["Tipo Creatividad"] || null,
    formato: r.fields.Formato || null,
    status_nuevas_miniaturas: r.fields["Status Nuevas Miniaturas"] || null,
    slideengine: r.fields.Slideengine || null,
    pone_persona: r.fields["Pone Persona"] || null,
    expresion_ids: r.fields["Expresión"] || [],
    feedback: r.fields.Feedback || null,
    notes: r.fields.Notes || null,
    video_ids: r.fields["Youtube 365 Full Posts"] || [],
    created: r.fields.Created || r.createdTime,
  };
}
