import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Transcribe a call recording using OpenAI Whisper.
 * Downloads the audio from the URL and sends it to Whisper API.
 */
export async function transcribeRecording(
  recordingUrl: string
): Promise<{ text: string; durationSeconds: number }> {
  const response = await fetch(recordingUrl);
  if (!response.ok) {
    throw new Error(`Failed to download recording: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const file = new File([buffer], "recording.mp3", { type: "audio/mpeg" });

  const transcription = await getOpenAI().audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "es",
    response_format: "verbose_json",
  });

  return {
    text: transcription.text,
    durationSeconds: Math.round(
      (transcription as unknown as { duration?: number }).duration ?? 0
    ),
  };
}
