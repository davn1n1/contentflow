"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Lightbulb, X, BookOpen } from "lucide-react";
import { usePageTipsStore } from "@/lib/stores/page-tips-store";
import { useChatStore } from "@/lib/stores/chat-store";
import { PAGE_TIPS, matchPageTipKey } from "@/lib/constants/page-tips";

const AUTO_DISMISS_MS = 15_000;

interface ArticleInfo {
  slug: string;
  title: string;
}

export function PageTipBanner() {
  const pathname = usePathname();
  const { hasSeenPage, dismissPage } = usePageTipsStore();
  const isChatOpen = useChatStore((s) => s.isOpen);

  const [visible, setVisible] = useState(false);
  const [tipKey, setTipKey] = useState<string | null>(null);
  const [articles, setArticles] = useState<ArticleInfo[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Detect page changes and check if tip should show
  useEffect(() => {
    if (!hydrated) return;

    const key = matchPageTipKey(pathname);
    if (!key || hasSeenPage(key)) {
      setVisible(false);
      setTipKey(null);
      return;
    }

    setTipKey(key);
    setVisible(true);
  }, [pathname, hydrated, hasSeenPage]);

  // Fetch article titles for the current tip
  useEffect(() => {
    if (!tipKey) {
      setArticles([]);
      return;
    }

    const tip = PAGE_TIPS[tipKey];
    if (!tip || tip.articleSlugs.length === 0) {
      setArticles([]);
      return;
    }

    // Fetch article titles from API
    const controller = new AbortController();
    (async () => {
      try {
        const results: ArticleInfo[] = [];
        for (const slug of tip.articleSlugs) {
          const res = await fetch(`/api/help/articles/${slug}`, {
            signal: controller.signal,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.title) {
              results.push({ slug, title: data.title });
            }
          }
        }
        setArticles(results);
      } catch {
        // Aborted or failed — ignore
      }
    })();

    return () => controller.abort();
  }, [tipKey]);

  // Auto-dismiss after 15 seconds
  useEffect(() => {
    if (!visible || !tipKey) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [visible, tipKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDismiss = useCallback(() => {
    if (tipKey) {
      dismissPage(tipKey);
    }
    setVisible(false);
  }, [tipKey, dismissPage]);

  // Don't render if not visible or chat is open
  if (!visible || !tipKey || isChatOpen) return null;

  const tip = PAGE_TIPS[tipKey];
  if (!tip) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 max-w-xs tip-slide-up">
      <div className="glass-card rounded-xl p-4 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-primary">
            <Lightbulb className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold">Sobre esta pagina</span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
            aria-label="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          {tip.description}
        </p>

        {/* Article links */}
        {articles.length > 0 && (
          <div className="space-y-1.5">
            {articles.map((article) => (
              <a
                key={article.slug}
                href={`/help/articles/${article.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors group"
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
                <span className="group-hover:underline">{article.title}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
