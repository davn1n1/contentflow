import { NextRequest, NextResponse } from "next/server";
import { airtableFetch, airtableFetchByIds, airtableUpdate, TABLES } from "@/lib/airtable/client";
import { authenticateApiRequest } from "@/lib/auth/api-guard";

// Allowed table keys for App Data (prevents arbitrary table access)
const ALLOWED_TABLES: Record<string, string> = {
  avatares: TABLES.AVATARES,
  "avatares-set": TABLES.AVATARES_SET,
  persona: TABLES.PERSONA,
  ctas: TABLES.CTAS,
  broll: TABLES.VIDEOS_BROLL,
  voices: TABLES.VOICES,
  fuentes: TABLES.FUENTES_INSPIRACION,
  voicedna: TABLES.VOICEDNA,
  "voicedna-sources": TABLES.VOICEDNA_SOURCES,
  audiencia: TABLES.AUDIENCIA,
  guardarails: TABLES.GUARDARAILS,
  "comentario-pineado": TABLES.COMENTARIO_PINEADO,
  sponsors: TABLES.SPONSORS,
  brands: TABLES.BRANDS,
  "identidad-visual": TABLES.IDENTIDAD_VISUAL,
  "social-profiles": TABLES.SOCIAL_PROFILES,
  "default-settings": TABLES.ACCOUNT_SETTINGS,
  campanas: TABLES.CAMPANAS,
  expresiones: TABLES.EXPRESIONES_MINIATURAS,
  "montaje-video": TABLES.MONTAJE_VIDEO,
  "formato-diseno-slides": TABLES.FORMATO_DISENO_SLIDES,
  "estilos-musicales": TABLES.ESTILOS_MUSICALES,
};

