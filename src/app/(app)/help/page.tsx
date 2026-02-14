"use client";

import { useState, useDeferredValue } from "react";
import Link from "next/link";
import {
  Search,
  Rocket,
  PenTool,
  Mic,
  Video,
  Upload,
  AlertTriangle,
  Settings,
  Film,
  BookOpen,
  ArrowRight,
  Sparkles,
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

export default function HelpPage() {
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);
  const isSearching = deferredSearch.length > 0;

  const { data: articles, isLoading } = useHelpArticles(
    isSearching ? { query: deferredSearch } : undefined
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero section with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-card to-info/10 border border-primary/20 px-8 py-10">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-info/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            47 articulos en 9 categorias
          </div>
          <h1 className="text-3xl font-bold text-foreground">Centro de Ayuda</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Guias, tutoriales y soluciones para dominar tu pipeline de produccion de video
          </p>

          {/* Search inside hero */}
          <div className="relative max-w-lg mx-auto pt-2">
            <Search className="absolute left-4 top-1/2 mt-1 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar articulos, guias, soluciones..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-background/80 backdrop-blur-sm border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 shadow-lg shadow-black/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Search results */}
      {isSearching && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            {isLoading ? "Buscando..." : `${articles?.length || 0} resultado(s)`}
          </h2>
          {articles?.map((article) => {
            const color = CATEGORY_COLORS[article.category as HelpCategory];
            const Icon = CATEGORY_ICONS[article.category as HelpCategory];
            return (
              <Link
                key={article.id}
                href={`/help/articles/${article.slug}`}
                className="group flex items-start gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all hover:shadow-md hover:shadow-primary/5"
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: `${color}15` }}
                >
                  {Icon && <span style={{ color }}><Icon className="w-5 h-5" /></span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
                      style={{
                        backgroundColor: `${color}15`,
                        color,
                      }}
                    >
                      {HELP_CATEGORIES[article.category as HelpCategory]?.label || article.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {article.summary}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors mt-1 flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Category grid */}
      {!isSearching && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.entries(HELP_CATEGORIES) as [HelpCategory, typeof HELP_CATEGORIES[HelpCategory]][]).map(
            ([key, cat]) => {
              const Icon = CATEGORY_ICONS[key];
              const color = CATEGORY_COLORS[key];

              return (
                <Link
                  key={key}
                  href={`/help/category/${key}`}
                  className="group relative overflow-hidden p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
                >
                  {/* Subtle gradient overlay on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(circle at top left, ${color}08, transparent 70%)`,
                    }}
                  />

                  <div className="relative z-10 space-y-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <span style={{ color }}><Icon className="w-5.5 h-5.5" /></span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {cat.label}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            }
          )}
        </div>
      )}

      {/* Quick links footer */}
      {!isSearching && (
        <div className="flex items-center justify-center gap-6 pt-4 pb-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            ¿No encuentras lo que buscas? Pregunta al chat bot
          </span>
        </div>
      )}
    </div>
  );
}
