import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createClient } from "@supabase/supabase-js";
import { authenticateWebhook } from "@/lib/auth/webhook-auth";
import { transcribeRecording } from "@/lib/proposals/transcribe";
import { analyzeCallTranscript } from "@/lib/proposals/analyze-call";
import { calculateProposal, type ServiceSelection } from "@/lib/proposals/calculator";

export const maxDuration = 120; // transcription + analysis can take time

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/webhooks/ghl-proposal
 *
 * Called by GHL Workflow when an opportunity reaches a specific stage.
 * Creates a personalized proposal page with AI call analysis + calculator.
 *
 * Auth: Bearer token | X-Api-Key | X-Webhook-Secret (unified GHL_API_KEY)
 */
export async function POST(request: Request) {
  if (!authenticateWebhook(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const opportunityId = body.opportunity_id;
    const contactId = body.contact_id;
    const contactName = body.contact_name || body.name || "Prospecto";
    const contactEmail = body.contact_email || body.email;
    const contactPhone = body.contact_phone || body.phone;
    const companyName = body.company_name || contactName;
    const callRecordingUrl = body.call_recording_url;
    const existingTranscript = body.transcript_text || body.custom_fields?.transcript_text;

    if (!opportunityId || !contactId) {
      return NextResponse.json(
        { error: "Missing required: opportunity_id, contact_id" },
        { status: 400 }
      );
    }

    // Idempotency: check if proposal already exists for this opportunity
    const { data: existing } = await supabaseAdmin
      .from("proposals")
      .select("id, short_id")
      .eq("ghl_opportunity_id", opportunityId)
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        status: "already_exists",
        proposal_id: existing.id,
        short_id: existing.short_id,
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://app.contentflow365.com"}/p/${existing.short_id}`,
      });
    }

    // Generate short ID for public URL
    const shortId = nanoid(8);

    // Transcribe if we have a recording URL but no transcript
    let transcriptText = existingTranscript || "";
    let durationSeconds = 0;

    if (callRecordingUrl && !transcriptText) {
      try {
        const result = await transcribeRecording(callRecordingUrl);
        transcriptText = result.text;
        durationSeconds = result.durationSeconds;
      } catch (err) {
        console.error("Transcription failed:", err);
        // Continue without transcript — proposal will have no analysis
      }
    }

    // Analyze transcript with AI
    let analysis = {};
    let prefillServices: ServiceSelection[] = [];

    if (transcriptText) {
      try {
        const result = await analyzeCallTranscript(
          transcriptText,
          contactName,
          companyName
        );
        analysis = result;

        // Map mentioned_services to calculator pre-fill
        if (result.mentioned_services?.length > 0) {
          const { data: catalog } = await supabaseAdmin
            .from("proposal_services")
            .select("*")
            .eq("active", true)
            .order("display_order");

          if (catalog) {
            prefillServices = result.mentioned_services
              .map((ms) => {
                const svc = catalog.find((c) => c.slug === ms.service);
                if (!svc) return null;
                return {
                  service_id: svc.id,
                  slug: svc.slug,
                  name: svc.name,
                  unit_price: Number(svc.unit_price),
                  unit_label: svc.unit_label,
                  quantity: ms.quantity,
                };
              })
              .filter(Boolean) as ServiceSelection[];
          }
        }
      } catch (err) {
        console.error("Analysis failed:", err);
      }
    }

    // Calculate pricing
    const pricing = calculateProposal(prefillServices);

    // Insert proposal
    const { data: proposal, error } = await supabaseAdmin
      .from("proposals")
      .insert({
        short_id: shortId,
        ghl_opportunity_id: opportunityId,
        ghl_contact_id: contactId,
        prospect_name: contactName,
        prospect_email: contactEmail,
        prospect_phone: contactPhone,
        company_name: companyName,
        call_recording_url: callRecordingUrl,
        call_duration_seconds: durationSeconds,
        transcript_text: transcriptText || null,
        analysis,
        services: prefillServices,
        subtotal: pricing.subtotal,
        total: pricing.total,
        status: "sent",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id, short_id")
      .single();

    if (error) throw error;

    const proposalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://app.contentflow365.com"}/p/${shortId}`;

    return NextResponse.json({
      success: true,
      status: "created",
      proposal_id: proposal!.id,
      short_id: shortId,
      url: proposalUrl,
      has_transcript: !!transcriptText,
      has_analysis: Object.keys(analysis).length > 0,
      services_count: prefillServices.length,
    });
  } catch (error) {
    console.error("GHL proposal webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
