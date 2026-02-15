"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { Bot, User, Sparkles, MessageSquare, HelpCircle, Wrench } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import { ChatToolResult } from "./chat-tool-result";

interface PageSuggestion {
  text: string;
  icon: "message" | "help" | "tool";
  accent: "primary" | "success" | "warning";
}

interface ChatMessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
  suggestions?: PageSuggestion[];
  onSuggestionClick?: (text: string) => void;
}

const SUGGESTION_ICONS = {
  message: <MessageSquare className="w-3 h-3" />,
  help: <HelpCircle className="w-3 h-3" />,
  tool: <Wrench className="w-3 h-3" />,
};

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function ChatMessages({ messages, isLoading, suggestions, onSuggestionClick }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    const chips = suggestions || [];

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(41,150,215,0.08)_0%,transparent_70%)]" />

        <div className="text-center space-y-4 relative z-10">
          {/* Animated bot icon with gradient ring */}
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-info/20 animate-pulse" />
            <div className="absolute inset-1 rounded-full bg-background" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">
              Hola, soy tu asistente
            </p>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-[280px] mx-auto leading-relaxed">
              Puedo ayudarte con tus videos, resolver dudas y guiarte por la plataforma.
            </p>
          </div>

          {/* Dynamic suggestion chips — change per page */}
          <div className="space-y-2 pt-1">
            {chips.map((chip, i) => (
              <SuggestionChip
                key={i}
                icon={SUGGESTION_ICONS[chip.icon]}
                text={chip.text}
                accent={chip.accent}
                onClick={() => onSuggestionClick?.(chip.text)}
              />
            ))}
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

const ACCENT_STYLES = {
  primary: "hover:border-primary/40 hover:bg-primary/5 text-primary/70",
  success: "hover:border-success/40 hover:bg-success/5 text-success/70",
  warning: "hover:border-warning/40 hover:bg-warning/5 text-warning/70",
} as const;

function SuggestionChip({
  text,
  icon,
  accent = "primary",
  onClick,
}: {
  text: string;
  icon?: React.ReactNode;
  accent?: keyof typeof ACCENT_STYLES;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-200 w-full text-left ${ACCENT_STYLES[accent]}`}
    >
      {icon && <span className="flex-shrink-0 opacity-60">{icon}</span>}
      <span>{text}</span>
    </button>
  );
}
