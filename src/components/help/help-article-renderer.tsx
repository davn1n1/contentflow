"use client";

/**
 * Rich markdown renderer for Help Center articles.
 * Larger typography and more spacing than the chat MarkdownRenderer (which is compact for the widget).
 * Supports: headers, lists, callouts, code blocks, blockquotes, horizontal rules, inline formatting.
 */

interface HelpArticleRendererProps {
  content: string;
}

/** Detect callout type from leading emoji in a blockquote line */
function detectCalloutType(text: string): {
  type: "tip" | "warning" | "success" | "info" | "error" | "quote";
  content: string;
} {
  const trimmed = text.trimStart();
  if (/^[💡🔑]/.test(trimmed)) return { type: "tip", content: trimmed.replace(/^[💡🔑]\s*/, "") };
  if (/^[⚠️🚨]/.test(trimmed)) return { type: "warning", content: trimmed.replace(/^[⚠️🚨]\s*/, "") };
  if (/^[✅✓]/.test(trimmed)) return { type: "success", content: trimmed.replace(/^[✅✓]\s*/, "") };
  if (/^[ℹ️📌]/.test(trimmed)) return { type: "info", content: trimmed.replace(/^[ℹ️📌]\s*/, "") };
  if (/^[❌🛑]/.test(trimmed)) return { type: "error", content: trimmed.replace(/^[❌🛑]\s*/, "") };
  return { type: "quote", content: trimmed };
}

const CALLOUT_STYLES = {
  tip: {
    bg: "bg-primary/8",
    border: "border-primary/30",
    label: "Tip",
    labelColor: "text-primary",
  },
  warning: {
    bg: "bg-warning/8",
    border: "border-warning/30",
    label: "Aviso",
    labelColor: "text-warning",
  },
  success: {
    bg: "bg-success/8",
    border: "border-success/30",
    label: "Listo",
    labelColor: "text-success",
  },
  info: {
    bg: "bg-info/8",
    border: "border-info/30",
    label: "Info",
    labelColor: "text-info",
  },
  error: {
    bg: "bg-destructive/8",
    border: "border-destructive/30",
    label: "Error",
    labelColor: "text-destructive",
  },
  quote: {
    bg: "bg-muted/30",
    border: "border-muted-foreground/20",
    label: "",
    labelColor: "text-muted-foreground",
  },
} as const;

export function HelpArticleRenderer({ content }: HelpArticleRendererProps) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushList() {
    if (listItems.length > 0 && listType) {
      if (listType === "ol") {
        elements.push(
          <ol
            key={`list-${elements.length}`}
            className="pl-0 space-y-2.5 my-4"
          >
            {listItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="flex-1 leading-relaxed">{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul
            key={`list-${elements.length}`}
            className="pl-0 space-y-2 my-4"
          >
            {listItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary/40 mt-2" />
                <span className="flex-1 leading-relaxed">{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        );
      }
      listItems = [];
      listType = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bullet list
    if (/^[-*]\s+/.test(line)) {
      if (listType !== "ul") flushList();
      listType = "ul";
      listItems.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      if (listType !== "ol") flushList();
      listType = "ol";
      listItems.push(line.replace(/^\d+\.\s+/, ""));
      continue;
    }

    flushList();

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line)) {
      elements.push(
        <hr
          key={`hr-${i}`}
          className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
        />
      );
      continue;
    }

    // Blockquote / Callout
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [line.slice(2)];
      while (i + 1 < lines.length && lines[i + 1].startsWith("> ")) {
        i++;
        quoteLines.push(lines[i].slice(2));
      }
      const fullText = quoteLines.join("\n");
      const { type, content: calloutContent } = detectCalloutType(fullText);
      const styles = CALLOUT_STYLES[type];

      elements.push(
        <div
          key={`callout-${i}`}
          className={`my-5 px-5 py-4 rounded-xl border-l-4 ${styles.bg} ${styles.border}`}
        >
          {styles.label && (
            <span className={`text-xs font-bold uppercase tracking-wider ${styles.labelColor} block mb-1.5`}>
              {styles.label}
            </span>
          )}
          <span className="text-foreground leading-relaxed">
            {renderInline(calloutContent)}
          </span>
        </div>
      );
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-base font-semibold text-primary mt-6 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary/50 flex-shrink-0" />
          {renderInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-lg font-bold text-foreground mt-8 mb-3 pl-3 border-l-3 border-primary/50">
          {renderInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-xl font-bold mt-8 mb-4 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary">
          {renderInline(line.slice(2))}
        </h1>
      );
      continue;
    }

    // Code block
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre
          key={`code-${elements.length}`}
          className="bg-background border border-border rounded-xl p-4 text-sm overflow-x-auto my-4 font-mono"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="mb-3 leading-relaxed text-foreground/90">
        {renderInline(line)}
      </p>
    );
  }

  flushList();

  return <div className="text-[15px] leading-relaxed space-y-1">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);

    const matches = [
      boldMatch ? { type: "bold", match: boldMatch } : null,
      codeMatch ? { type: "code", match: codeMatch } : null,
      linkMatch ? { type: "link", match: linkMatch } : null,
      italicMatch ? { type: "italic", match: italicMatch } : null,
    ]
      .filter(Boolean)
      .sort((a, b) => (a!.match.index || 0) - (b!.match.index || 0));

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const first = matches[0]!;
    const idx = first.match.index || 0;

    if (idx > 0) {
      parts.push(remaining.slice(0, idx));
    }

    switch (first.type) {
      case "bold":
        parts.push(
          <strong key={keyIdx++} className="font-semibold text-foreground">
            {first.match[1]}
          </strong>
        );
        remaining = remaining.slice(idx + first.match[0].length);
        break;
      case "code":
        parts.push(
          <code
            key={keyIdx++}
            className="bg-background border border-border px-1.5 py-0.5 rounded-md text-sm text-primary font-mono"
          >
            {first.match[1]}
          </code>
        );
        remaining = remaining.slice(idx + first.match[0].length);
        break;
      case "link": {
        const url = first.match[2];
        const isInternal = url.startsWith("/");
        parts.push(
          <a
            key={keyIdx++}
            href={url}
            target={isInternal ? undefined : "_blank"}
            rel={isInternal ? undefined : "noopener noreferrer"}
            className="text-primary font-medium hover:underline underline-offset-2"
          >
            {first.match[1]}
          </a>
        );
        remaining = remaining.slice(idx + first.match[0].length);
        break;
      }
      case "italic":
        parts.push(
          <em key={keyIdx++} className="text-foreground/80">{first.match[1]}</em>
        );
        remaining = remaining.slice(idx + first.match[0].length);
        break;
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
