"use client";

interface MarkdownRendererProps {
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
  tip: "bg-primary/8 border-primary/30 text-primary",
  warning: "bg-warning/8 border-warning/30 text-warning",
  success: "bg-success/8 border-success/30 text-success",
  info: "bg-info/8 border-info/30 text-info",
  error: "bg-destructive/8 border-destructive/30 text-destructive",
  quote: "bg-muted/30 border-muted-foreground/20 text-muted-foreground",
} as const;

const CALLOUT_LABELS: Record<string, string> = {
  tip: "Tip",
  warning: "Aviso",
  success: "Listo",
  info: "Info",
  error: "Error",
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
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
            className="pl-0 space-y-1.5 my-1"
          >
            {listItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="flex-1">{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul
            key={`list-${elements.length}`}
            className="pl-0 space-y-1 my-1"
          >
            {listItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary/50 mt-[7px]" />
                <span className="flex-1">{renderInline(item)}</span>
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

    // Horizontal rule (---, ***, ___)
    if (/^[-*_]{3,}\s*$/.test(line)) {
      elements.push(
        <hr
          key={`hr-${i}`}
          className="my-3 border-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
        />
      );
      continue;
    }

    // Blockquote / Callout (> text) — collect consecutive lines
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [line.slice(2)];
      while (i + 1 < lines.length && lines[i + 1].startsWith("> ")) {
        i++;
        quoteLines.push(lines[i].slice(2));
      }
      const fullText = quoteLines.join("\n");
      const { type, content: calloutContent } = detectCalloutType(fullText);
      const styles = CALLOUT_STYLES[type];
      const label = CALLOUT_LABELS[type];

      elements.push(
        <div
          key={`callout-${i}`}
          className={`my-2 px-3 py-2 rounded-lg border-l-3 ${styles}`}
        >
          {label && (
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block mb-0.5">
              {label}
            </span>
          )}
          <span className="text-foreground text-sm">
            {renderInline(calloutContent)}
          </span>
        </div>
      );
      continue;
    }

    // Headers — visually distinct with colors and backgrounds
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-primary mt-3 mb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
          {renderInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-sm font-bold text-foreground mt-3 mb-1.5 pl-2.5 border-l-2 border-primary/50">
          {renderInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-base font-bold mt-3 mb-2 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
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
          className="bg-background/50 border border-border rounded-md p-2 text-xs overflow-x-auto my-2"
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
      <p key={i} className="mb-1">
        {renderInline(line)}
      </p>
    );
  }

  flushList();

  return <div className="text-sm leading-relaxed space-y-0.5">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Split text into parts: bold, italic, code, links
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Bold **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Inline code `text`
    const codeMatch = remaining.match(/`([^`]+)`/);
    // Link [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    // Italic *text* (but not **)
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);

    // Find the earliest match
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

    // Add text before match
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
            className="bg-background/50 border border-border px-1 py-0.5 rounded text-xs text-primary"
          >
            {first.match[1]}
          </code>
        );
        remaining = remaining.slice(idx + first.match[0].length);
        break;
      case "link": {
        const url = first.match[2];
        // All links from chat open in new tab to preserve user's current page
        parts.push(
          <a
            key={keyIdx++}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {first.match[1]}
          </a>
        );
        remaining = remaining.slice(idx + first.match[0].length);
        break;
      }
      case "italic":
        parts.push(
          <em key={keyIdx++}>{first.match[1]}</em>
        );
        remaining = remaining.slice(idx + first.match[0].length);
        break;
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
