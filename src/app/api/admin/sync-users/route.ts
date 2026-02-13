import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

/**
 * POST /api/admin/sync-users
 *
 * Syncs Airtable 🧑‍💻Usuarios → Supabase Auth + profiles.
 * Airtable is the source of truth. This endpoint:
 * 1. Fetches all users from Airtable with valid emails
 * 2. For each user:
 *    - If NOT in Supabase → creates auth user + links profile
 *    - If in Supabase but airtable_user_id wrong → fixes the link
 *    - If already correct → skips
 *
 * Auth: API key in X-Admin-Key header (same as N8N_WEBHOOK_AUTH_VALUE)
 * Can be called by n8n on a schedule or triggered by Airtable automation.
 *
 * Returns: { results: [...], summary: { created, updated, skipped, errors } }
 */

const ADMIN_API_KEY = process.env.N8N_WEBHOOK_AUTH_VALUE || "";
const AIRTABLE_PAT = process.env.AIRTABLE_PAT || "";
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "appDksUUHWWb5SJ1v";
const USUARIOS_TABLE_ID = "tblgVFWLrEqmMpKiT";

export async function POST(request: Request) {
  const apiKey = request.headers.get("X-Admin-Key");
  if (!apiKey || apiKey !== ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || !AIRTABLE_PAT) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // 1. Fetch all Airtable users with emails
    const airtableUsers = await fetchAirtableUsers();

    // 2. Fetch all Supabase auth users and profiles
    const { data: authData } = await supabase.auth.admin.listUsers();
    const supabaseUsers = authData?.users || [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, airtable_user_id");

    const profileMap = new Map(
      (profiles || []).map((p) => [p.email.toLowerCase(), p])
    );
    const profileByAirtableId = new Map(
      (profiles || []).filter((p) => p.airtable_user_id).map((p) => [p.airtable_user_id, p])
    );

    const results: { email: string; action: string; password?: string; airtable_id: string }[] = [];

    for (const atUser of airtableUsers) {
      const email = atUser.email.trim().toLowerCase();
      const existingProfile = profileMap.get(email);

      if (existingProfile) {
        // User exists in Supabase
        if (existingProfile.airtable_user_id === atUser.id) {
          // Already correct
          results.push({ email, action: "skipped", airtable_id: atUser.id });
        } else {
          // Fix the airtable_user_id link
          await supabase
            .from("profiles")
            .update({ airtable_user_id: atUser.id })
            .eq("id", existingProfile.id);
          results.push({ email, action: "updated", airtable_id: atUser.id });
        }
      } else {
        // Check if this airtable record is already linked to another Supabase user
        const existingLink = profileByAirtableId.get(atUser.id);
        if (existingLink) {
          results.push({ email, action: "skipped (linked via " + existingLink.email + ")", airtable_id: atUser.id });
          continue;
        }

        // New user — create in Supabase
        const password = randomBytes(12).toString("base64url").slice(0, 16) + "!A1";
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: atUser.name || "" },
        });

        if (createError) {
          results.push({ email, action: "error: " + createError.message, airtable_id: atUser.id });
          continue;
        }

        // Wait for trigger to create profile row
        await new Promise((r) => setTimeout(r, 500));

        await supabase
          .from("profiles")
          .update({ airtable_user_id: atUser.id })
          .eq("id", newUser.user.id);

        results.push({ email, password, action: "created", airtable_id: atUser.id });
      }
    }

    const summary = {
      created: results.filter((r) => r.action === "created").length,
      updated: results.filter((r) => r.action === "updated").length,
      skipped: results.filter((r) => r.action.startsWith("skipped")).length,
      errors: results.filter((r) => r.action.startsWith("error")).length,
      total: results.length,
    };

    return NextResponse.json({ results, summary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

interface AirtableUser {
  id: string;
  email: string;
  name: string;
}

async function fetchAirtableUsers(): Promise<AirtableUser[]> {
  const allUsers: AirtableUser[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${USUARIOS_TABLE_ID}`);
    url.searchParams.append("fields[]", "Name");
    url.searchParams.append("fields[]", "Email");
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!res.ok) throw new Error(`Airtable error ${res.status}`);

    const data = await res.json();

    for (const record of data.records) {
      const email = record.fields.Email?.trim();
      if (email && email.includes("@")) {
        allUsers.push({
          id: record.id,
          email,
          name: record.fields.Name || "",
        });
      }
    }

    offset = data.offset;
  } while (offset);

  return allUsers;
}
