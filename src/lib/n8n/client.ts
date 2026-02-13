const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://fxforaliving.app.n8n.cloud/webhook/GeneradorYoutube365Full";

export type PipelineAction =
  | "GenerateCopy"
  | "GenerateAudio"
  | "GenerateAvatars"
  | "ProcesoFinalRender";

export async function triggerN8nWorkflow(action: PipelineAction, recordId: string) {
  const url = `${N8N_WEBHOOK_URL}?action=${action}&recordID=${recordId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
