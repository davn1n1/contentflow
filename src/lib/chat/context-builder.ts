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
 */
export async function buildEnrichedContext(
  accountId: string | undefined,
  userAccountIds: string[]
): Promise<EnrichedContext> {
  const targetAccountId = accountId || userAccountIds[0];

  if (!targetAccountId) {
    return { account: null, persona: null, voices: [], recentVideos: [] };
  }

  const accountFilter = `FIND('${targetAccountId}', ARRAYJOIN({🏢Account}))`;

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
        "Name", "N Video", "Estado",
        "Seguro Creacion Copy", "Status Audio", "Status Avatares", "Status Render Video",
      ],
      maxRecords: 5,
      sort: [{ field: "N Video", direction: "desc" }],
    });
    return records.map((r) => {
      const f = r.fields as Record<string, unknown>;
      return {
        number: (f["N Video"] as number) || 0,
        name: (f["Name"] as string) || "",
        estado: (f["Estado"] as string) || "",
        pipeline: {
          copy: f["Seguro Creacion Copy"] ? "done" : "pending",
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
