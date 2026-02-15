// Airtable table IDs
export const TABLES = {
  ACCOUNT: "tbldXugZINS2ZE0OG",
  VIDEOS: "tbl16hfZSQhbjj6XS",
  ESCENAS: "tbl8SooJsyirSeczB",
  AE_RENDERS: "tblEZWZMzvL6t1Xj2",
  IDEAS: "tblZZUQi5ythI5zze",
  RESEARCH: "tblokkoR3fWLmv5It",
  USUARIOS: "tblgVFWLrEqmMpKiT",
  // App Data tables
  AVATARES: "tbloGkyPDYm0qfsVp",
  AVATARES_SET: "tblWajVK5rGsoc4ne",
  PERSONA: "tbllOToYtcEiGNZQo",
  CTAS: "tblCsQDx2z0tKva6r",
  VIDEOS_BROLL: "tblR2gFFGYx7pkytz",
  VOICES: "tblrz6FTUxWKqnpaq",
  FUENTES_INSPIRACION: "tbl0GaEMGGSuKi2TS",
  VOICEDNA: "tblaI62Gyyb0BZ9r3",
  VOICEDNA_SOURCES: "tblTG9pGRxObqmizA",
  AUDIENCIA: "tblyhtBIia1pwX3WU",
  GUARDARAILS: "tblWuRMfOWylRvMeq",
  COMENTARIO_PINEADO: "tblV7rUg4i5LCcP45",
  SPONSORS: "tblExDZl9dfQjh2KV",
  BRANDS: "tblD6zBmbpcZsmRyw",
  IDENTIDAD_VISUAL: "tblb6AMVu3CLgeabq",
  SOCIAL_PROFILES: "tblNESIBVHUgaTwce",
  ACCOUNT_SETTINGS: "tblyFkvBVuHs6mLOO",
  CAMPANAS: "tbl7YBYQ7Whb6JdE1",
  DRAFT_PUBLICACION: "tbltxqsZK5lzHP98R",
  EXPRESIONES_MINIATURAS: "tbliunY5HiSCKBO45",
  MONTAJE_VIDEO: "tblWxMWmOPH1ji5td",
  FORMATO_DISENO_SLIDES: "tblfVdoehsdbjxmoq",
  ESTILOS_MUSICALES: "tblb9FDBMdxF6IFjT",
  AE_TEMPLATES: "tblLEkwWRBR9H7UDy",
} as const;

interface AirtableResponse<T = Record<string, unknown>> {
  records: AirtableRecord<T>[];
  offset?: string;
}

export interface AirtableRecord<T = Record<string, unknown>> {
  id: string;
  createdTime: string;
  fields: T;
}

export async function airtableFetch<T = Record<string, unknown>>(
  tableId: string,
  options?: {
    fields?: string[];
    filterByFormula?: string;
    maxRecords?: number;
    sort?: { field: string; direction?: "asc" | "desc" }[];
    offset?: string;
  }
): Promise<AirtableResponse<T>> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const pat = process.env.AIRTABLE_PAT;

  if (!baseId || !pat) {
    throw new Error("Airtable credentials not configured");
  }

  // Copy fields so we can mutate on retry
  let currentFields = options?.fields ? [...options.fields] : undefined;
  const MAX_RETRIES = 5;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${tableId}`);

    if (currentFields) {
      currentFields.forEach((f) => url.searchParams.append("fields[]", f));
    }
    if (options?.filterByFormula) {
      url.searchParams.set("filterByFormula", options.filterByFormula);
    }
    if (options?.maxRecords) {
      url.searchParams.set("maxRecords", String(options.maxRecords));
    }
    if (options?.sort) {
      options.sort.forEach((s, i) => {
        url.searchParams.set(`sort[${i}][field]`, s.field);
        url.searchParams.set(`sort[${i}][direction]`, s.direction || "asc");
      });
    }
    if (options?.offset) {
      url.searchParams.set("offset", options.offset);
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${pat}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));

      // Auto-recover from UNKNOWN_FIELD_NAME: remove bad field and retry
      if (
        res.status === 422 &&
        err?.error?.type === "UNKNOWN_FIELD_NAME" &&
        currentFields &&
        attempt < MAX_RETRIES
      ) {
        const msg: string = err.error.message || "";
        const match = msg.match(/Unknown field name: "(.+?)"/);
        if (match) {
          const badField = match[1];
          console.warn(`[Airtable] Removing unknown field "${badField}" from table ${tableId} and retrying (attempt ${attempt + 1})`);
          currentFields = currentFields.filter((f) => f !== badField);
          continue;
        }
      }

      throw new Error(`Airtable error: ${res.status} ${JSON.stringify(err)}`);
    }

    return res.json();
  }

  throw new Error("Airtable fetch: max retries exceeded");
}

// Create a new record in a table
export async function airtableCreate<T = Record<string, unknown>>(
  tableId: string,
  fields: Record<string, unknown>
): Promise<AirtableRecord<T>> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const pat = process.env.AIRTABLE_PAT;

  if (!baseId || !pat) {
    throw new Error("Airtable credentials not configured");
  }

  const res = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Airtable create error: ${res.status} ${JSON.stringify(err)}`);
  }

  return res.json();
}

// Update an existing record
export async function airtableUpdate<T = Record<string, unknown>>(
  tableId: string,
  recordId: string,
  fields: Record<string, unknown>
): Promise<AirtableRecord<T>> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const pat = process.env.AIRTABLE_PAT;

  if (!baseId || !pat) {
    throw new Error("Airtable credentials not configured");
  }

  const res = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Airtable update error: ${res.status} ${JSON.stringify(err)}`);
  }

  return res.json();
}

// Delete records from a table (batches into groups of 10, Airtable API limit)
export async function airtableDelete(
  tableId: string,
  recordIds: string[]
): Promise<{ id: string; deleted: boolean }[]> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const pat = process.env.AIRTABLE_PAT;

  if (!baseId || !pat) {
    throw new Error("Airtable credentials not configured");
  }

  if (recordIds.length === 0) return [];

  const BATCH_SIZE = 10;
  const chunks: string[][] = [];
  for (let i = 0; i < recordIds.length; i += BATCH_SIZE) {
    chunks.push(recordIds.slice(i, i + BATCH_SIZE));
  }

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const url = new URL(`https://api.airtable.com/v0/${baseId}/${tableId}`);
      chunk.forEach((id) => url.searchParams.append("records[]", id));

      const res = await fetch(url.toString(), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${pat}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Airtable delete error: ${res.status} ${JSON.stringify(err)}`);
      }

      const data = await res.json();
      return data.records as { id: string; deleted: boolean }[];
    })
  );

  return results.flat();
}

// Fetch specific records by their IDs (batches large requests)
export async function airtableFetchByIds<T = Record<string, unknown>>(
  tableId: string,
  recordIds: string[],
  fields?: string[]
): Promise<AirtableRecord<T>[]> {
  if (recordIds.length === 0) return [];

  // Batch into chunks of 20 to avoid long URL formulas
  const BATCH_SIZE = 20;
  const chunks: string[][] = [];
  for (let i = 0; i < recordIds.length; i += BATCH_SIZE) {
    chunks.push(recordIds.slice(i, i + BATCH_SIZE));
  }

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const formula = chunk.length === 1
        ? `RECORD_ID()='${chunk[0]}'`
        : `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;

      const result = await airtableFetch<T>(tableId, {
        filterByFormula: formula,
        fields,
      });
      return result.records;
    })
  );

  return results.flat();
}
