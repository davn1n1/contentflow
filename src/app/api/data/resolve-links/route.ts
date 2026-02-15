import { NextRequest, NextResponse } from "next/server";
import {
  airtableFetch,
  airtableFetchByIds,
  TABLES,
} from "@/lib/airtable/client";
import { authenticateApiRequest } from "@/lib/auth/api-guard";

// Tables that can be resolved (must also exist in ALLOWED_TABLES of app-data)
const LINKABLE_TABLES: Record<string, string> = {
  persona: TABLES.PERSONA,
  voicedna: TABLES.VOICEDNA,
  "avatares-set": TABLES.AVATARES_SET,
  ctas: TABLES.CTAS,
  broll: TABLES.VIDEOS_BROLL,
  "formato-diseno-slides": TABLES.FORMATO_DISENO_SLIDES,
  "estilos-musicales": TABLES.ESTILOS_MUSICALES,
  "comentario-pineado": TABLES.COMENTARIO_PINEADO,
  brands: TABLES.BRANDS,
  voices: TABLES.VOICES,
  sponsors: TABLES.SPONSORS,
};

// Primary fields to fetch and display for each table
const PRIMARY_FIELDS: Record<string, string[]> = {
  persona: ["Name"],
  voicedna: ["VoiceName"],
  "avatares-set": ["Name"],
  ctas: ["Name", "CTA/Intro"],
  broll: ["Id And Tags Summary"],
  "formato-diseno-slides": ["Formato Diseño"],
  "estilos-musicales": ["style_en", "Descripción Principal"],
  "comentario-pineado": ["Name"],
  brands: ["Name"],
  voices: ["Name"],
  sponsors: ["Name"],
};

// Image fields to fetch as thumbnail for each table
const IMAGE_FIELDS: Record<string, string> = {
  persona: "Attachments",
  "avatares-set": "Attachments (from Avatar)",
  broll: "Broll Thumb",
  "comentario-pineado": "Attachments",
  "formato-diseno-slides": "Muestra",
  "estilos-musicales": "Muestra",
  sponsors: "Logo",
};

// Which tables have 🏢Account for filtering
const TABLES_WITH_ACCOUNT = new Set([
  "persona",
  "voicedna",
  "avatares-set",
  "ctas",
  "broll",
  "comentario-pineado",
  "brands",
  "voices",
  "sponsors",
]);

interface AirtableAttachment {
  url?: string;
  thumbnails?: {
    small?: { url: string };
    large?: { url: string };
  };
}

function getPrimaryName(
  fields: Record<string, unknown>,
  primaryFields: string[]
): string {
  for (const f of primaryFields) {
    const val = fields[f];
    if (typeof val === "string" && val.length > 0) return val;
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string")
      return val[0];
  }
  // Fallback: first non-empty string field
  for (const val of Object.values(fields)) {
    if (typeof val === "string" && val.length > 0 && val.length < 200)
      return val;
  }
  return "Sin nombre";
}

function getImageUrl(
  fields: Record<string, unknown>,
  imageField: string | undefined
): string | null {
  if (!imageField) return null;
  const val = fields[imageField];
  if (!Array.isArray(val) || val.length === 0) return null;
  const first = val[0] as AirtableAttachment;
  if (typeof first !== "object" || first === null) return null;
  // Prefer small thumbnail for performance
  return (
    first.thumbnails?.small?.url ||
    first.thumbnails?.large?.url ||
    first.url ||
    null
  );
}

async function resolveAccountName(
  accountId: string
): Promise<string | null> {
  const result = await airtableFetch<{ Name?: string }>(TABLES.ACCOUNT, {
    filterByFormula: `RECORD_ID()='${accountId}'`,
    fields: ["Name"],
    maxRecords: 1,
  });
  return result.records[0]?.fields?.Name || null;
}

