import { NextResponse } from "next/server";
import { airtableFetch, airtableCreate, TABLES } from "@/lib/airtable/client";
import { inviteSupabaseUser } from "@/lib/auth/create-supabase-user";

const GHL_WEBHOOK_SECRET = process.env.GHL_WEBHOOK_SECRET || "";

/**
 * POST /api/webhooks/ghl-sale
 *
 * Called by GoHighLevel Workflow when an opportunity moves to "won".
 * Creates Account + User in Airtable, invites via Supabase (email with magic link).
 *
 * Auth: X-Webhook-Secret header
 * Idempotent: if user with email already exists, returns existing data.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("X-Webhook-Secret");
  if (!secret || secret !== GHL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const contactEmail = body.contact_email || body.email;
    const contactName = body.contact_name || body.full_name || body.name || "";
    const companyName = body.company_name || body.business_name || contactName;
    const plan = body.plan || "Starter";
    const industria = body.industria || body.industry;
    const phone = body.contact_phone || body.phone;

    if (!contactEmail) {
      return NextResponse.json(
        { error: "Missing required field: contact_email" },
        { status: 400 }
      );
    }

    const email = contactEmail.trim().toLowerCase();

    // Idempotency: check if user already exists in Airtable
    const existing = await airtableFetch<{ Email?: string; Account?: string[] }>(
      TABLES.USUARIOS,
      {
        filterByFormula: `LOWER({Email})='${email}'`,
        fields: ["Email", "Account"],
        maxRecords: 1,
      }
    );

    if (existing.records.length > 0) {
      return NextResponse.json({
        success: true,
        status: "already_exists",
        user_airtable_id: existing.records[0].id,
        account_airtable_id: existing.records[0].fields.Account?.[0] || null,
      });
    }

    // 1. Create Account in Airtable
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const account = await airtableCreate(TABLES.ACCOUNT, {
      Name: companyName,
      Status: "Onboarding",
      NameApp: slug,
      ...(industria && { Industria: Array.isArray(industria) ? industria : [industria] }),
    });

    // 2. Create User in Airtable
    const user = await airtableCreate(TABLES.USUARIOS, {
      Name: contactName,
      Email: email,
      Status: "Activo",
      Rol: ["Admin"],
      Account: [account.id],
    });

    // 3. Invite via Supabase (sends email with magic link to set password)
    const supabaseResult = await inviteSupabaseUser({
      email,
      name: contactName,
      airtableUserId: user.id,
    });

    return NextResponse.json({
      success: true,
      status: "created",
      account_airtable_id: account.id,
      user_airtable_id: user.id,
      supabase_user_id: supabaseResult.userId,
      email: supabaseResult.email,
      plan,
      ...(phone && { phone }),
      ...(supabaseResult.warning && { warning: supabaseResult.warning }),
    });
  } catch (error) {
    console.error("GHL sale webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
