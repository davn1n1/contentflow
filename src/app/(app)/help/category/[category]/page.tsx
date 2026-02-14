"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
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
import { useHelpArticles } from "@/lib/hooks/use-help-articles";
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

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const { data: articles, isLoading } = useHelpArticles({ category });

  const categoryInfo = HELP_CATEGORIES[category as HelpCategory];
  const categoryLabel = categoryInfo?.label || category;
  const color = CATEGORY_COLORS[category as HelpCategory] || "#3b82f6";
  const Icon = CATEGORY_ICONS[category as HelpCategory] || FileText;

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

      {/* Category header with color accent */}
      <div className="relative overflow-hidden rounded-xl border border-border p-6" style={{ borderColor: `${color}30` }}>
        <div
          className="absolute inset-0 opacity-100"
          style={{ background: `linear-gradient(135deg, ${color}10, transparent 60%)` }}
        />
        <div className="relative z-10 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <span style={{ color }}><Icon className="w-7 h-7" /></span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{categoryLabel}</h1>
            {categoryInfo?.description && (
              <p className="text-muted-foreground text-sm mt-1">{categoryInfo.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Articles */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : articles && articles.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium px-1">
            {articles.length} articulo{articles.length !== 1 ? "s" : ""}
          </p>
          {articles.map((article, idx) => (
            <Link
              key={article.id}
              href={`/help/articles/${article.slug}`}
              className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all hover:shadow-md hover:shadow-primary/5"
            >
              {/* Article number */}
              <span
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: `${color}12`,
                  color,
                }}
              >
                {idx + 1}
              </span>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                {article.summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {article.summary}
                  </p>
                )}
              </div>

              <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 rounded-xl border border-dashed border-border">
          <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            No hay articulos en esta categoria todavia
          </p>
          <Link href="/help" className="text-primary text-xs hover:underline mt-2 inline-block">
            Volver al Centro de Ayuda
          </Link>
        </div>
      )}
    </div>
  );
}