/**
 * GET /api/data/resolve-links
 *
 * Params:
 *   table       - Required: table key (e.g., "persona", "ctas")
 *   ids         - Resolve specific record IDs to names + images
 *   accountId   - Filter by account (required for tables with 🏢Account)
 *   filter      - Extra Airtable formula
 *   search      - Client-side text search
 *   imageField  - Override image field name (from linked-fields config)
 *   hasAccount  - "false" to skip account filtering (for global tables)
 *   detailFields - Comma-separated extra field names to include in response extras
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");
    const ids = searchParams.get("ids");
    const accountId = searchParams.get("accountId");
    const search = searchParams.get("search");
    const filter = searchParams.get("filter");
    const imageFieldOverride = searchParams.get("imageField");
    const hasAccountParam = searchParams.get("hasAccount");
    const detailFieldsParam = searchParams.get("detailFields");
    const limit = parseInt(searchParams.get("limit") || "100");

    if (!table || !LINKABLE_TABLES[table]) {
      return NextResponse.json(
        {
          error: `Invalid table: ${table}. Allowed: ${Object.keys(LINKABLE_TABLES).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const tableId = LINKABLE_TABLES[table];
    const nameFields = PRIMARY_FIELDS[table] || ["Name"];
    const imageField =
      imageFieldOverride || IMAGE_FIELDS[table] || undefined;

    // Parse detail fields to include
    const detailFieldNames = detailFieldsParam
      ? detailFieldsParam.split(",").filter(Boolean)
      : [];

    // Determine which fields to fetch
    const fetchFields = [...nameFields];
    if (imageField) fetchFields.push(imageField);
    for (const df of detailFieldNames) {
      if (!fetchFields.includes(df)) fetchFields.push(df);
    }

    // Determine if this table should be filtered by account
    const shouldFilterByAccount =
      hasAccountParam !== "false" && TABLES_WITH_ACCOUNT.has(table);

    // Helper to extract detail field values
    function getExtras(fields: Record<string, unknown>): Record<string, unknown> | undefined {
      if (detailFieldNames.length === 0) return undefined;
      const extras: Record<string, unknown> = {};
      for (const df of detailFieldNames) {
        const val = fields[df];
        if (val !== undefined && val !== null && val !== "") {
          extras[df] = val;
        }
      }
      return Object.keys(extras).length > 0 ? extras : undefined;
    }

    // Helper to map records to response format
    function mapRecord(r: { id: string; fields: Record<string, unknown> }) {
      return {
        id: r.id,
        name: getPrimaryName(r.fields, nameFields),
        image: getImageUrl(r.fields, imageField),
        ...(getExtras(r.fields) ? { extras: getExtras(r.fields) } : {}),
      };
    }

    // ── Mode 1: Resolve specific record IDs ──
    if (ids) {
      const recordIds = ids.split(",").filter(Boolean);
      if (recordIds.length === 0) return NextResponse.json([]);

      const records = await airtableFetchByIds(tableId, recordIds, fetchFields);
      return NextResponse.json(
        records.map((r) =>
          mapRecord({ id: r.id, fields: r.fields as Record<string, unknown> })
        )
      );
    }

    // ── Mode 2: List available records for dropdown ──
    let accountName: string | null = null;
    if (accountId && shouldFilterByAccount) {
      accountName = await resolveAccountName(accountId);
    }

    const conditions: string[] = [];
    if (accountName) {
      conditions.push(
        `FIND('${accountName}', ARRAYJOIN({🏢Account}, ','))`
      );
    }
    if (filter) {
      conditions.push(filter);
    }

    function buildFormula(conds: string[]): string {
      if (conds.length === 0) return "";
      return conds.length === 1 ? conds[0] : `AND(${conds.join(",")})`;
    }

    // Strategy 1: Try with full formula (account + filter)
    const formula = buildFormula(conditions);
    if (formula) {
      try {
        const { records } = await airtableFetch(tableId, {
          maxRecords: limit,
          filterByFormula: formula,
          fields: fetchFields,
        });

        let results = records.map((r) =>
          mapRecord({ id: r.id, fields: r.fields as Record<string, unknown> })
        );

        if (search) {
          const lower = search.toLowerCase();
          results = results.filter((r) =>
            r.name.toLowerCase().includes(lower)
          );
        }

        return NextResponse.json(results);
      } catch (err) {
        console.warn(
          `[resolve-links] Strategy 1 failed for ${table}:`,
          formula,
          err instanceof Error ? err.message : err
        );
      }
    }

    // Strategy 2: Try with filter only (no account), then filter account client-side
    if (filter) {
      try {
        const { records } = await airtableFetch(tableId, {
          maxRecords: limit,
          filterByFormula: filter,
          fields: fetchFields,
        });

        let results = records.map((r) =>
          mapRecord({ id: r.id, fields: r.fields as Record<string, unknown> })
        );

        if (search) {
          const lower = search.toLowerCase();
          results = results.filter((r) =>
            r.name.toLowerCase().includes(lower)
          );
        }

        return NextResponse.json(results);
      } catch (err) {
        console.warn(
          `[resolve-links] Strategy 2 failed for ${table}:`,
          filter,
          err instanceof Error ? err.message : err
        );
      }
    }

    // Strategy 3: Try account-only formula
    if (accountName) {
      try {
        const accountFormula = `FIND('${accountName}', ARRAYJOIN({🏢Account}, ','))`;
        const { records } = await airtableFetch(tableId, {
          maxRecords: limit,
          filterByFormula: accountFormula,
          fields: fetchFields,
        });

        let results = records.map((r) =>
          mapRecord({ id: r.id, fields: r.fields as Record<string, unknown> })
        );

        if (search) {
          const lower = search.toLowerCase();
          results = results.filter((r) =>
            r.name.toLowerCase().includes(lower)
          );
        }

        return NextResponse.json(results);
      } catch (err) {
        console.warn(
          `[resolve-links] Strategy 3 (account-only) failed for ${table}:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    // Strategy 4: Fetch all (no formula)
    const { records } = await airtableFetch(tableId, {
      maxRecords: limit,
      fields: fetchFields,
    });

    let results = records.map((r) =>
      mapRecord({ id: r.id, fields: r.fields as Record<string, unknown> })
    );

    if (search) {
      const lower = search.toLowerCase();
      results = results.filter((r) =>
        r.name.toLowerCase().includes(lower)
      );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Resolve links error:", error);
    return NextResponse.json(
      { error: "Failed to resolve links" },
      { status: 500 }
    );
  }
}
