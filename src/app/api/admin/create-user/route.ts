import { NextResponse } from "next/server";
import { createSupabaseUser } from "@/lib/auth/create-supabase-user";

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

  try {
    const body = await request.json();
    const { email, name, airtable_user_id } = body;

    if (!email || !airtable_user_id) {
      return NextResponse.json(
        { error: "Missing required fields: email, airtable_user_id" },
        { status: 400 }
      );
    }

    const result = await createSupabaseUser({
      email,
      name: name || "",
      airtableUserId: airtable_user_id,
    });

    return NextResponse.json({
      success: true,
      user_id: result.userId,
      email: result.email,
      password: result.password,
      airtable_user_id,
      ...(result.warning && { warning: result.warning }),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: error instanceof Error && error.message.includes("Failed to create") ? 400 : 500 }
    );
  }
}
