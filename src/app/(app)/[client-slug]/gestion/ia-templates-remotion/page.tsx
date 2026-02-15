"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Film,
  Plus,
  Code2,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Tag,
  Clock,
  Layers,
  Copy,
  Check,
  Pencil,
  Sparkles,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────

interface TemplateParam {
  slot: number;
  name: string;
}

interface RemotionTemplate {
  id: string;
  name: string;
  status: string;
  templateId: string;
  code: string;
  codeLines: number;
  duration: number;
  format: string;
  aiTags: string[];
  params: TemplateParam[];
  paramsHelp: string;
  created: string;
}

// ─── Tag Colors ─────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  Hook: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  CTA: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Stats: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  Sentence: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Kinetic: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  LowerThird: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Minimal: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  Elegant: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Explosive: "bg-red-500/15 text-red-400 border-red-500/30",
};

function getTagColor(tag: string) {
  return TAG_COLORS[tag] || "bg-white/5 text-muted-foreground border-white/10";
}

// ─── Status Badge ───────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Activo: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Todo: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Desactivado: "bg-red-500/15 text-red-400 border-red-500/30",
};

// ─── Component ──────────────────────────────────────────

export default function IATemplatesRemotionPage() {
  const [templates, setTemplates] = useState<RemotionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/remotion/ae-templates");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const copyCode = useCallback(async (id: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Film className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">IA Templates Remotion</h1>
            <p className="text-xs text-muted-foreground">
              {templates.length} template{templates.length !== 1 ? "s" : ""} registrados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Sync
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors font-medium">
            <Plus className="w-4 h-4" />
            Nueva Template
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && templates.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-400">
            {error}
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
            <Film className="w-10 h-10 opacity-40" />
            <p>No hay templates Remotion registrados</p>
            <button className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
              <Sparkles className="w-4 h-4" />
              Crear primera template con IA
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {templates.map((tpl) => {
              const isExpanded = expandedId === tpl.id;
              const isCopied = copiedId === tpl.id;

              return (
                <div
                  key={tpl.id}
                  className={cn(
                    "rounded-xl border transition-all duration-200",
                    isExpanded
                      ? "border-emerald-500/30 bg-emerald-500/[0.03]"
                      : "border-border hover:border-emerald-500/20 bg-card"
                  )}
                >
                  {/* Template Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : tpl.id)}
                    className="w-full flex items-center gap-4 px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <Code2 className="w-5 h-5 text-emerald-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">
                          {tpl.name}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 text-[10px] font-medium rounded-full border",
                            STATUS_STYLES[tpl.status] || STATUS_STYLES.Todo
                          )}
                        >
                          {tpl.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span className="font-mono text-emerald-400/70">
                          {tpl.templateId}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {tpl.duration}s
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {tpl.params.length} params
                        </span>
                        <span className="flex items-center gap-1">
                          <Code2 className="w-3 h-3" />
                          {tpl.codeLines} lineas
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
                      {tpl.aiTags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            "px-2 py-0.5 text-[10px] font-medium rounded-full border",
                            getTagColor(tag)
                          )}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 border-t border-border/50">
                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyCode(tpl.id, tpl.code);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-white/5 transition-colors"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          {isCopied ? "Copiado" : "Copiar código"}
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-white/5 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                          <Sparkles className="w-3.5 h-3.5" />
                          Modificar con IA
                        </button>
                      </div>

                      {/* Params Grid */}
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                          <Tag className="w-3 h-3" />
                          Parámetros ({tpl.params.length})
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {tpl.params.map((p) => (
                            <div
                              key={p.slot}
                              className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5"
                            >
                              <div className="text-[10px] text-muted-foreground">
                                Param_{p.slot}
                              </div>
                              <div className="text-sm font-mono text-emerald-400">
                                {p.name}
                              </div>
                            </div>
                          ))}
                        </div>
                        {tpl.paramsHelp && (
                          <p className="mt-2 text-xs text-muted-foreground/70 italic">
                            {tpl.paramsHelp}
                          </p>
                        )}
                      </div>

                      {/* Code Preview */}
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                          <Code2 className="w-3 h-3" />
                          Código fuente ({tpl.codeLines} líneas)
                        </h3>
                        <div className="relative rounded-lg border border-white/10 bg-[#0d1117] overflow-hidden">
                          <pre className="p-4 overflow-x-auto text-xs leading-5 max-h-96 overflow-y-auto">
                            <code className="text-gray-300 font-mono">
                              {tpl.code || "// Sin código"}
                            </code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Chat Placeholder */}
      <div className="border-t border-border px-4 py-3 bg-card/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <input
            type="text"
            placeholder="Describe la template que quieres crear... (ej: 'Countdown 3-2-1 con efecto glitch y colores neon')"
            className="flex-1 bg-transparent border border-border rounded-lg px-4 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-emerald-500/50 transition-colors"
            disabled
          />
          <button
            disabled
            className="px-4 py-2 text-sm rounded-lg bg-emerald-600/50 text-white/50 cursor-not-allowed font-medium"
          >
            Generar
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-1 ml-11">
          Chat IA para crear y modificar templates -- próximamente
        </p>
      </div>
    </div>
  );
}
