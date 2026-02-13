"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useHelpArticles } from "@/lib/hooks/use-help-articles";
import { HELP_CATEGORIES, type HelpCategory } from "@/types/chat";

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const { data: articles, isLoading } = useHelpArticles({ category });

  const categoryInfo = HELP_CATEGORIES[category as HelpCategory];
  const categoryLabel = categoryInfo?.label || category;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/help" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" />
          Centro de Ayuda
        </Link>
        <span>/</span>
        <span className="text-foreground">{categoryLabel}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">{categoryLabel}</h1>
        {categoryInfo?.description && (
          <p className="text-muted-foreground text-sm mt-1">{categoryInfo.description}</p>
        )}
      </div>

      {/* Articles */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : articles && articles.length > 0 ? (
        <div className="space-y-2">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/help/articles/${article.slug}`}
              className="block p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <h3 className="text-sm font-medium text-foreground">{article.title}</h3>
              {article.summary && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {article.summary}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            No hay articulos en esta categoria todavia
          </p>
        </div>
      )}
    </div>
  );
}
