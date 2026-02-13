import { NextResponse } from "next/server";
import {
  airtableCreate,
  airtableFetch,
  TABLES,
} from "@/lib/airtable/client";
import { authenticateApiRequest } from "@/lib/auth/api-guard";

/**
 * POST /api/data/videos/create-from-idea
 *
 * Creates a new video record in Airtable "Youtube 365 Full Posts" table,
 * links it to the selected idea from Research, and calls the n8n
 * InicializaVideo webhook to initialize the video pipeline.
 *
 * Flow (replaces what Airtable Interface + Airtable Automation did):
 * 1. Fetch the idea to get its title and data
 * 2. Create record in VIDEOS table with populated fields from the idea
 * 3. Call n8n webhook: InicializaVideo?recordID=<newId>&action=InicializaVideo
 *
 * Body: { ideaId: string, accountId: string, format?: "Horizontal" | "Vertical" }
 */

const N8N_INICIALIZA_URL =
  process.env.N8N_INICIALIZA_VIDEO_URL ||
  "https://fxforaliving.app.n8n.cloud/webhook/InicializaVideo";

const N8N_AUTH_HEADER = process.env.N8N_WEBHOOK_AUTH_HEADER || "X-Api-Key";
const N8N_AUTH_VALUE = process.env.N8N_WEBHOOK_AUTH_VALUE || "";

interface IdeaFields {
  "Idea Title"?: string;
  "Research Resumen"?: string;
  "Research Evaluación"?: string;
  "YT_ VideoID"?: string;
  "YT_ChannelName"?: string;
  [key: string]: unknown;
}

export async function POST(request: Request) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { ideaId, accountId, format = "Horizontal" } = body;

    if (!ideaId || !accountId) {
      return NextResponse.json(
        { error: "Missing ideaId or accountId" },
        { status: 400 }
      );
    }

    // Step 1: Fetch the idea to get its data (title, etc.)
    const { records: ideaRecords } = await airtableFetch<IdeaFields>(
      TABLES.IDEAS,
      {
        filterByFormula: `RECORD_ID()='${ideaId}'`,
        maxRecords: 1,
      }
    );

    const ideaFields = ideaRecords[0]?.fields;
    const ideaTitle = ideaFields?.["Idea Title"] || null;

    // Step 2: Create new video record with populated fields from the idea
    const videoFields: Record<string, unknown> = {
      "💡Ideas Inspiracion": [ideaId],
      "🏢Account": [accountId],
      "Horizontal/Vertical": format,
    };

    // Populate title from idea
    if (ideaTitle) {
      videoFields["Titulo Youtube A"] = ideaTitle;
    }

    const newRecord = await airtableCreate(TABLES.VIDEOS, videoFields);

    // Step 3: Call n8n InicializaVideo webhook
    const webhookUrl = `${N8N_INICIALIZA_URL}?recordID=${encodeURIComponent(newRecord.id)}&action=InicializaVideo`;

    const headers: Record<string, string> = {};
    if (N8N_AUTH_VALUE) {
      headers[N8N_AUTH_HEADER] = N8N_AUTH_VALUE;
    }

    const webhookRes = await fetch(webhookUrl, {
      method: "GET",
      headers,
    });

    const webhookOk = webhookRes.ok;
    const webhookData = await webhookRes.json().catch(() => null);

    return NextResponse.json({
      success: true,
      videoId: newRecord.id,
      videoTitle: ideaTitle,
      videoName: (newRecord.fields as Record<string, unknown>)?.Name || null,
      webhookTriggered: webhookOk,
      webhookResponse: webhookData,
    });
  } catch (error) {
    console.error("Create video from idea error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create video" },
      { status: 500 }
    );
  }
}
