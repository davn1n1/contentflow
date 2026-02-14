/**
 * Next.js Instrumentation — runs once when the server starts.
 *
 * In development mode, sets up a periodic KB sync (every 60 minutes)
 * so the help articles stay updated while working locally.
 *
 * In production, Vercel Cron handles this via /api/cron/kb-sync.
 */
export async function register() {
  // Only run KB auto-sync in development on the server
  if (process.env.NODE_ENV !== "development") return;
  if (typeof window !== "undefined") return; // skip client bundle

  const KB_SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  // Delay initial sync by 30 seconds to let the dev server finish booting
  setTimeout(async () => {
    console.log("[KB Dev Sync] Starting automatic KB sync (every 60 min)...");
    await syncOnce();

    // Set up recurring sync
    setInterval(syncOnce, KB_SYNC_INTERVAL_MS);
  }, 30_000);
}

async function syncOnce() {
  try {
    // Dynamic import to avoid bundling in production
    const { runKBSync } = await import("@/lib/kb/sync");
    const result = await runKBSync();

    if (result.generated > 0) {
      console.log(
        `[KB Dev Sync] Generated ${result.generated} new articles, embedded ${result.embedded}, failed ${result.failed}. New: ${result.newSlugs.join(", ")}`
      );
    } else {
      console.log(
        `[KB Dev Sync] No new articles (checked ${result.checked}, existing ${result.existing})`
      );
    }
  } catch (err) {
    console.warn(
      "[KB Dev Sync] Failed:",
      err instanceof Error ? err.message : err
    );
  }
}
