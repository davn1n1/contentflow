import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { airtableFetch, airtableUpdate, TABLES } from "@/lib/airtable/client";
import { TEMPLATE_META } from "@/lib/remotion/templates/template-meta";
import * as fs from "fs";
import * as path from "path";

// ─── Auth helper ───────────────────────────────────────

async function authenticate(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey && apiKey === process.env.API_SECRET_KEY) {
    return { authorized: true as const };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return { authorized: true as const };
  return { authorized: false as const };
}

// ─── POST: Sync all Remotion templates to Airtable ─────
//
// Reads TEMPLATE_META registry + source .tsx files,
// then creates or updates After Effects Templates records
// with: Render Engine, Remotion Template ID, Param_1..N,
// Remotion Code, Duration Template, AI-Tags, etc.
//
// POST /api/remotion/sync-templates
// Body: { dryRun?: boolean }

interface AeTemplateFields {
  Name?: string;
  "Render Engine"?: string;
  "Remotion Template ID"?: string;
  "Remotion Code"?: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    dryRun?: boolean;
  };
  const dryRun = body.dryRun ?? false;

  try {
    const results: Array<{
      templateId: string;
      action: "created" | "updated" | "skipped";
      recordId?: string;
      params: string[];
    }> = [];

    // 1. Fetch existing Remotion templates from Airtable
    const existing = await airtableFetch<AeTemplateFields>(
      TABLES.AE_TEMPLATES,
      {
        fields: ["Name", "Render Engine", "Remotion Template ID", "Remotion Code"],
        filterByFormula: '{Render Engine} = "Remotion"',
      }
    );

    const existingByTemplateId = new Map<string, { id: string; fields: AeTemplateFields }>();
    for (const rec of existing.records) {
      const tplId = rec.fields["Remotion Template ID"];
      if (tplId) {
        existingByTemplateId.set(tplId, { id: rec.id, fields: rec.fields });
      }
    }

    // 2. For each template in TEMPLATE_META, sync to Airtable
    for (const [templateId, meta] of Object.entries(TEMPLATE_META)) {
      // Build param names from propsMeta (content + colors only)
      const mappableProps = meta.propsMeta.filter(
        (m) => m.group === "content" || m.group === "colors"
      );

      const params: Record<string, string> = {};
      mappableProps.forEach((prop, i) => {
        if (i < 11) {
          params[`Param_${i + 1}`] = prop.key;
        }
      });

      // Read source code file
      let sourceCode = "";
      const templateFileName = templateIdToFileName(templateId);
      const templateDir = path.resolve(
        process.cwd(),
        "src/lib/remotion/templates"
      );
      const filePath = path.join(templateDir, templateFileName);

      try {
        sourceCode = fs.readFileSync(filePath, "utf-8");
      } catch {
        sourceCode = `// Source file not found: ${templateFileName}`;
      }

      // Build Airtable fields
      const airtableFields: Record<string, unknown> = {
        Name: `Remotion: ${meta.name}`,
        Status: "Activo",
        "Render Engine": "Remotion",
        "Remotion Template ID": templateId,
        "Remotion Code": sourceCode,
        "Duration Template": meta.durationInFrames / meta.fps,
        "Formato H_V": meta.height > meta.width ? ["Vertical"] : ["Horizontal"],
        "AI-Tags": meta.tags
          .map((t) => tagMapping[t])
          .filter(Boolean),
        "Ayuda Params IA": mappableProps
          .map((p) => `${p.key}: ${p.label} (${p.type})`)
          .join(". "),
        ...params,
      };

      // Clear unused param slots
      for (let i = mappableProps.length + 1; i <= 11; i++) {
        airtableFields[`Param_${i}`] = "";
      }

      const existingRecord = existingByTemplateId.get(templateId);

      if (dryRun) {
        results.push({
          templateId,
          action: existingRecord ? "updated" : "created",
          recordId: existingRecord?.id,
          params: mappableProps.map((p) => p.key),
        });
        continue;
      }

      if (existingRecord) {
        // Update existing record
        await airtableUpdate(
          TABLES.AE_TEMPLATES,
          existingRecord.id,
          airtableFields
        );
        results.push({
          templateId,
          action: "updated",
          recordId: existingRecord.id,
          params: mappableProps.map((p) => p.key),
        });
      } else {
        // Create new record
        const created = await airtableCreate(
          TABLES.AE_TEMPLATES,
          airtableFields
        );
        results.push({
          templateId,
          action: "created",
          recordId: created.id,
          params: mappableProps.map((p) => p.key),
        });
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      synced: results.length,
      results,
    });
  } catch (err) {
    console.error("[SyncTemplates] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}

// ─── Helpers ───────────────────────────────────────────

// Map template tags to Airtable AI-Tags (must match existing choices)
const tagMapping: Record<string, string> = {
  text: "Sentence",
  motion: "Kinetic",
  intro: "Hook",
  hook: "Hook",
  cta: "CTA",
  data: "Stats",
  stats: "Stats",
  "lower-third": "LowerThird",
};

// Convert template ID to filename: "text-reveal" → "TextReveal.tsx"
function templateIdToFileName(id: string): string {
  const pascal = id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return `${pascal}.tsx`;
}

// Create a single Airtable record (not in client.ts yet)
async function airtableCreate(
  tableId: string,
  fields: Record<string, unknown>
): Promise<{ id: string; fields: Record<string, unknown> }> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const pat = process.env.AIRTABLE_PAT;

  if (!baseId || !pat) {
    throw new Error("Airtable credentials not configured");
  }

  const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Airtable create failed: ${response.status} ${text}`);
  }

  return response.json();
}
