import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/auth/api-guard";
import { airtableCreate, TABLES } from "@/lib/airtable/client";
import { fetchYouTubeTranscript, isYouTubeUrl } from "@/lib/onboarding/youtube-transcript";
import { fetchBlogContent } from "@/lib/onboarding/blog-extractor";
import { analyzeVoiceFromText } from "@/lib/onboarding/voice-analyzer";

/**
 * POST /api/onboarding/analyze-voice
 *
 * Fetches content from a URL (YouTube or blog), analyzes voice style with AI,
 * saves a VoiceDNA Source record, and returns the analysis.
 */
export async function POST(request: Request) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  try {
    const { url, accountId } = await request.json();

    if (!url || !accountId) {
      return NextResponse.json(
        { error: "Missing required fields: url, accountId" },
        { status: 400 }
      );
    }

    // 1. Detect URL type and fetch content
    const isYT = isYouTubeUrl(url);
    let transcript: string;
    let sourceType: "youtube" | "blog";

    if (isYT) {
      sourceType = "youtube";
      transcript = await fetchYouTubeTranscript(url);
    } else {
      sourceType = "blog";
      transcript = await fetchBlogContent(url);
    }

    // 2. Save VoiceDNA Source record
    let sourceRecordId: string | undefined;
    try {
      const source = await airtableCreate(TABLES.VOICEDNA_SOURCES, {
        SourceType: sourceType,
        SourceURL: url,
        TranscriptRaw: transcript.slice(0, 100000), // Airtable text field limit
        Status_Transcript: "Processed",
        Account: [accountId],
      });
      sourceRecordId = source.id;
    } catch (err) {
      // Non-critical: continue with analysis even if source save fails
      console.error("Failed to save VoiceDNA source:", err);
    }

    // 3. Analyze with AI
    const analysis = await analyzeVoiceFromText(transcript);

    return NextResponse.json({
      source_type: sourceType,
      transcript: transcript.slice(0, 500) + (transcript.length > 500 ? "..." : ""),
      analysis,
      sourceRecordId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al analizar el contenido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
