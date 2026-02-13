import { NextRequest, NextResponse } from "next/server";
import { airtableFetchByIds, TABLES } from "@/lib/airtable/client";
import { authenticateApiRequest } from "@/lib/auth/api-guard";

const RENDER_FIELDS = [
  "N Render", "Status", "Slide", "Start", "End",
  "Duration Total Escena", "Activa", "URL S3 Plainly",
  "URL Slide S3", "RenderVideo", "ShotstackID",
  "ShotstackURL", "Status Timeline", "Feedback Render",
];

interface RenderFields {
  "N Render"?: number;
  Status?: string;
  Slide?: string;
  Start?: number;
  End?: number;
  "Duration Total Escena"?: number;
  Activa?: boolean;
  "URL S3 Plainly"?: string;
  "URL Slide S3"?: string;
  RenderVideo?: string;
  ShotstackID?: string;
  ShotstackURL?: string;
  "Status Timeline"?: string;
  "Feedback Render"?: string;
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
        slide: r.fields.Slide || null,
        start: r.fields.Start || null,
        end: r.fields.End || null,
        duration_total_escena: r.fields["Duration Total Escena"] || null,
        activa: r.fields.Activa || false,
        url_s3_plainly: r.fields["URL S3 Plainly"] || null,
        url_slide_s3: r.fields["URL Slide S3"] || null,
        rendervideo: r.fields.RenderVideo || null,
        shotstackid: r.fields.ShotstackID || null,
        shotstackurl: r.fields.ShotstackURL || null,
        status_timeline: r.fields["Status Timeline"] || null,
        feedback_render: r.fields["Feedback Render"] || null,
      }))
      .sort((a, b) => a.n_render - b.n_render);

    return NextResponse.json(renders);
  } catch (error) {
    console.error("Airtable renders error:", error);
    return NextResponse.json({ error: "Failed to fetch renders" }, { status: 500 });
  }
}
