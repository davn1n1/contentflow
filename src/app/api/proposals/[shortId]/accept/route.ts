import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/proposals/[shortId]/accept
 * Public: prospect accepts the proposal.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  const { shortId } = await params;
  const body = await request.json();

  const { data: proposal } = await supabaseAdmin
    .from("proposals")
    .select("id, status, expires_at")
    .eq("short_id", shortId)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (proposal.status === "accepted") {
    return NextResponse.json({
      success: true,
      status: "already_accepted",
      message: "Esta propuesta ya fue aceptada.",
    });
  }

  if (
    proposal.status === "expired" ||
    (proposal.expires_at && new Date(proposal.expires_at) < new Date())
  ) {
    return NextResponse.json(
      { error: "Esta propuesta ha expirado." },
      { status: 400 }
    );
  }

  // Update proposal
  const updates: Record<string, unknown> = {
    status: "accepted",
    accepted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (body.selected_items) {
    updates.services = body.selected_items;
  }
  if (body.payment_terms) {
    updates.payment_terms = body.payment_terms;
  }
  if (body.selected_plan) {
    updates.selected_plan = body.selected_plan;
  }

  await supabaseAdmin
    .from("proposals")
    .update(updates)
    .eq("id", proposal.id);

  return NextResponse.json({
    success: true,
    status: "accepted",
    message: "Propuesta aceptada. Te contactaremos pronto para coordinar.",
  });
}
