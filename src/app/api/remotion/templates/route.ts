import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/remotion/templates
 * List all saved template configs from Supabase.
 */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("remotion_templates")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

/**
 * POST /api/remotion/templates
 * Save or update a template config.
 *
 * Body: {
 *   templateId: string,                  // registry key (e.g. "text-reveal")
 *   name: string,                        // display name
 *   description?: string,
 *   props: Record<string, unknown>,      // all editable props (content, colors, timing, audio)
 *   remotion_timeline?: RemotionTimeline  // optional: the full timeline for reference
 * }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { templateId, name, description, props, remotion_timeline } = body;

  if (!templateId || !name || !props) {
    return NextResponse.json(
      { error: "templateId, name, and props are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("remotion_templates")
    .upsert(
      {
        template_id: templateId,
        name,
        description: description || null,
        props,
        remotion_timeline: remotion_timeline || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "template_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, template: data });
}
