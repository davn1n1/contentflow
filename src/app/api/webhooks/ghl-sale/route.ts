import { NextResponse } from "next/server";
import {
  airtableFetch,
  airtableCreate,
  airtableUpdate,
  TABLES,
} from "@/lib/airtable/client";
import { inviteSupabaseUser } from "@/lib/auth/create-supabase-user";
import { createClient } from "@supabase/supabase-js";

const GHL_API_KEY = process.env.GHL_API_KEY || process.env.GHL_WEBHOOK_SECRET || "";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function logWebhookDebug(body: unknown, response: unknown) {
  try {
    await supabaseAdmin.from("webhook_debug_log").insert({
      endpoint: "/api/webhooks/ghl-sale",
      body,
      response,
    });
  } catch {
    // non-critical, don't fail the webhook
  }
}

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
 * Handles both new users and existing users (upgrades, new purchases).
 *
 * - New user: Creates Account + User in Airtable, invites via Supabase.
 * - Existing user: Updates Account Product, logs the purchase.
 *
 * Only processes Content IA and Pro products (ignores Bots IA).
 * Auth: Bearer token | X-Api-Key | X-Webhook-Secret (unified GHL_API_KEY)
 */
/**
 * GET /api/webhooks/ghl-sale?limit=5
 * Debug: returns the last N webhook payloads received (auth required).
 */
export async function GET(request: Request) {
  if (!authenticateWebhook(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 10), 50);
  const { data, error } = await supabaseAdmin
    .from("webhook_debug_log")
    .select("*")
    .eq("endpoint", "/api/webhooks/ghl-sale")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data });
}

export async function POST(request: Request) {
  if (!authenticateWebhook(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Log full body for debugging GHL payload mapping
    console.log("GHL webhook received body:", JSON.stringify(body));

    const contactEmail = body.contact_email || body.email;
    const contactName = body.contact_name || body.full_name || body.name || "";
    const companyName = body.company_name || body.business_name || contactName;
    const plan = body.plan || body.product_name || body.product || null;
    const industria = body.industria || body.industry;
    const phone = body.contact_phone || body.phone;

    // Skip products that don't need app access (e.g. "Bots IA")
    if (plan && !APP_PRODUCTS.includes(plan.toLowerCase())) {
      const resp = { success: true, status: "skipped", reason: `Product "${plan}" does not require app user creation` };
      await logWebhookDebug(body, resp);
      return NextResponse.json({ ...resp, _debug_received_body: body });
    }

    if (!contactEmail) {
      return NextResponse.json(
        { error: "Missing required field: contact_email" },
        { status: 400 }
      );
    }

    const email = contactEmail.trim().toLowerCase();

    // Check if user already exists in Airtable
    const existing = await airtableFetch<{ Email?: string; Account?: string[] }>(
      TABLES.USUARIOS,
      {
        filterByFormula: `LOWER({Email})='${email}'`,
        fields: ["Email", "Account"],
        maxRecords: 1,
      }
    );

    // --- EXISTING USER: update account with new purchase ---
    if (existing.records.length > 0) {
      const userId = existing.records[0].id;
      const accountId = existing.records[0].fields.Account?.[0] || null;

      // Update account Product if we have both accountId and plan
      if (accountId && plan) {
        await airtableUpdate(TABLES.ACCOUNT, accountId, {
          Product: plan,
        });
      }

      const resp = { success: true, status: "existing_user_updated", user_airtable_id: userId, account_airtable_id: accountId, ...(plan && { plan }), ...(phone && { phone }) };
      await logWebhookDebug(body, resp);
      return NextResponse.json({ ...resp, _debug_received_body: body });
    }

    // --- NEW USER: create everything ---
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const account = await airtableCreate(TABLES.ACCOUNT, {
      Name: companyName,
      Status: "En preparación",
      NameApp: slug,
      ...(plan && { Product: plan }),
      ...(industria && { Industria: Array.isArray(industria) ? industria : [industria] }),
    });

    const user = await airtableCreate(TABLES.USUARIOS, {
      Name: contactName,
      Email: email,
      Status: "Activo",
      Rol: ["Admin"],
      Account: [account.id],
    });

    const supabaseResult = await inviteSupabaseUser({
      email,
      name: contactName,
      airtableUserId: user.id,
    });

    const warnings: string[] = [];
    if (!plan) warnings.push("No plan/product received — set it manually in Airtable");
    if (supabaseResult.warning) warnings.push(supabaseResult.warning);

    const resp = { success: true, status: "created", account_airtable_id: account.id, user_airtable_id: user.id, supabase_user_id: supabaseResult.userId, email: supabaseResult.email, ...(plan && { plan }), ...(phone && { phone }), ...(warnings.length > 0 && { warnings }) };
    await logWebhookDebug(body, resp);
    return NextResponse.json({ ...resp, _debug_received_body: body });
  } catch (error) {
    console.error("GHL sale webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
