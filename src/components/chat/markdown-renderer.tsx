"use client";

import Link from "next/link";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushList() {
    if (listItems.length > 0 && listType) {
      const Tag = listType;
      elements.push(
        <Tag
          key={`list-${elements.length}`}
          className={listType === "ul" ? "list-disc pl-4 space-y-1" : "list-decimal pl-4 space-y-1"}
        >
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </Tag>
      );
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

    // Headers
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-foreground mt-3 mb-1">
          {renderInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-sm font-bold text-foreground mt-3 mb-1">
          {renderInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-base font-bold text-foreground mt-3 mb-1">
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
        const isInternal = url.startsWith("/");
        if (isInternal) {
          parts.push(
            <Link
              key={keyIdx++}
              href={url}
              className="text-primary hover:underline"
            >
              {first.match[1]}
            </Link>
          );
        } else {
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
        }
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
