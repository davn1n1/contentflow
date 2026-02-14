import { NextResponse } from "next/server";
import { airtableFetch, airtableCreate, TABLES } from "@/lib/airtable/client";
import { inviteSupabaseUser } from "@/lib/auth/create-supabase-user";

const GHL_API_KEY = process.env.GHL_API_KEY || process.env.GHL_WEBHOOK_SECRET || "";

/**
 * Validates the request using multiple auth methods (in priority order):
 * 1. Authorization: Bearer <token>  (GHL native auth dropdown)
 * 2. X-Api-Key: <token>             (unified header style)
 * 3. X-Webhook-Secret: <token>      (legacy)
 */
function authenticateWebhook(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7) === GHL_API_KEY;
  }
  const apiKey = request.headers.get("X-Api-Key");
  if (apiKey) return apiKey === GHL_API_KEY;
  const secret = request.headers.get("X-Webhook-Secret");
  if (secret) return secret === GHL_API_KEY;
  return false;
}

// Products that require app user creation
const APP_PRODUCTS = ["content ia", "pro"];

/**
 * POST /api/webhooks/ghl-sale
 *
 * Called by GoHighLevel Workflow on "Order Submitted".
 * Creates Account + User in Airtable, invites via Supabase (email with magic link).
 * Only processes orders for Content IA and Pro products (ignores Bots IA).
 *
 * Auth: Bearer token | X-Api-Key | X-Webhook-Secret (unified GHL_API_KEY)
 * Idempotent: if user with email already exists, returns existing data.
 */
export async function POST(request: Request) {
  if (!authenticateWebhook(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const contactEmail = body.contact_email || body.email;
    const contactName = body.contact_name || body.full_name || body.name || "";
    const companyName = body.company_name || body.business_name || contactName;
    const plan = body.plan || body.product_name || body.product || null;
    const industria = body.industria || body.industry;
    const phone = body.contact_phone || body.phone;

    // Skip products that don't need app access (e.g. "Bots IA")
    if (plan && !APP_PRODUCTS.includes(plan.toLowerCase())) {
      return NextResponse.json({
        success: true,
        status: "skipped",
        reason: `Product "${plan}" does not require app user creation`,
      });
    }

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
      ...(plan && { Plan: plan }),
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

    const warnings: string[] = [];
    if (!plan) warnings.push("No plan/product received — set it manually in Airtable");
    if (supabaseResult.warning) warnings.push(supabaseResult.warning);

    return NextResponse.json({
      success: true,
      status: "created",
      account_airtable_id: account.id,
      user_airtable_id: user.id,
      supabase_user_id: supabaseResult.userId,
      email: supabaseResult.email,
      ...(plan && { plan }),
      ...(phone && { phone }),
      ...(warnings.length > 0 && { warnings }),
    });
  } catch (error) {
    console.error("GHL sale webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
