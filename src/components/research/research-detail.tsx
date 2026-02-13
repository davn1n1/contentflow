"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2 } from "lucide-react";
import type { ResearchDetail } from "@/lib/hooks/use-research";
import { SelectedIdeaCard } from "./selected-idea-card";
import { useIdea } from "@/lib/hooks/use-ideas";
import { IdeaDetailDrawer } from "@/components/ideas/idea-detail-drawer";

interface ResearchDetailProps {
  research: ResearchDetail | undefined;
  isLoading: boolean;
}

const TABS = [
  { key: "soporte", label: "🎯Soporte" },
  { key: "ideas", label: "Ideas Inspiración" },
  { key: "research24h", label: "🤖Research Últimas 24 Horas" },
  { key: "seleccionadas", label: "💡Ideas Seleccionadas" },
  { key: "conclusion", label: "Conclusión Research" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

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
      {/* Title */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">
          {research.titulo || "Research"}
        </h1>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-border">
        <div className="flex gap-1 overflow-x-auto scrollbar-thin">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === "soporte" && <TabSoporte research={research} />}
        {activeTab === "ideas" && <TabIdeasLink research={research} />}
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

// ─── Tab: Soporte ────────────────────────────────────────

function TabSoporte({ research }: { research: ResearchDetail }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">🎯 Soporte</h3>
      {research.soporte_url ? (
        <a
          href={research.soporte_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          {research.soporte_url}
        </a>
      ) : (
        <p className="text-muted-foreground text-sm">No hay enlace de soporte disponible</p>
      )}
    </div>
  );
}

// ─── Tab: Ideas Inspiración Link ─────────────────────────

function TabIdeasLink({ research }: { research: ResearchDetail }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Ideas Inspiración</h3>
      {research.ideas_inspiracion_url ? (
        <a
          href={research.ideas_inspiracion_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          {research.ideas_inspiracion_url}
        </a>
      ) : (
        <p className="text-muted-foreground text-sm">
          {research.ideas_inspiracion_ids.length > 0
            ? `${research.ideas_inspiracion_ids.length} ideas vinculadas`
            : "No hay ideas vinculadas"}
        </p>
      )}
    </div>
  );
}

// ─── Tab: Research Últimas 24 Horas ──────────────────────

function TabResearch24h({ research }: { research: ResearchDetail }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">🤖 Research Últimas 24 Horas</h3>

      {/* Metadata */}
      <div className="grid grid-cols-[160px_1fr] gap-y-3 gap-x-4 text-sm">
        <span className="text-muted-foreground font-medium">Título Investigación</span>
        <span>{research.titulo || "—"}</span>

        <span className="text-muted-foreground font-medium">Fecha</span>
        <span>{formatDate(research.fecha)}</span>

        <span className="text-muted-foreground font-medium">Record ID</span>
        <span className="font-mono text-xs">{research.id}</span>
      </div>

      {/* Tendencia Hoy */}
      {research.tendencia_hoy && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Tendencia Hoy:</h4>
          <div className="text-sm whitespace-pre-wrap leading-relaxed glass-card p-4 rounded-lg">
            {research.tendencia_hoy}
          </div>
        </div>
      )}

      {/* Temas Recomendados */}
      {research.temas_recomendados && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Temas Recomendados Hoy:</h4>
          <div className="text-sm whitespace-pre-wrap leading-relaxed glass-card p-4 rounded-lg">
            {research.temas_recomendados}
          </div>
        </div>
      )}

      {/* Formatos Propuestos */}
      {research.formatos_propuestos && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Formatos Propuestos:</h4>
          <div className="text-sm whitespace-pre-wrap leading-relaxed glass-card p-4 rounded-lg">
            {research.formatos_propuestos}
          </div>
        </div>
      )}

      {/* Web Conclusion Perplexity */}
      {research.web_conclusion_perplexity && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Investigación Perplexity:</h4>
          <div className="text-sm whitespace-pre-wrap leading-relaxed glass-card p-4 rounded-lg">
            {research.web_conclusion_perplexity}
          </div>
        </div>
      )}

      {/* Web Fuentes */}
      {research.web_fuentes && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Fuentes Web:</h4>
          <div className="text-sm whitespace-pre-wrap leading-relaxed glass-card p-4 rounded-lg">
            {research.web_fuentes}
          </div>
        </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ideas.map((idea) => (
            <SelectedIdeaCard key={idea.id} idea={idea} onClick={() => onIdeaClick(idea.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Conclusión ─────────────────────────────────────

function TabConclusion({ research }: { research: ResearchDetail }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Conclusión Research por cada Video Elegido</h3>

      {research.conclusion ? (
        <div className="text-sm whitespace-pre-wrap leading-relaxed glass-card p-4 rounded-lg">
          {research.conclusion}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No hay conclusión disponible</p>
      )}
    </div>
  );
}
