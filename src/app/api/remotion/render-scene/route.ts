import { NextRequest, NextResponse } from "next/server";
import {
  renderMediaOnLambda,
  getRenderProgress,
} from "@remotion/lambda/client";
import { createClient } from "@/lib/supabase/server";
import {
  airtableFetchByIds,
  airtableUpdate,
  TABLES,
} from "@/lib/airtable/client";
import { airtableParamsToRemotionProps } from "@/lib/remotion/param-mapper";
import { TEMPLATES } from "@/lib/remotion/templates";

export const maxDuration = 120;

const AWS_REGION = process.env.REMOTION_AWS_REGION as
  | "eu-central-1"
  | "us-east-1"
  | "eu-west-1";

// ─── Auth helper ───────────────────────────────────────

async function authenticate(request: NextRequest) {
  // Check X-Api-Key for n8n
  const apiKey = request.headers.get("x-api-key");
  if (apiKey && apiKey === process.env.API_SECRET_KEY) {
    return { authorized: true as const };
  }

  // Check Supabase session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    return { authorized: true as const };
  }

  return { authorized: false as const };
}

// ─── AE Render + Template fields ───────────────────────

const AE_RENDER_FIELDS = [
  "After Effects Templates",
  "Param_1_value", "Param_2_value", "Param_3_value", "Param_4_value",
  "Param_5_value", "Param_6_value", "Param_7_value", "Param_8_value",
  "Param_9_value", "Param_10_value", "Param_11_value",
  "Render Engine (from After Effects Templates)",
  "Remotion Template ID (from After Effects Templates)",
];

const AE_TEMPLATE_FIELDS = [
  "Render Engine", "Remotion Template ID",
  "Param_1", "Param_2", "Param_3", "Param_4", "Param_5",
  "Param_6", "Param_7", "Param_8", "Param_9", "Param_10", "Param_11",
  "Duration Template", "Formato H_V",
];

interface AeRenderFields {
  "After Effects Templates"?: string[];
  "Param_1_value"?: string;
  "Param_2_value"?: string;
  "Param_3_value"?: string;
  "Param_4_value"?: string;
  "Param_5_value"?: string;
  "Param_6_value"?: string;
  "Param_7_value"?: string;
  "Param_8_value"?: string;
  "Param_9_value"?: string;
  "Param_10_value"?: string;
  "Param_11_value"?: string;
  "Render Engine (from After Effects Templates)"?: string[];
  "Remotion Template ID (from After Effects Templates)"?: string[];
}

interface AeTemplateFields {
  "Render Engine"?: string;
  "Remotion Template ID"?: string;
  "Param_1"?: string;
  "Param_2"?: string;
  "Param_3"?: string;
  "Param_4"?: string;
  "Param_5"?: string;
  "Param_6"?: string;
  "Param_7"?: string;
  "Param_8"?: string;
  "Param_9"?: string;
  "Param_10"?: string;
  "Param_11"?: string;
  "Duration Template"?: number;
  "Formato H_V"?: string[];
}

// ─── POST: Launch render ───────────────────────────────

