"use client";

import { useEffect, useState } from "react";
import { Clock, Plus, ChevronDown } from "lucide-react";
import { useChatStore } from "@/lib/stores/chat-store";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export function ChatConversationPicker() {
  const { conversationId, setConversationId, startNewConversation } = useChatStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch("/api/chat/conversations");
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } catch {
        // Silently fail
      }
    }
    if (isOpen) loadConversations();
  }, [isOpen]);

  function formatTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Clock className="w-3 h-3" />
        <span>Historial</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-xl z-20 overflow-hidden chat-slide-up">
            {/* New conversation */}
            <button
              onClick={() => {
                startNewConversation();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primary hover:bg-primary/5 transition-colors border-b border-border"
            >
              <Plus className="w-3 h-3" />
              <span>Nueva conversacion</span>
            </button>

            {/* Conversation list */}
            <div className="max-h-48 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                  Sin conversaciones previas
                </div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setConversationId(c.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                      c.id === conversationId
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className="flex-1 truncate text-left">
                      {c.title || "Sin titulo"}
                    </span>
                    <span className="text-muted-foreground flex-shrink-0">
                      {formatTime(c.updated_at)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
