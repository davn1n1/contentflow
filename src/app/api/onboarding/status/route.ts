import { NextRequest, NextResponse } from "next/server";
import { airtableFetch, TABLES } from "@/lib/airtable/client";
import { authenticateApiRequest } from "@/lib/auth/api-guard";

/**
 * GET /api/onboarding/status?accountId=recXXX
 *
 * Checks if the current user's account has completed onboarding
 * by looking for records in persona, voicedna, audiencia tables.
 */

async function resolveAccountName(accountId: string): Promise<string | null> {
  const result = await airtableFetch<{ Name?: string }>(TABLES.ACCOUNT, {
    filterByFormula: `RECORD_ID()='${accountId}'`,
    fields: ["Name"],
    maxRecords: 1,
  });
  return result.records[0]?.fields?.Name || null;
}

async function hasRecordsForAccount(
  tableId: string,
  accountName: string
): Promise<boolean> {
  try {
    const { records } = await airtableFetch(tableId, {
      filterByFormula: `FIND('${accountName}', ARRAYJOIN({🏢Account}, ','))`,
      maxRecords: 1,
      fields: ["Name"],
    });
    return records.length > 0;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json(
      { error: "Missing accountId parameter" },
      { status: 400 }
    );
  }

  try {
    // Get account details
    const accountResult = await airtableFetch<{
      Name?: string;
      Status?: string;
      Product?: string;
      Industria?: string[];
    }>(TABLES.ACCOUNT, {
      filterByFormula: `RECORD_ID()='${accountId}'`,
      fields: ["Name", "Status", "Product", "Industria"],
      maxRecords: 1,
    });

    if (accountResult.records.length === 0) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    const account = accountResult.records[0].fields;
    const accountName = account.Name || "";

    // Check each onboarding step in parallel
    const [hasPersona, hasVoiceDNA, hasAudiencia] = await Promise.all([
      hasRecordsForAccount(TABLES.PERSONA, accountName),
      hasRecordsForAccount(TABLES.VOICEDNA, accountName),
      hasRecordsForAccount(TABLES.AUDIENCIA, accountName),
    ]);

    const brandComplete = !!(account.Product && account.Industria?.length);
    const configComplete = account.Status !== "Onboarding";

    const completedSteps = {
      brand: brandComplete,
      persona: hasPersona,
      voicedna: hasVoiceDNA,
      audiencia: hasAudiencia,
      config: configComplete,
    };

    const needsOnboarding =
      account.Status === "Onboarding" ||
      !brandComplete ||
      !hasPersona ||
      !hasVoiceDNA ||
      !hasAudiencia;

    return NextResponse.json({
      needsOnboarding,
      completedSteps,
      accountId,
      accountName,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
