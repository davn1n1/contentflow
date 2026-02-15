import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { airtableFetch, airtableUpdate, TABLES } from "@/lib/airtable/client";

const TEMPLATE_FIELDS = [
  "Name",
  "Status",
  "Render Engine",
  "Remotion Template ID",
  "Remotion Code",
  "Duration Template",
  "Formato H_V",
  "AI-Tags",
  "Tags",
  "Param_1", "Param_2", "Param_3", "Param_4", "Param_5",
  "Param_6", "Param_7", "Param_8", "Param_9", "Param_10", "Param_11",
  "Ayuda Params IA",
  "Muestra",
  "Created",
];

interface AeTemplateFields {
  Name?: string;
  Status?: string;
  "Render Engine"?: string;
  "Remotion Template ID"?: string;
  "Remotion Code"?: string;
  "Duration Template"?: number;
  "Formato H_V"?: string[];
  "AI-Tags"?: string[];
  Tags?: string[];
  [key: string]: unknown;
}

/**
 * GET /api/remotion/ae-templates
 * Fetch all Remotion templates from After Effects Templates table.
 */
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  const isApiAuth = apiKey && apiKey === process.env.API_SECRET_KEY;

  if (!isApiAuth) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await airtableFetch<AeTemplateFields>(
      TABLES.AE_TEMPLATES,
      {
        fields: TEMPLATE_FIELDS,
        filterByFormula: '{Render Engine} = "Remotion"',
        sort: [{ field: "Name", direction: "asc" }],
      }
    );

    const templates = result.records.map((r) => {
      const f = r.fields;
      const params: Array<{ slot: number; name: string }> = [];
      for (let i = 1; i <= 11; i++) {
        const name = f[`Param_${i}`] as string | undefined;
        if (name) params.push({ slot: i, name });
      }

      return {
        id: r.id,
        name: f.Name || "",
        status: f.Status || "Todo",
        templateId: f["Remotion Template ID"] || "",
        code: f["Remotion Code"] || "",
        codeLines: (f["Remotion Code"] || "").split("\n").length,
        duration: f["Duration Template"] || 4,
        format: f["Formato H_V"]?.[0] || "Vertical",
        aiTags: f["AI-Tags"] || [],
        params,
        paramsHelp: f["Ayuda Params IA"] || "",
        created: f.Created || "",
      };
    });

    return NextResponse.json({ templates });
  } catch (err) {
    console.error("[AeTemplates] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/remotion/ae-templates
 * Update a Remotion template's code and params in Airtable.
 * Body: { recordId, code?, params?, name? }
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { recordId, code, params, name } = await request.json();
    if (!recordId) {
      return NextResponse.json({ error: "recordId required" }, { status: 400 });
    }

    const fields: Record<string, unknown> = {};
    if (code !== undefined) fields["Remotion Code"] = code;
    if (name !== undefined) fields["Name"] = name;
    if (params && Array.isArray(params)) {
      // Clear all param slots first
      for (let i = 1; i <= 11; i++) {
        fields[`Param_${i}`] = "";
      }
      // Set provided params
      params.forEach((p: { slot: number; name: string }) => {
        if (p.slot >= 1 && p.slot <= 11) {
          fields[`Param_${p.slot}`] = p.name;
        }
      });
    }

    await airtableUpdate(TABLES.AE_TEMPLATES, recordId, fields);

    return NextResponse.json({ success: true, recordId });
  } catch (err) {
    console.error("[AeTemplates] Update error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}
