import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const category = searchParams.get("category");

  let query = supabase
    .from("help_articles")
    .select("id, slug, title, summary, category, tags, sort_order, updated_at")
    .eq("published", true)
    .order("sort_order");

  if (category) {
    query = query.eq("category", category);
  }

  if (q) {
    // Use ILIKE for simple, reliable search across title, summary, and content
    query = query.or(
      `title.ilike.%${q}%,summary.ilike.%${q}%,content.ilike.%${q}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
