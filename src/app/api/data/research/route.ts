import { NextRequest, NextResponse } from "next/server";
import { airtableFetch, airtableFetchByIds, TABLES } from "@/lib/airtable/client";
import { authenticateApiRequest } from "@/lib/auth/api-guard";

const RESEARCH_FIELDS = [
  "Título Investigación",
  "Fecha",
  "Status",
  "🏢Account",
  "Web_TendenciasPrincipales",
  "Web_TemasRecomendados",
  "Web_FormatosPrincipales",
  "Web_Fuentes",
  "Web_Query Investigación",
  "Web_ConclusionPerplexity",
  "Conclusion",
  "Soporte",
  "Ideas Inspiracion",
  "💡Ideas Inspiracion",
  "Finalistas💡Ideas Inspiracion",
  "Logo (from 🏢Account)",
  "Thumb (from Finalistas💡Ideas Inspiracion)",
  "Created",
];

interface ResearchFields {
  "Título Investigación"?: string;
  Fecha?: string;
  Status?: string;
  "🏢Account"?: string[];
  Web_TendenciasPrincipales?: string;
  Web_TemasRecomendados?: string;
  Web_FormatosPrincipales?: string;
  Web_Fuentes?: string;
  "Web_Query Investigación"?: string;
  Web_ConclusionPerplexity?: string;
  Conclusion?: string;
  Soporte?: string;
  "Ideas Inspiracion"?: string;
  "💡Ideas Inspiracion"?: string[];
  "Finalistas💡Ideas Inspiracion"?: string[];
  "Logo (from 🏢Account)"?: { url: string; thumbnails?: { large?: { url: string } } }[];
  "Thumb (from Finalistas💡Ideas Inspiracion)"?: { url: string; thumbnails?: { large?: { url: string } } }[];
  Created?: string;
}

// Fetch ALL fields from ideas to discover lookups (including fuentes names)
interface IdeaExpandedFields {
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const researchId = searchParams.get("id");
    const limit = parseInt(searchParams.get("limit") || "50");
    const expandIdeas = searchParams.get("expandIdeas") === "true";

    // If requesting a specific research record with expanded ideas
    if (researchId && expandIdeas) {
      return await getResearchWithIdeas(researchId);
    }

    // ALWAYS filter by account
    const filters: string[] = [];

    if (accountId) {
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

    const filterByFormula = filters.length > 0
      ? filters.length === 1 ? filters[0] : `AND(${filters.join(",")})`
      : undefined;

    const { records } = await airtableFetch<ResearchFields>(TABLES.RESEARCH, {
      filterByFormula,
      maxRecords: limit,
      sort: [{ field: "Created", direction: "desc" }],
    });

    return NextResponse.json(records.map(mapResearch));
  } catch (error) {
    console.error("Airtable research error:", error);
    return NextResponse.json(
      { error: "Failed to fetch research", details: String(error) },
      { status: 500 }
    );
  }
}

async function getResearchWithIdeas(researchId: string) {
  const { records } = await airtableFetch<ResearchFields>(TABLES.RESEARCH, {
    filterByFormula: `RECORD_ID()='${researchId}'`,
    maxRecords: 1,
  });

  if (!records[0]) {
    return NextResponse.json({ error: "Research not found" }, { status: 404 });
  }

  const research = mapResearch(records[0]);

  const finalistaIds = records[0].fields["Finalistas💡Ideas Inspiracion"] || [];
  let selectedIdeas: ReturnType<typeof mapSelectedIdea>[] = [];

  if (finalistaIds.length > 0) {
    const ideaRecords = await airtableFetchByIds<IdeaExpandedFields>(
      TABLES.IDEAS,
      finalistaIds
    );
    selectedIdeas = ideaRecords.map(mapSelectedIdea);
    selectedIdeas.sort((a, b) => (a.research_puesto || 99) - (b.research_puesto || 99));
  }

  return NextResponse.json({ ...research, selected_ideas: selectedIdeas });
}