/**
 * POST /api/remotion/render-scene
 *
 * Renders a single AE Render scene via Remotion Lambda.
 * Body: { aeRenderRecordId: string }
 * Returns: { renderId, bucketName, templateId, composition }
 */
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const functionName = process.env.REMOTION_FUNCTION_NAME;
  const serveUrl = process.env.REMOTION_SERVE_URL;

  if (!functionName || !serveUrl || functionName === "PENDIENTE_DEPLOY") {
    return NextResponse.json(
      { error: "Lambda not configured. Deploy with: npx remotion lambda functions deploy" },
      { status: 503 }
    );
  }

  try {
    const { aeRenderRecordId } = (await request.json()) as {
      aeRenderRecordId: string;
    };

    if (!aeRenderRecordId) {
      return NextResponse.json(
        { error: "aeRenderRecordId is required" },
        { status: 400 }
      );
    }

    // 1. Fetch AE Render record
    const renderRecords = await airtableFetchByIds<AeRenderFields>(
      TABLES.AE_RENDERS,
      [aeRenderRecordId],
      AE_RENDER_FIELDS
    );

    if (renderRecords.length === 0) {
      return NextResponse.json(
        { error: "AE Render record not found" },
        { status: 404 }
      );
    }

    const renderRecord = renderRecords[0];
    const fields = renderRecord.fields;

    // Get Remotion Template ID (from lookup or fetch template directly)
    let remotionTemplateId =
      fields["Remotion Template ID (from After Effects Templates)"]?.[0];

    // Get param names from the linked template
    const templateRecordIds = fields["After Effects Templates"];
    if (!templateRecordIds?.length) {
      return NextResponse.json(
        { error: "AE Render has no linked After Effects Template" },
        { status: 400 }
      );
    }

    // 2. Fetch the linked After Effects Template for param names
    const templateRecords = await airtableFetchByIds<AeTemplateFields>(
      "tblLEkwWRBR9H7UDy", // After Effects Templates table
      [templateRecordIds[0]],
      AE_TEMPLATE_FIELDS
    );

    if (templateRecords.length === 0) {
      return NextResponse.json(
        { error: "Linked After Effects Template not found" },
        { status: 404 }
      );
    }

    const tplFields = templateRecords[0].fields;

    // Use template's Remotion ID if lookup didn't work
    if (!remotionTemplateId) {
      remotionTemplateId = tplFields["Remotion Template ID"];
    }

    if (!remotionTemplateId) {
      return NextResponse.json(
        { error: "Template has no Remotion Template ID configured" },
        { status: 400 }
      );
    }

    // Verify template exists in registry
    const tpl = TEMPLATES[remotionTemplateId];
    if (!tpl) {
      return NextResponse.json(
        { error: `Remotion template "${remotionTemplateId}" not found in registry` },
        { status: 400 }
      );
    }

    // 3. Build param names and values arrays
    const paramNames: (string | null)[] = [];
    const paramValues: (string | null)[] = [];
    for (let i = 1; i <= 11; i++) {
      paramNames.push(
        (tplFields[`Param_${i}` as keyof AeTemplateFields] as string) || null
      );
      paramValues.push(
        (fields[`Param_${i}_value` as keyof AeRenderFields] as string) || null
      );
    }

    // 4. Convert to Remotion props
    const remotionProps = airtableParamsToRemotionProps(
      remotionTemplateId,
      paramNames,
      paramValues
    );

    const composition = `Template-${remotionTemplateId}`;

    console.log(
      `[RenderScene] Launching: template=${remotionTemplateId}, ` +
      `composition=${composition}, aeRender=${aeRenderRecordId}`
    );

    // 5. Launch Lambda render
    // Short templates (3-5s) → single chunk for fast render
    const { renderId, bucketName } = await renderMediaOnLambda({
      region: AWS_REGION,
      functionName,
      serveUrl,
      composition,
      inputProps: remotionProps,
      codec: "h264",
      crf: 18,
      framesPerLambda: tpl.durationInFrames, // Single chunk for short templates
      maxRetries: 1,
      privacy: "public",
      timeoutInMilliseconds: 60000,
    });

    console.log(
      `[RenderScene] Launched: renderId=${renderId}, ` +
      `template=${remotionTemplateId}, frames=${tpl.durationInFrames}`
    );

    return NextResponse.json({
      renderId,
      bucketName,
      templateId: remotionTemplateId,
      composition,
      aeRenderRecordId,
    });
  } catch (err) {
    console.error("[RenderScene] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Render scene failed" },
      { status: 500 }
    );
  }
}

// ─── GET: Poll progress + auto-save ────────────────────

/**
 * GET /api/remotion/render-scene?renderId=X&bucketName=Y&aeRenderRecordId=Z
 *
 * Checks render progress. On completion, writes URL to Airtable.
 * Returns: { done, progress?, url?, failed?, error? }
 */
export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const functionName = process.env.REMOTION_FUNCTION_NAME;
  if (!functionName || functionName === "PENDIENTE_DEPLOY") {
    return NextResponse.json(
      { error: "Lambda not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const renderId = searchParams.get("renderId");
  const bucketName = searchParams.get("bucketName");
  const aeRenderRecordId = searchParams.get("aeRenderRecordId");

  if (!renderId || !bucketName) {
    return NextResponse.json(
      { error: "Missing renderId or bucketName" },
      { status: 400 }
    );
  }

  try {
    const progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName,
      region: AWS_REGION,
    });

    if (progress.fatalErrorEncountered) {
      const errorMsg =
        progress.errors?.[0]?.message?.slice(0, 300) ?? "Unknown render error";

      return NextResponse.json({
        done: false,
        failed: true,
        error: errorMsg,
      });
    }

    if (progress.done && progress.outputFile) {
      // Auto-save URL to Airtable AE Renders record
      if (aeRenderRecordId) {
        try {
          await airtableUpdate(TABLES.AE_RENDERS, aeRenderRecordId, {
            "URL S3 Remotion": progress.outputFile,
          });
          console.log(
            `[RenderScene] Saved URL to AE Render ${aeRenderRecordId}: ${progress.outputFile}`
          );
        } catch (airtableErr) {
          console.error(
            `[RenderScene] Failed to save URL to Airtable:`,
            airtableErr
          );
          // Don't fail the response — the render succeeded
        }
      }

      return NextResponse.json({
        done: true,
        url: progress.outputFile,
        size: progress.outputSizeInBytes,
      });
    }

    return NextResponse.json({
      done: false,
      progress: progress.overallProgress,
    });
  } catch (err) {
    console.error("[RenderScene] Progress error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Progress check failed" },
      { status: 500 }
    );
  }
}
