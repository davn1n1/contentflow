"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useHelpArticle } from "@/lib/hooks/use-help-articles";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import { HELP_CATEGORIES, type HelpCategory } from "@/types/chat";

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: article, isLoading, error } = useHelpArticle(slug);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 flex justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <p className="text-muted-foreground">Articulo no encontrado</p>
        <Link href="/help" className="text-primary text-sm hover:underline mt-2 inline-block">
          Volver al Centro de Ayuda
        </Link>
      </div>
    );
  }

  const categoryLabel = HELP_CATEGORIES[article.category as HelpCategory]?.label || article.category;

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
        <span className="text-foreground">{article.title}</span>
      </div>

      {/* Article header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">{article.title}</h1>
        {article.summary && (
          <p className="text-muted-foreground">{article.summary}</p>
        )}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Article content */}
      <div className="bg-card border border-border rounded-xl p-6">
        <MarkdownRenderer content={article.content} />
      </div>
    </div>
  );
}
