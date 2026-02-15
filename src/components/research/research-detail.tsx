"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, TrendingUp, Lightbulb, LayoutGrid, Globe, Link2, Calendar, Sparkles, Brain, FileText, type LucideIcon } from "lucide-react";
import type { ResearchDetail } from "@/lib/hooks/use-research";
import { SelectedIdeaCard } from "./selected-idea-card";
import { useIdea } from "@/lib/hooks/use-ideas";
import { IdeaDetailDrawer } from "@/components/ideas/idea-detail-drawer";

interface ResearchDetailProps {
  research: ResearchDetail | undefined;
  isLoading: boolean;
}

const TABS: { key: string; label: string; icon: LucideIcon; activeColor: string }[] = [
  { key: "seleccionadas", label: "Ideas Seleccionadas", icon: Sparkles, activeColor: "text-amber-400" },
  { key: "research24h", label: "Research 24h", icon: Brain, activeColor: "text-blue-400" },
  { key: "conclusion", label: "Conclusión", icon: FileText, activeColor: "text-emerald-400" },
];

type TabKey = string;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }) + "  " + d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ResearchDetailPanel({ research, isLoading }: ResearchDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("seleccionadas");
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const { data: selectedIdea } = useIdea(selectedIdeaId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!research) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Selecciona un Research de la lista</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Title + Tabs */}
      <div className="px-6 pt-5 pb-3 flex items-center gap-4">
        <h1 className="text-lg font-bold text-foreground flex-shrink-0">
          {research.titulo || "Research"}
        </h1>

        {/* Tabs — pill style */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-xl">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium whitespace-nowrap rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive && tab.activeColor)} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-4">
        {activeTab === "research24h" && <TabResearch24h research={research} />}
        {activeTab === "seleccionadas" && <TabSeleccionadas research={research} onIdeaClick={setSelectedIdeaId} />}
        {activeTab === "conclusion" && <TabConclusion research={research} />}
      </div>

      {/* Idea Detail Drawer */}
      <IdeaDetailDrawer
        idea={selectedIdea || null}
        onClose={() => setSelectedIdeaId(null)}
      />
    </div>
  );
}

// ─── Tab: Research Últimas 24 Horas ──────────────────────

function ResearchSection({ icon: Icon, title, gradient, children }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <div className={cn("flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r", gradient)}>
        <Icon className="w-4 h-4 flex-shrink-0" />
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <div className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground/85">
        {children}
      </div>
    </div>
  );
}

function TabResearch24h({ research }: { research: ResearchDetail }) {
  return (
    <div className="space-y-4">
      {/* Metadata header */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(research.fecha)}
        </span>
      </div>

      {/* Content sections — 2-column grid for top items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {research.tendencia_hoy && (
          <ResearchSection
            icon={TrendingUp}
            title="Tendencia Hoy"
            gradient="from-emerald-500/15 to-emerald-500/5 text-emerald-400"
          >
            {research.tendencia_hoy}
          </ResearchSection>
        )}

        {research.temas_recomendados && (
          <ResearchSection
            icon={Lightbulb}
            title="Temas Recomendados"
            gradient="from-amber-500/15 to-amber-500/5 text-amber-400"
          >
            {research.temas_recomendados}
          </ResearchSection>
        )}
      </div>

      {research.formatos_propuestos && (
        <ResearchSection
          icon={LayoutGrid}
          title="Formatos Propuestos"
          gradient="from-violet-500/15 to-violet-500/5 text-violet-400"
        >
          {research.formatos_propuestos}
        </ResearchSection>
      )}

      {research.web_conclusion_perplexity && (
        <ResearchSection
          icon={Globe}
          title="Investigación Perplexity"
          gradient="from-blue-500/15 to-blue-500/5 text-blue-400"
        >
          {research.web_conclusion_perplexity}
        </ResearchSection>
      )}

      {research.web_fuentes && (
        <ResearchSection
          icon={Link2}
          title="Fuentes Web"
          gradient="from-cyan-500/15 to-cyan-500/5 text-cyan-400"
        >
          {research.web_fuentes}
        </ResearchSection>
      )}
    </div>
  );
}

// ─── Tab: Ideas Seleccionadas ────────────────────────────

function TabSeleccionadas({ research, onIdeaClick }: { research: ResearchDetail; onIdeaClick: (id: string) => void }) {
  const ideas = research.selected_ideas || [];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">💡 Ideas Inspiración Seleccionadas:</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Videos Favoritos elegidos por el Agente Research:
      </p>

      {ideas.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay ideas seleccionadas</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ideas.map((idea) => (
            <SelectedIdeaCard key={idea.id} idea={idea} onClick={() => onIdeaClick(idea.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Conclusión ─────────────────────────────────────

function formatConclusionBlocks(text: string) {
  // Split by video sections (numbered patterns like "1.", "2.", "Video 1:", etc.)
  const blocks = text.split(/(?=(?:^|\n)\s*(?:\d+[\.\)]\s|Video\s+\d|#{1,3}\s))/g).filter(Boolean);

  if (blocks.length <= 1) {
    // No clear sections — render as single card
    return (
      <ResearchSection
        icon={Lightbulb}
        title="Análisis Completo"
        gradient="from-primary/15 to-primary/5 text-primary"
      >
        {text}
      </ResearchSection>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {blocks.map((block, i) => {
        const lines = block.trim().split("\n");
        const firstLine = lines[0].replace(/^[\s#*\d.\-)]+/, "").trim();
        const title = firstLine.length > 60 ? firstLine.slice(0, 57) + "..." : firstLine;
        const body = lines.slice(1).join("\n").trim() || firstLine;
        const colors = [
          "from-emerald-500/15 to-emerald-500/5 text-emerald-400",
          "from-blue-500/15 to-blue-500/5 text-blue-400",
          "from-violet-500/15 to-violet-500/5 text-violet-400",
          "from-amber-500/15 to-amber-500/5 text-amber-400",
          "from-cyan-500/15 to-cyan-500/5 text-cyan-400",
          "from-pink-500/15 to-pink-500/5 text-pink-400",
        ];

        return (
          <ResearchSection
            key={i}
            icon={Lightbulb}
            title={title || `Conclusión ${i + 1}`}
            gradient={colors[i % colors.length]}
          >
            {body}
          </ResearchSection>
        );
      })}
    </div>
  );
}

function TabConclusion({ research }: { research: ResearchDetail }) {
  if (!research.conclusion) {
    return <p className="text-sm text-muted-foreground">No hay conclusión disponible</p>;
  }

  return (
    <div className="space-y-4">
      {formatConclusionBlocks(research.conclusion)}
    </div>
  );
}
