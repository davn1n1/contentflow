import { createClient } from "@supabase/supabase-js";

interface CreateSupabaseUserParams {
  email: string;
  name: string;
  airtableUserId: string;
}

interface CreateSupabaseUserResult {
  userId: string;
  email: string;
  /** Set when using password mode (legacy n8n flow) */
  password?: string;
  warning?: string;
}

function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function linkProfile(supabase: any, userId: string, airtableUserId: string) {
  // Wait for the on_auth_user_created trigger to create the profile row
  await new Promise((r) => setTimeout(r, 500));
  return supabase
    .from("profiles")
    .update({ airtable_user_id: airtableUserId })
    .eq("id", userId);
}

/**
 * Creates a Supabase Auth user via invite (email with magic link).
 * The user receives a Supabase-managed email to set their password.
 * Used by /api/webhooks/ghl-sale for new customers.
 */
export async function inviteSupabaseUser(
  params: CreateSupabaseUserParams
): Promise<CreateSupabaseUserResult> {
  const supabase = getAdminClient();
  const normalizedEmail = params.email.trim().toLowerCase();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://app.contentflow365.com";

  const { data, error: inviteError } =
    await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
      data: { full_name: params.name || "" },
      redirectTo: `${siteUrl}/api/auth/callback?next=/set-password`,
    });

  if (inviteError) {
    throw new Error(`Failed to invite user: ${inviteError.message}`);
  }

  const { error: profileError } = await linkProfile(supabase, data.user.id, params.airtableUserId);

  return {
    userId: data.user.id,
    email: data.user.email!,
    ...(profileError && {
      warning: `User invited but profile link failed: ${profileError.message}`,
    }),
  };
}

/**
 * Creates a Supabase Auth user with a generated password.
 * Used by /api/admin/create-user (n8n legacy flow) and /api/admin/sync-users.
 */
export async function createSupabaseUser(
  params: CreateSupabaseUserParams
): Promise<CreateSupabaseUserResult> {
  const supabase = getAdminClient();
  const { randomBytes } = await import("crypto");

  const password = randomBytes(12).toString("base64url").slice(0, 16) + "!A1";
  const normalizedEmail = params.email.trim().toLowerCase();

  const { data: newUser, error: createError } =
    await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: params.name || "" },
    });

  if (createError) {
    throw new Error(`Failed to create user: ${createError.message}`);
  }

  const { error: profileError } = await linkProfile(supabase, newUser.user.id, params.airtableUserId);

  return {
    userId: newUser.user.id,
    email: newUser.user.email!,
    password,
    ...(profileError && {
      warning: `User created but profile link failed: ${profileError.message}`,
    }),
  };
}
