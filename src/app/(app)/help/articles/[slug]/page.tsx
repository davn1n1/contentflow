"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Tag,
  Rocket,
  PenTool,
  Mic,
  Video,
  Upload,
  AlertTriangle,
  Settings,
  Film,
  FileText,
} from "lucide-react";
import { useHelpArticle } from "@/lib/hooks/use-help-articles";
import { HelpArticleRenderer } from "@/components/help/help-article-renderer";
import { HELP_CATEGORIES, type HelpCategory } from "@/types/chat";

const CATEGORY_ICONS: Record<HelpCategory, React.ComponentType<{ className?: string }>> = {
  "getting-started": Rocket,
  "copy-script": PenTool,
  audio: Mic,
  video: Video,
  render: Upload,
  troubleshooting: AlertTriangle,
  account: Settings,
  remotion: Film,
};

const CATEGORY_COLORS: Record<HelpCategory, string> = {
  "getting-started": "#3b82f6",
  "copy-script": "#a855f7",
  audio: "#f59e0b",
  video: "#10b981",
  render: "#ef4444",
  troubleshooting: "#f97316",
  account: "#06b6d4",
  remotion: "#8b5cf6",
};

/** Estimate reading time based on word count (200 wpm average) */
function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: article, isLoading, error } = useHelpArticle(slug);

  const readingTime = useMemo(
    () => (article ? estimateReadingTime(article.content) : 0),
    [article]
  );

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 flex justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-3">
        <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto" />
        <p className="text-muted-foreground">Articulo no encontrado</p>
        <Link href="/help" className="text-primary text-sm hover:underline inline-block">
          Volver al Centro de Ayuda
        </Link>
      </div>
    );
  }

  const categoryLabel = HELP_CATEGORIES[article.category as HelpCategory]?.label || article.category;
  const color = CATEGORY_COLORS[article.category as HelpCategory] || "#3b82f6";
  const Icon = CATEGORY_ICONS[article.category as HelpCategory] || FileText;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/help" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" />
          Centro de Ayuda
        </Link>
        <span>/</span>
        <Link
          href={`/help/category/${article.category}`}
          className="hover:text-foreground transition-colors"
        >
          {categoryLabel}
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">{article.title}</span>
      </div>

      {/* Article header with colored accent */}
      <div className="relative overflow-hidden rounded-xl border border-border p-6" style={{ borderColor: `${color}25` }}>
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${color}08, transparent 50%)` }}
        />
        <div className="relative z-10 space-y-4">
          {/* Category badge + reading time */}
          <div className="flex items-center gap-3">
            <Link
              href={`/help/category/${article.category}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
              style={{
                backgroundColor: `${color}15`,
                color,
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {categoryLabel}
            </Link>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {readingTime} min de lectura
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground leading-tight">{article.title}</h1>

          {/* Summary */}
          {article.summary && (
            <p className="text-muted-foreground leading-relaxed">{article.summary}</p>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 border border-border text-xs text-muted-foreground"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Article content */}
      <div className="bg-card border border-border rounded-xl p-8">
        <HelpArticleRenderer content={article.content} />
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between pt-2 pb-4">
        <Link
          href={`/help/category/${article.category}`}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Mas articulos de {categoryLabel}
        </Link>
        <Link
          href="/help"
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Centro de Ayuda
        </Link>
      </div>
    </div>
  );
}
