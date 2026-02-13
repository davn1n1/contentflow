import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chat_conversations")
    .select("id, title, account_id, metadata, updated_at")
    .eq("user_id", auth.user.userId)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
