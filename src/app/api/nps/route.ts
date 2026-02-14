import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/nps
 *
 * Submit an NPS (Net Promoter Score) response.
 * Body: { score: 0-10, feedback?: string, pageContext?: string }
 * Auth: Supabase session (authenticated user)
 */
export async function POST(request: Request) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { score, feedback, pageContext } = body;

    if (typeof score !== "number" || score < 0 || score > 10) {
      return NextResponse.json(
        { error: "Score must be a number between 0 and 10" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.from("nps_responses").insert({
      user_id: auth.user.userId,
      score,
      feedback: feedback || null,
      page_context: pageContext || null,
    });

    if (error) {
      console.error("[NPS] Insert error:", error);
      return NextResponse.json(
        { error: "Failed to save response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[NPS] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
