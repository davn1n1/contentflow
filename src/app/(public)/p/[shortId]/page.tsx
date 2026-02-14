import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { ProposalPageClient } from "./proposal-client";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  // Fetch active services catalog
  const { data: services } = await supabaseAdmin
    .from("proposal_services")
    .select("*")
    .eq("active", true)
    .order("display_order");

  const isExpired =
    proposal.expires_at && new Date(proposal.expires_at) < new Date();
  const isAccepted = proposal.status === "accepted";

  return (
    <ProposalPageClient
      proposal={{ ...proposal, ...updates }}
      services={services || []}
      isExpired={!!isExpired}
      isAccepted={isAccepted}
    />
  );
}
