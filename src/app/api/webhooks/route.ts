import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/auth/api-guard";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://fxforaliving.app.n8n.cloud/webhook/GeneradorYoutube365Full";
const N8N_WEBHOOK_AUTH_HEADER = process.env.N8N_WEBHOOK_AUTH_HEADER || "X-Api-Key";
const N8N_WEBHOOK_AUTH_VALUE = process.env.N8N_WEBHOOK_AUTH_VALUE || "";

export async function POST(request: Request) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { action, recordId } = body;

    if (!action || !recordId) {
      return NextResponse.json(
        { error: "Missing action or recordId" },
        { status: 400 }
      );
    }

    const url = `${N8N_WEBHOOK_URL}?action=${encodeURIComponent(action)}&recordID=${encodeURIComponent(recordId)}`;

    const headers: Record<string, string> = {};
    if (N8N_WEBHOOK_AUTH_VALUE) {
      headers[N8N_WEBHOOK_AUTH_HEADER] = N8N_WEBHOOK_AUTH_VALUE;
    }

    // n8n Orchestrator webhook is configured for GET with Header Auth
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `n8n webhook failed: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({ success: true }));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
