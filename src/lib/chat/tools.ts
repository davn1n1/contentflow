import { z } from "zod";
import { airtableFetch, TABLES } from "@/lib/airtable/client";
import { createClient as createSupabaseServer } from "@/lib/supabase/server";

// Map pipeline step names to n8n orchestrator action names
const PIPELINE_ACTION_MAP: Record<string, string> = {
  copy: "GenerateCopy",
  audio: "GenerateAudio",
  video: "GenerateAvatars",
  render: "ProcesoFinalRender",
};

export function createChatTools(userAccountIds: string[]) {
  // Build Airtable filter to scope queries to user's accounts
  const accountFilter = userAccountIds.length > 0
    ? `OR(${userAccountIds.map((id) => `FIND('${id}', ARRAYJOIN({🏢Account}))`).join(",")})`
    : "";

  return {
    get_video_status: {
      description:
        "Get the current pipeline status of a video by its record ID or video number. Returns copy, audio, avatar, and render status.",
      inputSchema: z.object({
        videoId: z.string().optional().describe("Airtable record ID (recXXX)"),
        videoNumber: z.number().optional().describe("Video number (e.g. 42)"),
      }),
      execute: async ({ videoId, videoNumber }: { videoId?: string; videoNumber?: number }) => {
        try {
          let filter = "";
          if (videoId) {
            filter = `AND(RECORD_ID()='${videoId}', ${accountFilter})`;
          } else if (videoNumber) {
            filter = `AND({N Video}=${videoNumber}, ${accountFilter})`;
          } else {
            return { error: "Provide either videoId or videoNumber" };
          }

          const { records } = await airtableFetch(TABLES.VIDEOS, {
            filterByFormula: filter,
            fields: [
              "Name", "Titulo Youtube A", "Estado", "N Video",
              "Seguro Creacion Copy", "Status Audio", "Status Avatares",
              "Status Render Video", "url_youtube", "Formato",
            ],
            maxRecords: 1,
          });

          if (records.length === 0) {
            return { error: "Video not found or not accessible" };
          }

          const r = records[0];
          const f = r.fields as Record<string, unknown>;
          return {
            id: r.id,
            number: f["N Video"],
            name: f["Name"],
            title: f["Titulo Youtube A"],
            estado: f["Estado"],
            format: f["Formato"],
            pipeline: {
              copy: f["Seguro Creacion Copy"] ? "completed" : "pending",
              audio: f["Status Audio"] || "pending",
              video: f["Status Avatares"] || "pending",
              render: f["Status Render Video"] || "pending",
            },
            youtube_url: f["url_youtube"] || null,
          };
        } catch (err) {
          return { error: `Failed to fetch video: ${err instanceof Error ? err.message : "unknown"}` };
        }
      },
    },

    search_videos: {
      description:
        "Search videos by name, title, or status within the user's accessible accounts.",
      inputSchema: z.object({
        query: z.string().describe("Search term (name or title)"),
        status: z.string().optional().describe("Filter by Estado field value"),
        limit: z.number().default(10).describe("Max results to return"),
      }),
      execute: async ({ query, status, limit }: { query: string; status?: string; limit: number }) => {
        try {
          const conditions = [accountFilter];

          if (query) {
            conditions.push(
              `OR(FIND(LOWER('${query}'), LOWER({Name})), FIND(LOWER('${query}'), LOWER({Titulo Youtube A})))`
            );
          }
          if (status) {
            conditions.push(`{Estado}='${status}'`);
          }

          const filter = conditions.filter(Boolean).join(",");
          const formula = conditions.length > 1 ? `AND(${filter})` : filter;

          const { records } = await airtableFetch(TABLES.VIDEOS, {
            filterByFormula: formula,
            fields: [
              "Name", "Titulo Youtube A", "Estado", "N Video",
              "Seguro Creacion Copy", "Status Audio", "Status Avatares", "Status Render Video",
            ],
            maxRecords: limit,
            sort: [{ field: "N Video", direction: "desc" }],
          });

          return {
            count: records.length,
            videos: records.map((r) => {
              const f = r.fields as Record<string, unknown>;
              return {
                id: r.id,
                number: f["N Video"],
                name: f["Name"],
                title: f["Titulo Youtube A"],
                estado: f["Estado"],
                pipeline: {
                  copy: f["Seguro Creacion Copy"] ? "✓" : "○",
                  audio: f["Status Audio"] || "○",
                  video: f["Status Avatares"] || "○",
                  render: f["Status Render Video"] || "○",
                },
              };
            }),
          };
        } catch (err) {
          return { error: `Search failed: ${err instanceof Error ? err.message : "unknown"}` };
        }
      },
    },

    get_account_info: {
      description:
        "Get details about the user's account including name, configuration, and status.",
      inputSchema: z.object({
        accountId: z.string().optional().describe("Specific account Airtable record ID"),
      }),
      execute: async ({ accountId }: { accountId?: string }) => {
        try {
          const targetId = accountId || userAccountIds[0];
          if (!targetId || !userAccountIds.includes(targetId)) {
            return { error: "Account not accessible" };
          }

          const { records } = await airtableFetch(TABLES.ACCOUNT, {
            filterByFormula: `RECORD_ID()='${targetId}'`,
            fields: ["Name", "nameapp", "Status", "Industry", "Canal YouTube"],
            maxRecords: 1,
          });

          if (records.length === 0) {
            return { error: "Account not found" };
          }

          const f = records[0].fields as Record<string, unknown>;
          return {
            id: records[0].id,
            name: f["Name"],
            nameapp: f["nameapp"],
            status: f["Status"],
            industry: f["Industry"],
            youtube_channel: f["Canal YouTube"],
          };
        } catch (err) {
          return { error: `Failed to fetch account: ${err instanceof Error ? err.message : "unknown"}` };
        }
      },
    },

    search_help_articles: {
      description:
        "Search the knowledge base for help articles. Use this when the user asks how to do something or needs help with a feature.",
      inputSchema: z.object({
        query: z.string().describe("Search terms in Spanish or English"),
        category: z.string().optional().describe("Category filter: getting-started, copy-script, audio, video, render, troubleshooting, account, remotion"),
      }),
      execute: async ({ query, category }: { query: string; category?: string }) => {
        try {
          const supabase = await createSupabaseServer();

          let dbQuery = supabase
            .from("help_articles")
            .select("id, slug, title, summary, category")
            .eq("published", true)
            .order("sort_order");

          if (category) {
            dbQuery = dbQuery.eq("category", category);
          }

          if (query) {
            dbQuery = dbQuery.textSearch(
              "title",
              query.split(" ").join(" | "),
              { type: "plain", config: "spanish" }
            );
          }

          const { data, error } = await dbQuery.limit(5);

          if (error) {
            // Fallback: simple ILIKE search if full-text fails
            const { data: fallbackData } = await supabase
              .from("help_articles")
              .select("id, slug, title, summary, category")
              .eq("published", true)
              .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`)
              .order("sort_order")
              .limit(5);

            return {
              articles: (fallbackData || []).map((a) => ({
                title: a.title,
                summary: a.summary,
                category: a.category,
                url: `/help/articles/${a.slug}`,
              })),
            };
          }

          return {
            articles: (data || []).map((a) => ({
              title: a.title,
              summary: a.summary,
              category: a.category,
              url: `/help/articles/${a.slug}`,
            })),
          };
        } catch (err) {
          return { error: `Search failed: ${err instanceof Error ? err.message : "unknown"}` };
        }
      },
    },

    retry_pipeline_step: {
      description:
        "Retry a failed pipeline step for a video. Only use when the user explicitly asks to retry. This triggers the n8n workflow to re-execute the step.",
      inputSchema: z.object({
        videoId: z.string().describe("Airtable record ID of the video (recXXX)"),
        step: z
          .enum(["copy", "audio", "video", "render"])
          .describe("Which pipeline step to retry"),
      }),
      execute: async ({ videoId, step }: { videoId: string; step: "copy" | "audio" | "video" | "render" }) => {
        try {
          // Verify the video belongs to user's accounts
          const { records } = await airtableFetch(TABLES.VIDEOS, {
            filterByFormula: `AND(RECORD_ID()='${videoId}', ${accountFilter})`,
            fields: ["Name", "N Video"],
            maxRecords: 1,
          });

          if (records.length === 0) {
            return { error: "Video not found or not accessible" };
          }

          const action = PIPELINE_ACTION_MAP[step];
          if (!action) {
            return { error: `Invalid step: ${step}` };
          }

          // Call the n8n webhook (same pattern as /api/webhooks)
          const webhookUrl = process.env.N8N_WEBHOOK_URL || "";
          const authHeader = process.env.N8N_WEBHOOK_AUTH_HEADER || "X-Api-Key";
          const authValue = process.env.N8N_WEBHOOK_AUTH_VALUE || "";

          const url = `${webhookUrl}?action=${encodeURIComponent(action)}&recordID=${encodeURIComponent(videoId)}`;

          const headers: Record<string, string> = {};
          if (authValue) {
            headers[authHeader] = authValue;
          }

          const response = await fetch(url, { method: "GET", headers });

          if (!response.ok) {
            const errorText = await response.text();
            return { error: `Webhook failed: ${errorText}` };
          }

          const f = records[0].fields as Record<string, unknown>;
          return {
            success: true,
            message: `Step "${step}" has been retriggered for video #${f["N Video"]} (${f["Name"]}). The process is now running in the background.`,
            videoId,
            step,
            action,
          };
        } catch (err) {
          return { error: `Retry failed: ${err instanceof Error ? err.message : "unknown"}` };
        }
      },
    },
  };
}
