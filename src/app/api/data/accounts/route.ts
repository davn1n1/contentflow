import { NextResponse } from "next/server";
import { airtableFetch, TABLES } from "@/lib/airtable/client";
import { authenticateApiRequest } from "@/lib/auth/api-guard";

const ACCOUNT_FIELDS = [
  "Name", "Status", "Industria", "Product", "Logo", "NameApp",
  "Research Diario", "Framework GuardaRails", "Canal YouTube",
];

interface AccountFields {
  Name?: string;
  Status?: string;
  Industria?: string[];
  Product?: string;
  Logo?: { url: string; thumbnails?: { large?: { url: string } } }[];
  NameApp?: string;
  "Research Diario"?: string;
  "Framework GuardaRails"?: string;
  "Canal YouTube"?: string;
}

export async function GET() {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const { records } = await airtableFetch<AccountFields>(TABLES.ACCOUNT, {
      fields: ACCOUNT_FIELDS,
      sort: [{ field: "Name", direction: "asc" }],
    });

    const accounts = records.map((r) => ({
      id: r.id,
      airtable_id: r.id,
      name: r.fields.Name || "",
      status: r.fields.Status || null,
      industria: r.fields.Industria?.[0] || null,
      product: r.fields.Product || null,
      logo: r.fields.Logo?.[0]?.thumbnails?.large?.url || r.fields.Logo?.[0]?.url || null,
      nameapp: r.fields.NameApp || null,
      created: r.createdTime,
      research_diario: r.fields["Research Diario"] || null,
      framework_guardarails: r.fields["Framework GuardaRails"] || null,
      cf_plans_id: null,
      youtube_channel: r.fields["Canal YouTube"] || null,
    }));

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Airtable accounts error:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}
