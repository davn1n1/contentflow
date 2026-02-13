import { NextRequest, NextResponse } from "next/server";
import { airtableFetch, airtableFetchByIds, TABLES } from "@/lib/airtable/client";

const USER_FIELDS = [
  "Name", "Email", "Status", "Rol",
  "Account", "🏢Account", "NameApp (from Account)",
];

interface UserFields {
  Name?: string;
  Email?: string;
  Status?: string;
  Rol?: string[];
  Account?: string[];
  "🏢Account"?: string[];
  "NameApp (from Account)"?: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const airtableId = searchParams.get("airtableId");
    const accountId = searchParams.get("accountId");

    // Fetch single user by Airtable record ID
    if (airtableId) {
      const records = await airtableFetchByIds<UserFields>(
        TABLES.USUARIOS,
        [airtableId],
        USER_FIELDS
      );

      if (records.length === 0) {
        return NextResponse.json(null, { status: 404 });
      }

      return NextResponse.json(mapUser(records[0]));
    }

    // Fetch users by account (for team page)
    if (accountId) {
      const accountResult = await airtableFetch<{ Name?: string }>(TABLES.ACCOUNT, {
        filterByFormula: `RECORD_ID()='${accountId}'`,
        fields: ["Name"],
        maxRecords: 1,
      });
      const accountName = accountResult.records[0]?.fields?.Name;
      if (!accountName) {
        return NextResponse.json([]);
      }

      const { records } = await airtableFetch<UserFields>(TABLES.USUARIOS, {
        fields: USER_FIELDS,
        filterByFormula: `FIND('${accountName}', ARRAYJOIN({🏢Account}, ','))`,
      });

      return NextResponse.json(records.map(mapUser));
    }

    return NextResponse.json({ error: "airtableId or accountId parameter required" }, { status: 400 });
  } catch (error) {
    console.error("Airtable users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

function mapUser(r: { id: string; createdTime: string; fields: UserFields }) {
  return {
    id: r.id,
    airtable_id: r.id,
    name: r.fields.Name || null,
    email: r.fields.Email || null,
    status: r.fields.Status || null,
    rol: r.fields.Rol || [],
    account_ids: r.fields.Account || [],
    account_names: r.fields["🏢Account"] || [],
    nameapp_from_account: r.fields["NameApp (from Account)"] || [],
    agency_ids: [],
    user_val: null,
    notes: null,
    created: r.createdTime,
  };
}
