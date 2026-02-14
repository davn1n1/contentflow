import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateProposal, type ServiceSelection } from "@/lib/proposals/calculator";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/proposals/[shortId]
 * Public: returns proposal data + active service catalog.
 * Tracks views automatically.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  const { shortId } = await params;

  const { data: proposal, error } = await supabaseAdmin
    .from("proposals")
    .select("*")
    .eq("short_id", shortId)
    .single();

  if (error || !proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  // Track view
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const ua = request.headers.get("user-agent") || "";

  await supabaseAdmin.from("proposal_views").insert({
    proposal_id: proposal.id,
    ip_address: ip,
    user_agent: ua,
  });

  const updates: Record<string, unknown> = {
    view_count: (proposal.view_count || 0) + 1,
    last_viewed_at: new Date().toISOString(),
  };
  if (!proposal.first_viewed_at) {
    updates.first_viewed_at = new Date().toISOString();
  }
  if (proposal.status === "sent") {
    updates.status = "viewed";
  }

  await supabaseAdmin
    .from("proposals")
    .update(updates)
    .eq("id", proposal.id);

  // Fetch service catalog
  const { data: services } = await supabaseAdmin
    .from("proposal_services")
    .select("*")
    .eq("active", true)
    .order("display_order");

  return NextResponse.json({
    proposal: { ...proposal, ...updates },
    services: services || [],
  });
}

/**
 * PUT /api/proposals/[shortId]
 * Public: update calculator selections and recalculate pricing.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  const { shortId } = await params;
  const body = await request.json();
  const items: ServiceSelection[] = body.items || [];
  const discountPercent: number = body.discount_percent || 0;

  const { data: proposal } = await supabaseAdmin
    .from("proposals")
    .select("id, status")
    .eq("short_id", shortId)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (proposal.status === "accepted" || proposal.status === "expired") {
    return NextResponse.json(
      { error: `Cannot modify a proposal with status: ${proposal.status}` },
      { status: 400 }
    );
  }

  const pricing = calculateProposal(items, discountPercent);

  await supabaseAdmin
    .from("proposals")
    .update({
      services: items,
      subtotal: pricing.subtotal,
      discount_percent: discountPercent,
      total: pricing.total,
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposal.id);

  return NextResponse.json(pricing);
}
