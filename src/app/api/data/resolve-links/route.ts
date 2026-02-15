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
};

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
 * Modes:
 *   1. ?table=ctas&ids=recXXX,recYYY         → Resolve specific IDs to names
 *   2. ?table=ctas&accountId=recZZZ           → List all available records (for dropdown)
 *   3. ?table=ctas&accountId=recZZZ&search=X  → Search available records
 *   4. ?table=ctas&accountId=recZZZ&filter=X  → Filter with extra formula
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
    const fields = PRIMARY_FIELDS[table] || ["Name"];

    // ── Mode 1: Resolve specific record IDs ──
    if (ids) {
      const recordIds = ids.split(",").filter(Boolean);
      if (recordIds.length === 0) return NextResponse.json([]);

      const records = await airtableFetchByIds(tableId, recordIds, fields);
      return NextResponse.json(
        records.map((r) => ({
          id: r.id,
          name: getPrimaryName(r.fields as Record<string, unknown>, fields),
        }))
      );
    }

    // ── Mode 2/3/4: List available records ──
    let accountName: string | null = null;
    if (accountId) {
      accountName = await resolveAccountName(accountId);
    }

    const conditions: string[] = [];
    if (accountName) {
      // Try 🏢Account first (most tables), then Account
      conditions.push(
        `OR(FIND('${accountName}', ARRAYJOIN({🏢Account}, ',')), FIND('${accountName}', ARRAYJOIN({Account}, ',')))`
      );
    }
    if (filter) {
      conditions.push(filter);
    }

    function buildFormula(conds: string[]): string {
      if (conds.length === 0) return "";
      return conds.length === 1 ? conds[0] : `AND(${conds.join(",")})`;
    }

    // Try with formula
    const formula = buildFormula(conditions);
    try {
      const { records } = await airtableFetch(tableId, {
        maxRecords: limit,
        ...(formula ? { filterByFormula: formula } : {}),
        fields,
      });

      let results = records.map((r) => ({
        id: r.id,
        name: getPrimaryName(
          r.fields as Record<string, unknown>,
          fields
        ),
      }));

      // Client-side search if needed
      if (search) {
        const lower = search.toLowerCase();
        results = results.filter((r) =>
          r.name.toLowerCase().includes(lower)
        );
      }

      return NextResponse.json(results);
    } catch (err) {
      console.warn(
        `[resolve-links] Formula failed for ${table}:`,
        formula,
        err instanceof Error ? err.message : err
      );
    }

    // Fallback: fetch without account filter
    const fallbackConditions = conditions.filter(
      (c) => !c.includes("Account")
    );
    const fallbackFormula = buildFormula(fallbackConditions);

    const { records } = await airtableFetch(tableId, {
      maxRecords: limit,
      ...(fallbackFormula ? { filterByFormula: fallbackFormula } : {}),
      fields,
    });

    let results = records.map((r) => ({
      id: r.id,
      name: getPrimaryName(
        r.fields as Record<string, unknown>,
        fields
      ),
    }));

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
