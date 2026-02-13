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

  // Group articles by category for count display
  const categoryCounts: Record<string, number> = {};
  if (articles) {
    for (const a of articles) {
      categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <BookOpen className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Centro de Ayuda</h1>
        <p className="text-muted-foreground">
          Encuentra respuestas, guias y tutoriales para sacar el maximo de ContentFlow365
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-lg mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar articulos..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Search results */}
      {isSearching && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {isLoading ? "Buscando..." : `${articles?.length || 0} resultado(s)`}
          </h2>
          {articles?.map((article) => (
            <Link
              key={article.id}
              href={`/help/articles/${article.slug}`}
              className="block p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase"
                  style={{
                    backgroundColor: `${CATEGORY_COLORS[article.category as HelpCategory]}15`,
                    color: CATEGORY_COLORS[article.category as HelpCategory],
                  }}
                >
                  {HELP_CATEGORIES[article.category as HelpCategory]?.label || article.category}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground">{article.title}</h3>
                  {article.summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {article.summary}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
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
                  className="group p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all space-y-2"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <span style={{ color }}><Icon className="w-5 h-5" /></span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cat.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {cat.description}
                    </p>
                  </div>
                </Link>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
