import { NextRequest, NextResponse } from "next/server";
import { airtableFetchByIds, TABLES } from "@/lib/airtable/client";
import { authenticateApiRequest } from "@/lib/auth/api-guard";

const RENDER_FIELDS = [
  "N Render", "Status", "Slide", "Start", "End",
  "Duration Total Escena", "Actual Duration", "Activa",
  "URL S3 Plainly", "URL Slide S3", "RenderVideo",
  "ShotstackID", "ShotstackURL", "Status Timeline",
  "Feedback Render", "Estado Render", "Copy_ES",
  "After Effects Templates", "Estilo (from After Effects Templates)",
  "Muestra (From After Effects Template)",
];

interface RenderFields {
  "N Render"?: number;
  Status?: string;
  Slide?: unknown;
  Start?: number;
  End?: number;
  "Duration Total Escena"?: number;
  "Actual Duration"?: number;
  Activa?: boolean;
  "URL S3 Plainly"?: string;
  "URL Slide S3"?: string;
  RenderVideo?: string;
  ShotstackID?: string;
  ShotstackURL?: string;
  "Status Timeline"?: string;
  "Feedback Render"?: string;
  "Estado Render"?: string;
  Copy_ES?: string;
  "After Effects Templates"?: string[];
  "Estilo (from After Effects Templates)"?: string[];
  "Muestra (From After Effects Template)"?: unknown[];
}

// Extract URL from an Airtable attachment value (array of {url, thumbnails, ...})
function extractAttachmentUrl(val: unknown): string | null {
  if (Array.isArray(val) && val.length > 0) {
    const first = val[0];
    if (typeof first === "object" && first !== null && "url" in first) {
      return (first as Record<string, unknown>).thumbnails
        ? ((first as Record<string, Record<string, Record<string, string>>>).thumbnails?.large?.url || (first as Record<string, string>).url || null)
        : (first as Record<string, string>).url || null;
    }
    // Lookup fields may return plain URLs
    if (typeof first === "string" && first.startsWith("http")) return first;
  }
  if (typeof val === "string" && val.startsWith("http")) return val;
  return null;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids");

    if (!ids) {
      return NextResponse.json({ error: "ids parameter required" }, { status: 400 });
    }

    const recordIds = ids.split(",").filter(Boolean);
    const records = await airtableFetchByIds<RenderFields>(
      TABLES.AE_RENDERS,
      recordIds,
      RENDER_FIELDS
    );

    const renders = records
      .map((r) => ({
        id: r.id,
        account_id: null,
        n_render: r.fields["N Render"] || 0,
        status: r.fields.Status || null,
        slide: extractAttachmentUrl(r.fields.Slide),
        start: r.fields.Start || null,
        end: r.fields.End || null,
        duration_total_escena: r.fields["Duration Total Escena"] || null,
        actual_duration: r.fields["Actual Duration"] || null,
        activa: r.fields.Activa || false,
        url_s3_plainly: r.fields["URL S3 Plainly"] || null,
        url_slide_s3: r.fields["URL Slide S3"] || null,
        rendervideo: r.fields.RenderVideo || null,
        shotstackid: r.fields.ShotstackID || null,
        shotstackurl: r.fields.ShotstackURL || null,
        status_timeline: r.fields["Status Timeline"] || null,
        feedback_render: r.fields["Feedback Render"] || null,
        estado_render: r.fields["Estado Render"] || null,
        copy_es: r.fields.Copy_ES || null,
        ae_template_ids: r.fields["After Effects Templates"] || [],
        ae_template_estilo: Array.isArray(r.fields["Estilo (from After Effects Templates)"])
          ? r.fields["Estilo (from After Effects Templates)"]
          : [],
        muestra_ae: extractAttachmentUrl(r.fields["Muestra (From After Effects Template)"]),
      }))
      .sort((a, b) => a.n_render - b.n_render);

    return NextResponse.json(renders);
  } catch (error) {
    console.error("Airtable renders error:", error);
    return NextResponse.json({ error: "Failed to fetch renders" }, { status: 500 });
  }
}
