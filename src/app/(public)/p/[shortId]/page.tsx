import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { ProposalPageClient } from "./proposal-client";
import { PLANS, SERVICE_GROUPS, FAQ_CATEGORIES } from "@/lib/proposals/constants";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function determineRecommendedPlan(
  analysis: Record<string, unknown> | null
): string {
  if (!analysis) return "growth";
  const mentioned = analysis.mentioned_services;
  const count = Array.isArray(mentioned) ? mentioned.length : 0;
  const recommended = analysis.recommended_plan;
  if (typeof recommended === "string" && ["pro", "growth", "scale"].includes(recommended)) {
    return recommended;
  }
  if (count >= 4) return "scale";
  if (count >= 2) return "growth";
  return "pro";
}

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const { shortId } = await params;

  const { data: proposal } = await supabaseAdmin
    .from("proposals")
    .select("*")
    .eq("short_id", shortId)
    .single();

  if (!proposal) notFound();

  // Track view server-side
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const ua = headersList.get("user-agent") || "";

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

  const isExpired =
    proposal.expires_at && new Date(proposal.expires_at) < new Date();
  const isAccepted = proposal.status === "accepted";

  const recommendedPlanId = determineRecommendedPlan(
    proposal.analysis as Record<string, unknown> | null
  );

  return (
    <ProposalPageClient
      proposal={{ ...proposal, ...updates }}
      plans={PLANS}
      serviceGroups={SERVICE_GROUPS}
      faqs={FAQ_CATEGORIES}
      recommendedPlanId={recommendedPlanId}
      isExpired={!!isExpired}
      isAccepted={isAccepted}
    />
  );
}
