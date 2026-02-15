import { NextResponse } from "next/server";
import { airtableCreate, TABLES } from "@/lib/airtable/client";
import { authenticateApiRequest } from "@/lib/auth/api-guard";

/**
 * POST /api/data/montaje-video/create
 *
 * Creates a new montaje-video record in Airtable, then triggers the
 * InicializaVideo n8n webhook so account defaults (VoiceDNA, Avatar, etc.)
 * get populated automatically.
 *
 * Body: { name: string, elevenLabsText?: string, format?: string, accountId: string }
 */

const N8N_INICIALIZA_URL =
  process.env.N8N_INICIALIZA_VIDEO_URL ||
  "https://fxforaliving.app.n8n.cloud/webhook/InicializaVideo";

const N8N_AUTH_HEADER = process.env.N8N_WEBHOOK_AUTH_HEADER || "X-Api-Key";
const N8N_AUTH_VALUE = process.env.N8N_WEBHOOK_AUTH_VALUE || "";

export async function POST(request: Request) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { name, elevenLabsText, format = "Horizontal", accountId } = body;

    if (!name || !accountId) {
      return NextResponse.json(
        { error: "Missing name or accountId" },
        { status: 400 }
      );
    }

    // Create record in Montaje Video table
    const fields: Record<string, unknown> = {
      Name: name,
      "🏢Account": [accountId],
      "Horizontal/Vertical": format,
    };

    if (elevenLabsText) {
      fields["ElevenLabs Text"] = elevenLabsText;
    }

    const newRecord = await airtableCreate(TABLES.MONTAJE_VIDEO, fields);

    // Trigger InicializaVideo webhook
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
      recordId: newRecord.id,
      name: (newRecord.fields as Record<string, unknown>)?.Name || name,
      webhookTriggered: webhookOk,
      webhookResponse: webhookData,
    });
  } catch (error) {
    console.error("Create montaje-video error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create record" },
      { status: 500 }
    );
  }
}
