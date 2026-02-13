"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { Bot, User } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import { ChatToolResult } from "./chat-tool-result";

interface ChatMessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Hola, soy tu asistente</p>
            <p className="text-xs text-muted-foreground mt-1">
              Puedo ayudarte con el estado de tus videos, resolver dudas y guiarte por la plataforma.
            </p>
          </div>
          <div className="space-y-1.5">
            <SuggestionChip text="¿Cual es el estado de mi ultimo video?" />
            <SuggestionChip text="¿Como creo un nuevo video?" />
            <SuggestionChip text="¿Que hago si el audio falla?" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {messages.map((message) => {
        const text = getMessageText(message);
        const toolParts = message.parts.filter(
          (p) => p.type.startsWith("tool-") || p.type === "dynamic-tool"
        );

        return (
          <div key={message.id}>
            {/* Tool invocations */}
            {toolParts.map((part, i) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const tp = part as any;
              const toolName = tp.type.startsWith("tool-")
                ? tp.type.slice(5)
                : "unknown";
              const state = tp.state === "output-available" ? "result" : "call";
              return (
                <div key={`tool-${tp.toolCallId || i}`} className="mb-2">
                  <ChatToolResult
                    toolName={toolName}
                    state={state}
                    result={state === "result" ? tp.output : undefined}
                  />
                </div>
              );
            })}

            {/* Message text content */}
            {text && (
              <div
                className={`flex gap-2 ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                    message.role === "user" ? "bg-primary/20" : "bg-accent"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  )}
                </div>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border rounded-tl-sm"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="text-sm whitespace-pre-wrap">{text}</p>
                  ) : (
                    <MarkdownRenderer content={text} />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Typing indicator */}
      {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
        <div className="flex gap-2">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="bg-card border border-border rounded-xl rounded-tl-sm px-4 py-3">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground chat-typing-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground chat-typing-dot" style={{ animationDelay: "0.2s" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground chat-typing-dot" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function SuggestionChip({ text }: { text: string }) {
  return (
    <div className="text-xs text-muted-foreground bg-card border border-border rounded-lg px-3 py-2 cursor-default hover:border-primary/30 transition-colors">
      {text}
    </div>
  );
}
