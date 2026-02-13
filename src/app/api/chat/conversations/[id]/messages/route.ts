import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const supabase = await createClient();

  // Verify the conversation belongs to the user
  const { data: conv } = await supabase
    .from("chat_conversations")
    .select("id")
    .eq("id", id)
    .eq("user_id", auth.user.userId)
    .single();

  if (!conv) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Fetch messages
  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, tool_calls, tool_results, created_at")
    .eq("conversation_id", id)
    .order("created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(messages || []);
}
