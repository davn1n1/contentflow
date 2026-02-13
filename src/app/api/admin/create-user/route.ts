import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

/**
 * POST /api/admin/create-user
 *
 * Creates a Supabase Auth user + links profile to Airtable user.
 * Called by n8n when a new purchase happens in GoHighLevel.
 *
 * Auth: API key in X-Admin-Key header (same as N8N_WEBHOOK_AUTH_VALUE)
 *
 * Body: {
 *   email: string,
 *   name?: string,
 *   airtable_user_id: string  // Record ID from 🧑‍💻Usuarios table
 * }
 *
 * Returns: { success: true, user_id, email, password }
 */

const ADMIN_API_KEY = process.env.N8N_WEBHOOK_AUTH_VALUE || "";

export async function POST(request: Request) {
  // Authenticate with API key (for server-to-server calls from n8n)
  const apiKey = request.headers.get("X-Admin-Key");
  if (!apiKey || apiKey !== ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { email, name, airtable_user_id } = body;

    if (!email || !airtable_user_id) {
      return NextResponse.json(
        { error: "Missing required fields: email, airtable_user_id" },
        { status: 400 }
      );
    }

    // Admin client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Generate random password
    const password = randomBytes(12).toString("base64url").slice(0, 16) + "!A1";

    // Create Supabase Auth user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: name || "" },
    });

    if (createError) {
      return NextResponse.json(
        { error: `Failed to create user: ${createError.message}` },
        { status: 400 }
      );
    }

    // Wait for trigger to create profile, then update with airtable_user_id
    await new Promise((r) => setTimeout(r, 500));

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ airtable_user_id })
      .eq("id", newUser.user.id);

    if (profileError) {
      // User was created but profile link failed - return partial success
      return NextResponse.json({
        success: true,
        warning: `User created but profile link failed: ${profileError.message}`,
        user_id: newUser.user.id,
        email: newUser.user.email,
        password,
      });
    }

    return NextResponse.json({
      success: true,
      user_id: newUser.user.id,
      email: newUser.user.email,
      password,
      airtable_user_id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
