import { createClient } from "./client";

/**
 * Helper to query the contentflow schema.
 * Supabase's type system doesn't support custom schemas without codegen,
 * so we cast results at the boundary.
 */
export function contentflowDb() {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase.schema("contentflow" as any) as any;
}