// ─── Helpers ─────────────────────────────────────────────

function mapResearch(r: { id: string; createdTime: string; fields: ResearchFields }) {
  const f = r.fields;
  return {
    id: r.id,
    titulo: f["Título Investigación"] || null,
    fecha: f.Fecha || f.Created || r.createdTime,
    status: f.Status || null,
    account_id: f["🏢Account"]?.[0] || null,
    tendencia_hoy: f.Web_TendenciasPrincipales || null,
    temas_recomendados: f.Web_TemasRecomendados || null,
    formatos_propuestos: f.Web_FormatosPrincipales || null,
    web_fuentes: f.Web_Fuentes || null,
    web_query_investigacion: f["Web_Query Investigación"] || null,
    web_conclusion_perplexity: f.Web_ConclusionPerplexity || null,
    soporte_url: f.Soporte || null,
    ideas_inspiracion_url: f["Ideas Inspiracion"] || null,
    ideas_inspiracion_ids: f["💡Ideas Inspiracion"] || [],
    finalistas_ids: f["Finalistas💡Ideas Inspiracion"] || [],
    conclusion: f.Conclusion || null,
    logo_url:
      f["Logo (from 🏢Account)"]?.[0]?.thumbnails?.large?.url ||
      f["Logo (from 🏢Account)"]?.[0]?.url ||
      null,
    thumb_url:
      f["Thumb (from Finalistas💡Ideas Inspiracion)"]?.[0]?.thumbnails?.large?.url ||
      f["Thumb (from Finalistas💡Ideas Inspiracion)"]?.[0]?.url ||
      null,
    created: f.Created || r.createdTime,
  };
}

function getStr(f: IdeaExpandedFields, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = f[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
}

function getNum(f: IdeaExpandedFields, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = f[k];
    if (typeof v === "number") return v;
  }
  return null;
}

function getAttachmentUrl(f: IdeaExpandedFields, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = f[k];
    if (Array.isArray(v) && v.length > 0) {
      const att = v[0] as { url?: string; thumbnails?: { large?: { url?: string } } };
      return att?.thumbnails?.large?.url || att?.url || null;
    }
  }
  return null;
}

function getStrArray(f: IdeaExpandedFields, ...keys: string[]): string[] {
  for (const k of keys) {
    const v = f[k];
    if (Array.isArray(v)) return v as string[];
  }
  return [];
}

function mapSelectedIdea(r: { id: string; fields: IdeaExpandedFields }) {
  const f = r.fields;

  // Try to find Fuente name from lookup fields
  const fuenteName = getStr(f,
    "Name (from Fuentes Inspiracion)",
    "Nombre (from Fuentes Inspiracion)",
    "Fuente Inspiracion Name",
  );
  // Fall back to Fuentes Inspiracion ID if no name lookup exists
  const fuenteId = getStrArray(f, "Fuentes Inspiracion")[0] || null;

  return {
    id: r.id,
    idea_title: getStr(f, "Idea Title") || null,
    thumb_url: getAttachmentUrl(f, "Thumb"),
    research_puesto: getNum(f, "Research Puesto"),
    yt_new: getStr(f, "YT_New"),
    fuentes_inspiracion: fuenteName || fuenteId,
    fuentes_inspiracion_is_id: !fuenteName && !!fuenteId,
    logo_url: getAttachmentUrl(f, "Logo (from Fuentes Inspiracion)"),
    research_evaluacion: getStr(f, "Research Evaluación"),
    research_resumen: getStr(f, "Research Resumen"),
    yt_duration: getStr(f, "YT_ Duration"),
    yt_views_count: getNum(f, "YT_ViewsCount"),
    yt_video_id: getStr(f, "YT_ VideoID"),
    yt_channel_name: getStr(f, "YT_ChannelName"),
    // Pass all field names for debugging (only in dev)
    _debug_fields: process.env.NODE_ENV === "development" ? Object.keys(f) : undefined,
  };
}
