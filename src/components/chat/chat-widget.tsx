"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { MessageCircle, X, Minus } from "lucide-react";
import { useChatStore } from "@/lib/stores/chat-store";
import { useAccountStore } from "@/lib/stores/account-store";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { ChatConversationPicker } from "./chat-conversation-picker";

export function ChatWidget() {
  const { isOpen, toggleChat, setOpen, conversationId, setConversationId, addRecentConversation } =
    useChatStore();
  const { currentAccount } = useAccountStore();
  const [inputValue, setInputValue] = useState("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          conversationId,
          accountId: currentAccount?.airtable_id || currentAccount?.id,
          accountName: currentAccount?.name,
        },
      }),
    [conversationId, currentAccount]
  );

  const {
    messages,
    sendMessage,
    status,
    setMessages,
    error,
  } = useChat({
    transport,
    onError: (err) => {
      console.error("[Chat] Error:", err);
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Load conversation messages when switching conversations
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      try {
        const res = await fetch(`/api/chat/conversations/${conversationId}/messages`);
        if (res.ok) {
          const data = await res.json();
          const chatMessages = data
            .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
            .map((m: { id: string; role: string; content: string }) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              parts: [{ type: "text" as const, text: m.content }],
            }));
          setMessages(chatMessages);
        }
      } catch {
        // Failed to load — start fresh
      }
    }

    loadMessages();
  }, [conversationId, setMessages]);

  // Track conversation ID from first message
  useEffect(() => {
    if (messages.length > 0 && !conversationId) {
      // After first exchange, messages are tracked via the API
      const firstUserText = messages
        .find((m) => m.role === "user")
        ?.parts.find((p): p is { type: "text"; text: string } => p.type === "text")
        ?.text;

      if (firstUserText) {
        addRecentConversation({
          id: `temp-${Date.now()}`,
          title: firstUserText.slice(0, 60),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }, [messages, conversationId, addRecentConversation]);

  const onSubmit = useCallback(() => {
    if (inputValue.trim() && !isLoading) {
      sendMessage({ text: inputValue });
      setInputValue("");
    }
  }, [inputValue, isLoading, sendMessage]);

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 flex items-center justify-center pulse-glow"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[560px] flex flex-col rounded-2xl overflow-hidden border border-border shadow-2xl chat-slide-up bg-background">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-sm font-semibold text-foreground">
                  Soporte ContentFlow
                </span>
              </div>
              <ChatConversationPicker />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Minimizar"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <ChatMessages messages={messages} isLoading={isLoading} />

          {/* Error banner */}
          {error && (
            <div className="px-3 py-2 text-xs text-destructive bg-destructive/10 border-t border-destructive/20">
              Error: {error.message || "No se pudo conectar con el asistente"}
            </div>
          )}

          {/* Input */}
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
        </div>
      )}
    </>
  );
}
