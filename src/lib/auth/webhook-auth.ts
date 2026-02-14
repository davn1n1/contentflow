const GHL_API_KEY =
  process.env.GHL_API_KEY || process.env.GHL_WEBHOOK_SECRET || "";

/**
 * Validates a webhook request using multiple auth methods (in priority order):
 * 1. Authorization: Bearer <token>  (GHL native auth dropdown)
 * 2. X-Api-Key: <token>             (unified header style)
 * 3. X-Webhook-Secret: <token>      (legacy)
 */
export function authenticateWebhook(request: Request): boolean {
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