// Resolve account name from record ID (cached per request)
async function resolveAccountName(accountId: string): Promise<string | null> {
  const result = await airtableFetch<{ Name?: string }>(TABLES.ACCOUNT, {
    filterByFormula: `RECORD_ID()='${accountId}'`,
    fields: ["Name"],
    maxRecords: 1,
  });
  return result.records[0]?.fields?.Name || null;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");
    const accountId = searchParams.get("accountId");
    const recordId = searchParams.get("id");
    const recordIds = searchParams.get("ids");
    const search = searchParams.get("search");
    const filter = searchParams.get("filter"); // Extra Airtable formula condition
    const limit = parseInt(searchParams.get("limit") || "200");

    if (!table || !ALLOWED_TABLES[table]) {
      return NextResponse.json(
        { error: `Invalid table: ${table}. Allowed: ${Object.keys(ALLOWED_TABLES).join(", ")}` },
        { status: 400 }
      );
    }

    const tableId = ALLOWED_TABLES[table];

    // Fetch single record by ID
    if (recordId) {
      const { records } = await airtableFetch(tableId, {
        filterByFormula: `RECORD_ID()='${recordId}'`,
        maxRecords: 1,
      });
      if (records.length === 0) {
        return NextResponse.json({ error: "Record not found" }, { status: 404 });
      }
      return NextResponse.json({
        id: records[0].id,
        createdTime: records[0].createdTime,
        ...records[0].fields,
      });
    }

    // Fetch multiple records by IDs
    if (recordIds) {
      const ids = recordIds.split(",").filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json([]);
      }
      const records = await airtableFetchByIds(tableId, ids);
      return NextResponse.json(
        records.map((r) => ({
          id: r.id,
          createdTime: r.createdTime,
          ...r.fields,
        }))
      );
    }

    // Resolve account name for filtering
    let accountName: string | null = null;
    if (accountId) {
      accountName = await resolveAccountName(accountId);
    }

    // ── Build Airtable formula ──
    // Structural filters (account + custom filter) are reliable.
    // Search is fragile (field name may vary), so we try it in formula
    // and fall back to client-side if it fails.

    const baseConditions: string[] = [];

    if (accountName) {
      baseConditions.push(`FIND('${accountName}', ARRAYJOIN({🏢Account}, ','))`);
    }
    if (filter) {
      baseConditions.push(filter);
    }

    function buildFormula(conditions: string[]): string {
      if (conditions.length === 0) return "";
      return conditions.length === 1 ? conditions[0] : `AND(${conditions.join(",")})`;
    }

    // Client-side search: match against all string values in the record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function clientSearch<T extends Record<string, any>>(data: T[], term: string): T[] {
      const lower = term.toLowerCase();
      return data.filter((r) =>
        Object.values(r).some(
          (v) => typeof v === "string" && v.toLowerCase().includes(lower)
        )
      );
    }

    // Strategy 1: Try base filters + search in formula
    if (baseConditions.length > 0 || search) {
      const allConditions = [...baseConditions];
      if (search) {
        allConditions.push(`FIND(LOWER('${search}'), LOWER({Name} & ''))`);
      }
      const formula = buildFormula(allConditions);
      if (formula) {
        try {
          const { records } = await airtableFetch(tableId, { maxRecords: limit, filterByFormula: formula });
          return NextResponse.json(records.map((r) => ({ id: r.id, createdTime: r.createdTime, ...r.fields })));
        } catch (err) {
          console.warn(`[app-data] Strategy 1 failed for ${table}:`, formula, err instanceof Error ? err.message : err);
        }
      }
    }

    // Strategy 2: Try base filters only (without search), apply search client-side
    if (baseConditions.length > 0) {
      const formula = buildFormula(baseConditions);
      try {
        const { records } = await airtableFetch(tableId, { maxRecords: limit, filterByFormula: formula });
        let data = records.map((r) => ({ id: r.id, createdTime: r.createdTime, ...r.fields }));
        if (search) data = clientSearch(data, search);
        return NextResponse.json(data);
      } catch (err) {
        console.warn(`[app-data] Strategy 2 failed for ${table}:`, formula, err instanceof Error ? err.message : err);
      }
    }

    // Strategy 3: Try filter only (without account), apply account + search client-side
    if (filter) {
      try {
        const { records } = await airtableFetch(tableId, { maxRecords: limit, filterByFormula: filter });
        let data = records.map((r) => ({ id: r.id, createdTime: r.createdTime, ...r.fields }));
        if (search) data = clientSearch(data, search);
        return NextResponse.json(data);
      } catch (err) {
        console.warn(`[app-data] Strategy 3 (filter-only) failed for ${table}:`, filter, err instanceof Error ? err.message : err);
      }
    }

    // Strategy 4: Fetch all, filter client-side
    const { records } = await airtableFetch(tableId, { maxRecords: limit });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: Record<string, any>[] = records.map((r) => ({ id: r.id, createdTime: r.createdTime, ...r.fields }));

    // Client-side account filter
    if (accountName || accountId) {
      const filtered = data.filter((r) => {
        for (const [key, val] of Object.entries(r)) {
          if (!key.toLowerCase().includes("account")) continue;
          if (Array.isArray(val) && val.some((v) => String(v) === accountName || String(v) === accountId)) return true;
          if (typeof val === "string" && (val === accountName || val === accountId)) return true;
        }
        return false;
      });
      if (filtered.length > 0) data = filtered;
    }

    // Client-side custom filter (CTA/Intro field)
    if (filter) {
      // Parse simple equality filters like "{Field}='Value'" or "OR({Field}='A',{Field}='B')"
      const eqMatches = [...filter.matchAll(/\{([^}]+)\}='([^']+)'/g)];
      if (eqMatches.length > 0) {
        const fieldName = eqMatches[0][1];
        const allowedValues = eqMatches.map((m) => m[2]);
        const filtered = data.filter((r) => {
          const val = r[fieldName];
          if (typeof val === "string") return allowedValues.includes(val);
          if (Array.isArray(val)) return val.some((v) => allowedValues.includes(String(v)));
          return false;
        });
        data = filtered;
      }
    }

    // Client-side search
    if (search) data = clientSearch(data, search);

    return NextResponse.json(data);
  } catch (error) {
    console.error("App Data fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch app data" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { table, recordId, fields } = body;

    if (!table || !ALLOWED_TABLES[table]) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }
    if (!recordId) {
      return NextResponse.json({ error: "recordId required" }, { status: 400 });
    }
    if (!fields || typeof fields !== "object") {
      return NextResponse.json({ error: "fields required" }, { status: 400 });
    }

    const tableId = ALLOWED_TABLES[table];
    const updated = await airtableUpdate(tableId, recordId, fields);

    return NextResponse.json({
      id: updated.id,
      createdTime: updated.createdTime,
      ...updated.fields,
    });
  } catch (error) {
    console.error("App Data update error:", error);
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
  }
}
