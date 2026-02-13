import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  airtable_user_id: string | null;
}

export async function authenticateApiRequest(): Promise<
  { user: AuthenticatedUser } | { error: NextResponse }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("airtable_user_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return {
      error: NextResponse.json({ error: "Profile not found" }, { status: 403 }),
    };
  }

  return {
    user: {
      userId: user.id,
      email: user.email!,
      airtable_user_id: profile.airtable_user_id,
    },
  };
}
