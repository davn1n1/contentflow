import { NextResponse } from "next/server";
import { airtableCreate, airtableUpdate, TABLES } from "@/lib/airtable/client";
import { authenticateApiRequest } from "@/lib/auth/api-guard";

type OnboardingStep = "brand" | "persona" | "voicedna" | "audiencia" | "config";

interface SaveStepBody {
  step: OnboardingStep;
  accountId: string;
  data: Record<string, unknown>;
  recordId?: string;
}

// Map step to Airtable table
const STEP_TABLE: Record<OnboardingStep, string | null> = {
  brand: null, // Updates Account directly
  persona: TABLES.PERSONA,
  voicedna: TABLES.VOICEDNA,
  audiencia: TABLES.AUDIENCIA,
  config: null, // Updates Account directly
};

/**
 * POST /api/onboarding/save-step
 *
 * Saves a single onboarding step to Airtable.
 * For "brand" and "config", updates the Account record.
 * For other steps, creates/updates records in the respective table.
 */
export async function POST(request: Request) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const body: SaveStepBody = await request.json();
    const { step, accountId, data, recordId } = body;

    if (!step || !accountId || !data) {
      return NextResponse.json(
        { error: "Missing required fields: step, accountId, data" },
        { status: 400 }
      );
    }

    if (!STEP_TABLE.hasOwnProperty(step)) {
      return NextResponse.json(
        { error: `Invalid step: ${step}` },
        { status: 400 }
      );
    }

    let result;

    if (step === "brand") {
      // Update Account record with brand info
      result = await airtableUpdate(TABLES.ACCOUNT, accountId, data);
      return NextResponse.json({
        success: true,
        step,
        recordId: accountId,
      });
    }

    if (step === "config") {
      // Mark onboarding as complete
      result = await airtableUpdate(TABLES.ACCOUNT, accountId, {
        Status: "Activo",
        ...data,
      });
      return NextResponse.json({
        success: true,
        step,
        recordId: accountId,
      });
    }

    // For persona, voicedna, audiencia: create or update
    const tableId = STEP_TABLE[step]!;

    if (recordId) {
      result = await airtableUpdate(tableId, recordId, data);
    } else {
      result = await airtableCreate(tableId, {
        ...data,
        Account: [accountId],
      });
    }

    return NextResponse.json({
      success: true,
      step,
      recordId: result.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
