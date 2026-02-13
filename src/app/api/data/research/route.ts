import { NextRequest, NextResponse } from "next/server";
import { airtableFetch, airtableFetchByIds, TABLES } from "@/lib/airtable/client";
import { authenticateApiRequest } from "@/lib/auth/api-guard";

// Field names in Airtable Research table (tblokkoR3fWLmv5It)
// Note: These need to match exactly. If a field doesn't exist, Airtable ignores it silently.
const RESEARCH_FIELDS = [
  "Titulo Investigacion",
  "Fecha",
  "Status",
  "🏢Account",
  "Tendencia Hoy",
  "Temas Recomendados Hoy",
  "Formatos Propuestos",
  "Soporte",
  "Ideas Inspiracion",
  "💡Ideas Inspiracion",
  "Finalistas💡Ideas Inspiracion",
  "Conclusion",
  "Created",
];

interface ResearchFields {
  "Titulo Investigacion"?: string;
  Fecha?: string;
  Status?: string;
  "🏢Account"?: string[];
  "Tendencia Hoy"?: string;
  "Temas Recomendados Hoy"?: string;
  "Formatos Propuestos"?: string;
  Soporte?: string;
  "Ideas Inspiracion"?: string;
  "💡Ideas Inspiracion"?: string[];
  "Finalistas💡Ideas Inspiracion"?: string[];
  Conclusion?: string;
  Created?: string;
}

// Fields to expand from linked Idea records (for the finalistas/selected ideas)
const IDEA_EXPANDED_FIELDS = [
  "Idea Title", "Thumb", "Research Puesto", "YT_New",
  "Fuentes Inspiracion", "Logo (from Fuentes Inspiracion)",
  "Research Evaluación", "Research Resumen",
  "YT_ Duration", "YT_ViewsCount", "YT_ VideoID",
];

interface IdeaExpandedFields {
  "Idea Title"?: string;
  Thumb?: { url: string; thumbnails?: { large?: { url: string } } }[];
  "Research Puesto"?: number;
  YT_New?: string;
  "Fuentes Inspiracion"?: string[];
  "Logo (from Fuentes Inspiracion)"?: { url: string; thumbnails?: { large?: { url: string } } }[];
  "Research Evaluación"?: string;
  "Research Resumen"?: string;
  "YT_ Duration"?: string;
  YT_ViewsCount?: number;
  "YT_ VideoID"?: string;
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

    // Build filters
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
      fields: RESEARCH_FIELDS,
      filterByFormula,
      maxRecords: limit,
      sort: [{ field: "Fecha", direction: "desc" }],
    });

    return NextResponse.json(records.map(mapResearch));
  } catch (error) {
    console.error("Airtable research error:", error);
    return NextResponse.json({ error: "Failed to fetch research" }, { status: 500 });
  }
}

async function getResearchWithIdeas(researchId: string) {
  // Fetch the research record
  const { records } = await airtableFetch<ResearchFields>(TABLES.RESEARCH, {
    filterByFormula: `RECORD_ID()='${researchId}'`,
    fields: RESEARCH_FIELDS,
    maxRecords: 1,
  });

  if (!records[0]) {
    return NextResponse.json({ error: "Research not found" }, { status: 404 });
  }

  const research = mapResearch(records[0]);

  // Expand the finalist ideas
  const finalistaIds = records[0].fields["Finalistas💡Ideas Inspiracion"] || [];
  let selectedIdeas: ReturnType<typeof mapSelectedIdea>[] = [];

  if (finalistaIds.length > 0) {
    const ideaRecords = await airtableFetchByIds<IdeaExpandedFields>(
      TABLES.IDEAS,
      finalistaIds,
      IDEA_EXPANDED_FIELDS
    );
    selectedIdeas = ideaRecords.map(mapSelectedIdea);
    // Sort by Research Puesto
    selectedIdeas.sort((a, b) => (a.research_puesto || 99) - (b.research_puesto || 99));
  }

  return NextResponse.json({ ...research, selected_ideas: selectedIdeas });
}

function mapResearch(r: { id: string; createdTime: string; fields: ResearchFields }) {
  return {
    id: r.id,
    titulo: r.fields["Titulo Investigacion"] || null,
    fecha: r.fields.Fecha || r.createdTime,
    status: r.fields.Status || null,
    account_id: r.fields["🏢Account"]?.[0] || null,
    tendencia_hoy: r.fields["Tendencia Hoy"] || null,
    temas_recomendados: r.fields["Temas Recomendados Hoy"] || null,
    formatos_propuestos: r.fields["Formatos Propuestos"] || null,
    soporte_url: r.fields.Soporte || null,
    ideas_inspiracion_url: r.fields["Ideas Inspiracion"] || null,
    ideas_inspiracion_ids: r.fields["💡Ideas Inspiracion"] || [],
    finalistas_ids: r.fields["Finalistas💡Ideas Inspiracion"] || [],
    conclusion: r.fields.Conclusion || null,
    created: r.fields.Created || r.createdTime,
  };
}

function mapSelectedIdea(r: { id: string; fields: IdeaExpandedFields }) {
  return {
    id: r.id,
    idea_title: r.fields["Idea Title"] || null,
    thumb_url:
      r.fields.Thumb?.[0]?.thumbnails?.large?.url ||
      r.fields.Thumb?.[0]?.url ||
      null,
    research_puesto: r.fields["Research Puesto"] || null,
    yt_new: r.fields.YT_New || null,
    fuentes_inspiracion: r.fields["Fuentes Inspiracion"]?.[0] || null,
    logo_url:
      r.fields["Logo (from Fuentes Inspiracion)"]?.[0]?.thumbnails?.large?.url ||
      r.fields["Logo (from Fuentes Inspiracion)"]?.[0]?.url ||
      null,
    research_evaluacion: r.fields["Research Evaluación"] || null,
    research_resumen: r.fields["Research Resumen"] || null,
    yt_duration: r.fields["YT_ Duration"] || null,
    yt_views_count: r.fields.YT_ViewsCount || null,
    yt_video_id: r.fields["YT_ VideoID"] || null,
  };
}
