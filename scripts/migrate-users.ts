/**
 * Migration script: Airtable 🧑‍💻Usuarios → Supabase Auth + profiles
 *
 * Run with: npx tsx scripts/migrate-users.ts
 *
 * What it does:
 * 1. Fetches all users from Airtable 🧑‍💻Usuarios table
 * 2. For each user with email, creates a Supabase Auth user with random password
 * 3. The DB trigger auto-creates the profile row
 * 4. Updates the profile with airtable_user_id
 * 5. Outputs a CSV with email + temporary password for each user
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

// --- Config from .env.local ---
const SUPABASE_URL = "https://emtgpbcpqkmsodxqejgs.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "appDksUUHWWb5SJ1v";
const USUARIOS_TABLE_ID = "tblgVFWLrEqmMpKiT";

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY. Run with:");
  console.error("  SUPABASE_SERVICE_ROLE_KEY=xxx AIRTABLE_PAT=xxx npx tsx scripts/migrate-users.ts");
  process.exit(1);
}
if (!AIRTABLE_PAT) {
  console.error("Missing AIRTABLE_PAT. Run with:");
  console.error("  SUPABASE_SERVICE_ROLE_KEY=xxx AIRTABLE_PAT=xxx npx tsx scripts/migrate-users.ts");
  process.exit(1);
}

// Supabase admin client (uses service role key for admin operations)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function generatePassword(): string {
  return randomBytes(12).toString("base64url").slice(0, 16) + "!A1";
}

interface AirtableUser {
  id: string;
  fields: {
    Name?: string;
    Email?: string;
    Status?: string;
    Rol?: string[];
  };
}

async function fetchAirtableUsers(): Promise<AirtableUser[]> {
  const allRecords: AirtableUser[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${USUARIOS_TABLE_ID}`);
    url.searchParams.append("fields[]", "Name");
    url.searchParams.append("fields[]", "Email");
    url.searchParams.append("fields[]", "Status");
    url.searchParams.append("fields[]", "Rol");
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Airtable error ${res.status}: ${err}`);
    }

    const data = await res.json();
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

async function main() {
  console.log("=== ContentFlow365 User Migration ===\n");
  console.log("Fetching users from Airtable...");

  const airtableUsers = await fetchAirtableUsers();
  console.log(`Found ${airtableUsers.length} users in Airtable\n`);

  // Filter users with valid emails
  const usersWithEmail = airtableUsers.filter((u) => {
    const email = u.fields.Email?.trim();
    return email && email.includes("@");
  });

  console.log(`${usersWithEmail.length} users have valid emails\n`);

  const results: { email: string; password: string; status: string; airtable_id: string }[] = [];

  for (const atUser of usersWithEmail) {
    const email = atUser.fields.Email!.trim().toLowerCase();
    const name = atUser.fields.Name || "";
    const password = generatePassword();

    console.log(`Processing: ${email} (${name})...`);

    // Check if user already exists in Supabase
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email
    );

    if (existing) {
      // User already exists - just update the profile with airtable_user_id
      console.log(`  → Already exists in Supabase, updating profile...`);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ airtable_user_id: atUser.id })
        .eq("id", existing.id);

      if (updateError) {
        console.log(`  → Error updating profile: ${updateError.message}`);
        results.push({ email, password: "(existing)", status: `PROFILE_ERROR: ${updateError.message}`, airtable_id: atUser.id });
      } else {
        console.log(`  → Profile updated with airtable_user_id: ${atUser.id}`);
        results.push({ email, password: "(existing - not changed)", status: "UPDATED", airtable_id: atUser.id });
      }
      continue;
    }

    // Create new Supabase Auth user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification
      user_metadata: { full_name: name },
    });

    if (createError) {
      console.log(`  → Error creating user: ${createError.message}`);
      results.push({ email, password: "", status: `CREATE_ERROR: ${createError.message}`, airtable_id: atUser.id });
      continue;
    }

    // Update profile with airtable_user_id
    // Small delay to let the trigger create the profile row
    await new Promise((r) => setTimeout(r, 500));

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ airtable_user_id: atUser.id })
      .eq("id", newUser.user.id);

    if (profileError) {
      console.log(`  → User created but profile update failed: ${profileError.message}`);
      results.push({ email, password, status: `CREATED (profile error: ${profileError.message})`, airtable_id: atUser.id });
    } else {
      console.log(`  → Created successfully`);
      results.push({ email, password, status: "CREATED", airtable_id: atUser.id });
    }
  }

  // Print summary
  console.log("\n\n=== MIGRATION RESULTS ===\n");
  console.log("email,password,status,airtable_id");
  for (const r of results) {
    console.log(`${r.email},${r.password},${r.status},${r.airtable_id}`);
  }

  const created = results.filter((r) => r.status === "CREATED").length;
  const updated = results.filter((r) => r.status === "UPDATED").length;
  const errors = results.filter((r) => r.status.includes("ERROR")).length;

  console.log(`\n--- Summary ---`);
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total processed: ${results.length}`);
  console.log(`\nSave the passwords above - they cannot be retrieved later!`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
