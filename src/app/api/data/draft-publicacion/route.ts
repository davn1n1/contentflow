import { NextRequest, NextResponse } from "next/server";
import { airtableFetch, airtableFetchByIds, airtableUpdate, TABLES } from "@/lib/airtable/client";
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
  "SlideEngine",
  "Pone Persona",
  "Expresion",
  "Muestra (from Expresion)",
  "Numero Variaciones",
  "Prompt Anadir Persona",
  "Persona (from Youtube 365 Full Posts)",
  "Archivar",
  "Feedback",
  "Notes",
  "Youtube 365 Full Posts",
  "🏢Account",
  "Created",
];

interface AttachmentValue {
  url: string;
  thumbnails?: { large?: { url: string } };
}

interface DraftFields {
  Name?: string;
  Titulo?: string;
  Status?: string;
  "Numero Concepto"?: string;
  Miniatura?: AttachmentValue[];
  "URL Miniatura"?: string;
  Descripcion?: string;
  "Prompt Miniatura"?: string;
  Portada?: boolean;
  "Portada Youtube ABC"?: string;
  Favorita?: boolean;
  "Tipo Creatividad"?: string;
  Formato?: string;
  "Status Nuevas Miniaturas"?: string;
  SlideEngine?: string;
  "Pone Persona"?: string;
  Expresion?: string[];
  "Muestra (from Expresion)"?: AttachmentValue[];
  "Numero Variaciones"?: string;
  "Prompt Anadir Persona"?: string;
  "Persona (from Youtube 365 Full Posts)"?: string[];
  Archivar?: boolean;
  Feedback?: string;
  Notes?: string;
  "Youtube 365 Full Posts"?: string[];
  "🏢Account"?: string[];
  Created?: string;
}

// Allowed fields for PATCH updates
const UPDATABLE_FIELDS: Record<string, string> = {
  titulo: "Titulo",
  descripcion: "Descripcion",
  feedback: "Feedback",
  favorita: "Favorita",
  portada: "Portada",
  portada_youtube_abc: "Portada Youtube ABC",
  pone_persona: "Pone Persona",
  numero_variaciones: "Numero Variaciones",
  archivar: "Archivar",
  expresion_ids: "Expresion",
};

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");
    const ids = searchParams.get("ids");

    let records: { id: string; createdTime: string; fields: DraftFields }[] = [];

    if (ids) {
      const recordIds = ids.split(",").filter(Boolean);
      if (recordIds.length === 0) {
        return NextResponse.json([]);
      }
      records = await airtableFetchByIds<DraftFields>(
        TABLES.DRAFT_PUBLICACION,
        recordIds,
        DRAFT_FIELDS
      );
    } else if (videoId) {
      const result = await airtableFetch<DraftFields>(TABLES.DRAFT_PUBLICACION, {
        filterByFormula: `FIND('${videoId}', ARRAYJOIN({Youtube 365 Full Posts}, ','))`,
        fields: DRAFT_FIELDS,
        sort: [{ field: "Name", direction: "asc" }],
      });
      records = result.records;
    } else {
      return NextResponse.json({ error: "videoId or ids required" }, { status: 400 });
    }

    // Resolve persona and expression names in parallel
    const personaIds = [...new Set(records.flatMap((r) => r.fields["Persona (from Youtube 365 Full Posts)"] || []))];
    const expresionIds = [...new Set(records.flatMap((r) => r.fields.Expresion || []))];

    const [personaRecords, expresionRecords] = await Promise.all([
      personaIds.length > 0
        ? airtableFetchByIds<{ Name?: string }>(TABLES.PERSONA, personaIds, ["Name"])
        : Promise.resolve([]),
      expresionIds.length > 0
        ? airtableFetchByIds<{ "Expresión"?: string; Muestra?: AttachmentValue[] }>(TABLES.EXPRESIONES_MINIATURAS, expresionIds, ["Expresión", "Muestra"])
        : Promise.resolve([]),
    ]);

    const personaMap = new Map(personaRecords.map((r) => [r.id, r.fields.Name || r.id]));
    const expresionMap = new Map(expresionRecords.map((r) => [r.id, {
      name: r.fields["Expresión"] || r.id,
      image: r.fields.Muestra?.[0]?.thumbnails?.large?.url || r.fields.Muestra?.[0]?.url || null,
    }]));

    return NextResponse.json(records.map((r) => mapDraft(r, personaMap, expresionMap)));

    return NextResponse.json({ error: "videoId or ids required" }, { status: 400 });
  } catch (error) {
    console.error("Draft Publicacion fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch drafts" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    // Map frontend field names to Airtable field names
    const airtableFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      const airtableField = UPDATABLE_FIELDS[key];
      if (airtableField) {
        airtableFields[airtableField] = value;
      }
    }

    if (Object.keys(airtableFields).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await airtableUpdate(TABLES.DRAFT_PUBLICACION, id, airtableFields);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Draft Publicacion update error:", error);
    return NextResponse.json({ error: "Failed to update draft" }, { status: 500 });
  }
}

function mapDraft(
  r: { id: string; createdTime: string; fields: DraftFields },
  personaMap: Map<string, string>,
  expresionMap: Map<string, { name: string; image: string | null }>,
) {
  const personaIds = r.fields["Persona (from Youtube 365 Full Posts)"] || [];
  const expresionIds = r.fields.Expresion || [];

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
    slideengine: r.fields.SlideEngine || null,
    pone_persona: r.fields["Pone Persona"] || null,
    expresion_ids: expresionIds,
    expresiones: expresionIds.map((id) => ({
      id,
      name: expresionMap.get(id)?.name || id,
      image: expresionMap.get(id)?.image || null,
    })),
    muestra_expresion_url:
      r.fields["Muestra (from Expresion)"]?.[0]?.thumbnails?.large?.url ||
      r.fields["Muestra (from Expresion)"]?.[0]?.url ||
      null,
    numero_variaciones: r.fields["Numero Variaciones"] || null,
    prompt_anadir_persona: r.fields["Prompt Anadir Persona"] || null,
    persona_lookup: personaIds,
    persona_names: personaIds.map((id) => personaMap.get(id) || id),
    archivar: r.fields.Archivar || false,
    feedback: r.fields.Feedback || null,
    notes: r.fields.Notes || null,
    video_ids: r.fields["Youtube 365 Full Posts"] || [],
    created: r.fields.Created || r.createdTime,
  };
}
