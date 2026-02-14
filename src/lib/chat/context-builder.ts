import { airtableFetch, TABLES } from "@/lib/airtable/client";

export interface EnrichedContext {
  account: {
    name: string;
    industry: string | null;
    youtubeChannel: string | null;
    status: string | null;
  } | null;
  persona: string | null;
  voices: string[];
  recentVideos: Array<{
    number: number;
    name: string;
    estado: string;
    pipeline: { copy: string; audio: string; video: string; render: string };
  }>;
}

/**
 * Fetch enriched context about the user's account for the system prompt.
 * All fetches run in parallel for minimum latency.
 *
 * @param accountId - Airtable record ID of the active account
 * @param userAccountIds - All account record IDs the user can access
 * @param userAccountNames - Resolved account names (for ARRAYJOIN filters)
 */
export async function buildEnrichedContext(
  accountId: string | undefined,
  userAccountIds: string[],
  userAccountNames: string[] = []
): Promise<EnrichedContext> {
  const targetAccountId = accountId || userAccountIds[0];

  if (!targetAccountId) {
    return { account: null, persona: null, voices: [], recentVideos: [] };
  }

  // Resolve the target account's name for linked-record filters.
  // ARRAYJOIN({🏢Account}) returns display names, not record IDs.
  let targetAccountName = "";
  const idx = userAccountIds.indexOf(targetAccountId);
  if (idx >= 0 && userAccountNames[idx]) {
    targetAccountName = userAccountNames[idx];
  }

  // If we don't have the name, fetch it
  if (!targetAccountName) {
    try {
      const { records } = await airtableFetch(TABLES.ACCOUNT, {
        filterByFormula: `RECORD_ID()='${targetAccountId}'`,
        fields: ["Name"],
        maxRecords: 1,
      });
      targetAccountName = (records[0]?.fields as Record<string, unknown>)?.["Name"] as string || "";
    } catch {
      // continue without name — filters will be empty
    }
  }

  if (!targetAccountName) {
    return { account: null, persona: null, voices: [], recentVideos: [] };
  }

  const accountFilter = `FIND('${targetAccountName}', ARRAYJOIN({🏢Account}, ','))`;

  const [account, persona, voices, recentVideos] = await Promise.all([
    fetchAccount(targetAccountId),
    fetchPersona(accountFilter),
    fetchVoices(accountFilter),
    fetchRecentVideos(accountFilter),
  ]);

  return { account, persona, voices, recentVideos };
}

async function fetchAccount(accountId: string) {
  try {
    const { records } = await airtableFetch(TABLES.ACCOUNT, {
      filterByFormula: `RECORD_ID()='${accountId}'`,
      fields: ["Name", "Status", "Industry", "Canal YouTube"],
      maxRecords: 1,
    });
    if (records.length === 0) return null;
    const f = records[0].fields as Record<string, unknown>;
    return {
      name: (f["Name"] as string) || "",
      industry: (f["Industry"] as string) || null,
      youtubeChannel: (f["Canal YouTube"] as string) || null,
      status: (f["Status"] as string) || null,
    };
  } catch {
    return null;
  }
}

async function fetchPersona(accountFilter: string) {
  try {
    const { records } = await airtableFetch(TABLES.PERSONA, {
      filterByFormula: accountFilter,
      fields: ["Name", "Descripcion"],
      maxRecords: 1,
    });
    if (records.length === 0) return null;
    const f = records[0].fields as Record<string, unknown>;
    const desc = (f["Descripcion"] as string) || (f["Name"] as string) || null;
    return desc ? desc.slice(0, 300) : null;
  } catch {
    return null;
  }
}

async function fetchVoices(accountFilter: string) {
  try {
    const { records } = await airtableFetch(TABLES.VOICES, {
      filterByFormula: accountFilter,
      fields: ["Name"],
      maxRecords: 5,
    });
    return records
      .map((r) => (r.fields as Record<string, unknown>)["Name"] as string)
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchRecentVideos(accountFilter: string) {
  try {
    const { records } = await airtableFetch(TABLES.VIDEOS, {
      filterByFormula: accountFilter,
      fields: [
        "Name", "Titulo Youtube A", "Estado",
        "Seguro Creación Copy", "Status Audio", "Status Avatares", "Status Render Video",
      ],
      maxRecords: 5,
      sort: [{ field: "Name", direction: "desc" }],
    });
    return records.map((r) => {
      const f = r.fields as Record<string, unknown>;
      return {
        number: (f["Name"] as number) || 0,
        name: (f["Titulo Youtube A"] as string) || `Video #${f["Name"] || ""}`,
        estado: (f["Estado"] as string) || "",
        pipeline: {
          copy: f["Seguro Creación Copy"] ? "done" : "pending",
          audio: (f["Status Audio"] as string) || "pending",
          video: (f["Status Avatares"] as string) || "pending",
          render: (f["Status Render Video"] as string) || "pending",
        },
      };
    });
  } catch {
    return [];
  }
}
