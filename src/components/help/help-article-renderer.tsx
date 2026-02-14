"use client";

interface HelpArticleRendererProps {
  content: string;
}

export function HelpArticleRenderer({ content }: HelpArticleRendererProps) {
  return (
    <div
      className="prose prose-invert prose-sm max-w-none
        prose-headings:text-foreground prose-headings:font-semibold
        prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
        prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
        prose-p:text-muted-foreground prose-p:leading-relaxed
        prose-strong:text-foreground
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-normal
        prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg
        prose-ul:text-muted-foreground prose-ol:text-muted-foreground
        prose-li:marker:text-muted-foreground/50"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
