import { NextRequest, NextResponse } from "next/server";
import { airtableFetch, airtableFetchByIds, airtableUpdate, TABLES } from "@/lib/airtable/client";
import { authenticateApiRequest } from "@/lib/auth/api-guard";

const IDEA_FIELDS = [
  "Idea Title", "Status", "Tipo Idea", "Favorita",
  "Summary", "URL Fuente", "Domain", "Thumb",
  "Tags", "short/long", "Score",
  "YT_ChannelName", "YT_ViewsCount", "YT_ViewsCountK",
  "YT_CommentsCount", "YT_ Duration", "YT_ VideoID",
  "YT_ChannelSubs", "YT_PublishDateVideo",
  "Notas_IA", "Status Emoticonos", "StatusTranscript",
  "🏢Account", "Created",
  "Logo (from Fuentes Inspiracion)",
  "Fuentes Inspiracion",
  "YT_ Estructure", "Priority Level",
  "Status Start Calculado", "Contenido Coincide con Copy",
  "N. Escena (from Escenas)", "Publica Video",
  "Clasificación Escena (from Escenas)",
];

interface IdeaFields {
  "Idea Title"?: string;
  Status?: string;
  "Tipo Idea"?: string;
  Favorita?: boolean;
  Summary?: string;
  "URL Fuente"?: string;
  Domain?: string;
  Thumb?: { url: string; thumbnails?: { large?: { url: string } } }[];
  Tags?: string[];
  "short/long"?: string;
  Score?: number;
  YT_ChannelName?: string;
  YT_ViewsCount?: number;
  YT_ViewsCountK?: string;
  YT_CommentsCount?: number;
  "YT_ Duration"?: string;
  "YT_ VideoID"?: string;
  YT_ChannelSubs?: number;
  YT_PublishDateVideo?: string;
  Notas_IA?: string;
  "Status Emoticonos"?: string;
  "🏢Account"?: string[];
  Created?: string;
  "Logo (from Fuentes Inspiracion)"?: { url: string; thumbnails?: { large?: { url: string } } }[];
  StatusTranscript?: string;
  "Fuentes Inspiracion"?: string[];
  "YT_ Estructure"?: string;
  "Priority Level"?: string;
  "Status Start Calculado"?: string;
  "Contenido Coincide con Copy"?: string;
  "N. Escena (from Escenas)"?: string[];
  "Publica Video"?: string;
  "Clasificación Escena (from Escenas)"?: string[];
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const ideaId = searchParams.get("id");
    const accountId = searchParams.get("accountId");
    const status = searchParams.get("status");
    const tipoIdea = searchParams.get("tipoIdea");
    const search = searchParams.get("search");
    const favorita = searchParams.get("favorita");
    const limit = parseInt(searchParams.get("limit") || "100");

    // Fetch multiple ideas by IDs
    const ids = searchParams.get("ids");
    if (ids) {
      const recordIds = ids.split(",").filter(Boolean);
      const records = await airtableFetchByIds<IdeaFields>(
        TABLES.IDEAS,
        recordIds,
        IDEA_FIELDS
      );
      return NextResponse.json(records.map(mapIdea));
    }

    // Fetch single idea by ID
    if (ideaId) {
      const { records } = await airtableFetch<IdeaFields>(TABLES.IDEAS, {
        filterByFormula: `RECORD_ID()='${ideaId}'`,
        fields: IDEA_FIELDS,
        maxRecords: 1,
      });
      if (!records[0]) {
        return NextResponse.json({ error: "Idea not found" }, { status: 404 });
      }
      return NextResponse.json(mapIdea(records[0]));
    }

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
    if (status) {
      filters.push(`{Status} = '${status}'`);
    }
    if (tipoIdea) {
      filters.push(`{Tipo Idea} = '${tipoIdea}'`);
    }
    if (search) {
      filters.push(`OR(FIND(LOWER('${search}'), LOWER({Idea Title})), FIND(LOWER('${search}'), LOWER({Summary})))`);
    }
    if (favorita === "true") {
      filters.push(`{Favorita} = TRUE()`);
    }
    // Always filter Long format (horizontal YouTube)
    filters.push(`{short/long} = 'Long'`);

    const filterByFormula = filters.length > 0
      ? filters.length === 1 ? filters[0] : `AND(${filters.join(",")})`
      : undefined;

    const { records } = await airtableFetch<IdeaFields>(TABLES.IDEAS, {
      fields: IDEA_FIELDS,
      filterByFormula,
      maxRecords: limit,
      sort: [
        { field: "YT_PublishDateVideo", direction: "desc" },
        { field: "Created", direction: "desc" },
      ],
    });

    return NextResponse.json(records.map(mapIdea));
  } catch (error) {
    console.error("Airtable ideas error:", error);
    return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 });
  }
}

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

    const updated = await airtableUpdate<IdeaFields>(TABLES.IDEAS, id, fields);
    return NextResponse.json({ id: updated.id, ok: true });
  } catch (error) {
    console.error("Airtable idea update error:", error);
    return NextResponse.json({ error: "Failed to update idea" }, { status: 500 });
  }
}

function mapIdea(r: { id: string; createdTime: string; fields: IdeaFields }) {
  return {
    id: r.id,
    idea_title: r.fields["Idea Title"] || null,
    status: r.fields.Status || null,
    tipo_idea: r.fields["Tipo Idea"] || null,
    favorita: r.fields.Favorita || false,
    summary: r.fields.Summary || null,
    url_fuente: r.fields["URL Fuente"] || null,
    domain: r.fields.Domain || null,
    thumb_url:
      r.fields.Thumb?.[0]?.thumbnails?.large?.url ||
      r.fields.Thumb?.[0]?.url ||
      r.fields["Logo (from Fuentes Inspiracion)"]?.[0]?.thumbnails?.large?.url ||
      (r.fields["YT_ VideoID"] ? `https://img.youtube.com/vi/${r.fields["YT_ VideoID"]}/mqdefault.jpg` : null),
    tags: r.fields.Tags || null,
    short_long: r.fields["short/long"] || null,
    score: r.fields.Score || null,
    yt_channel_name: r.fields.YT_ChannelName || null,
    yt_views_count: r.fields.YT_ViewsCount || null,
    yt_views_count_k: r.fields.YT_ViewsCountK || null,
    yt_comments_count: r.fields.YT_CommentsCount || null,
    yt_duration: r.fields["YT_ Duration"] || null,
    yt_video_id: r.fields["YT_ VideoID"] || null,
    yt_channel_subs: r.fields.YT_ChannelSubs || null,
    yt_publish_date: r.fields.YT_PublishDateVideo || null,
    notas_ia: r.fields.Notas_IA || null,
    status_emoticonos: r.fields["Status Emoticonos"] || null,
    created: r.fields.Created || r.createdTime,
    account_id: r.fields["🏢Account"]?.[0] || null,
    status_transcript: r.fields.StatusTranscript || null,
    fuentes_inspiracion_ids: r.fields["Fuentes Inspiracion"] || [],
    yt_estructure: r.fields["YT_ Estructure"] || null,
    priority_level: r.fields["Priority Level"] || null,
    status_start_calculado: r.fields["Status Start Calculado"] || null,
    contenido_coincide_copy: (r.fields["Contenido Coincide con Copy"] || "").trim() === "✅",
    n_escena: r.fields["N. Escena (from Escenas)"]?.[0] || null,
    publica_video: r.fields["Publica Video"] || null,
    clasificacion_escena: r.fields["Clasificación Escena (from Escenas)"]?.[0] || null,
  };
}
