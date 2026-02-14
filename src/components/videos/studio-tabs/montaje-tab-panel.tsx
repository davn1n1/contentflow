"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Settings2, ChevronDown, Palette, Music, ImageIcon, Image as ImageLucide,
  ChevronRight, Loader2, CheckCircle2, XCircle, Wand2, Maximize2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { getEngineColor } from "@/lib/constants/engine-colors";
import { ActionButton } from "@/components/scripts/script-audio-detail";
import type { VideoWithScenes, SceneDetail, LinkedRecord } from "@/lib/hooks/use-video-detail";

// ─── Slide Engine Options ─────────────────────────────────
const SLIDE_ENGINES = ["OpenAI", "NanoBanana", "NanoBanana Pro", "SeeDream4", "z-image"];

// ─── Status Slide colors ──────────────────────────────────
function statusSlideStyle(status: string | null) {
  const s = (status || "").toLowerCase();
  if (s === "publicada") return { text: "text-emerald-400", bg: "bg-emerald-400/10" };
  if (s === "modificando") return { text: "text-amber-400", bg: "bg-amber-400/10" };
  if (s === "modificada") return { text: "text-blue-400", bg: "bg-blue-400/10" };
  if (s === "error") return { text: "text-red-400", bg: "bg-red-400/10" };
  return { text: "text-gray-400", bg: "bg-gray-400/10" }; // Idle
}

// ─── Calificacion Imagen Final colors ─────────────────────
function scoreStyle(score: string | null) {
  const n = parseInt(score || "", 10);
  if (isNaN(n)) return null;
  if (n >= 7) return { text: "text-emerald-400", bg: "bg-emerald-400/15", border: "border-emerald-500/30" };
  if (n >= 5) return { text: "text-yellow-400", bg: "bg-yellow-400/15", border: "border-yellow-500/30" };
  if (n === 4) return { text: "text-orange-400", bg: "bg-orange-400/15", border: "border-orange-500/30" };
  return { text: "text-red-400", bg: "bg-red-400/15", border: "border-red-500/30" };
}

// ─── Scene Classification colors (same as Audio/Script) ───
function sceneClassColors(type: string | null) {
  const t = (type || "").toLowerCase();
  if (t.includes("hook")) return { bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/30" };
  if (t.includes("intro")) return { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" };
  if (t.includes("desarrollo")) return { bg: "bg-slate-500/15", text: "text-slate-400", border: "border-slate-500/30" };
  if (t.includes("cta")) return { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" };
  return { bg: "bg-slate-500/10", text: "text-slate-500", border: "border-slate-500/20" };
}

// ─── Auto-save hook (same pattern as Audio) ───────────────
function useSceneAutoSave(sceneId: string, field: string, delay = 800) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const save = useCallback(
    (value: string | boolean) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setSaved(false);
      timerRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          const res = await fetch("/api/data/scenes", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: sceneId, fields: { [field]: value } }),
          });
          if (res.ok) {
            setSaved(true);
            queryClient.invalidateQueries({ queryKey: ["video-detail"] });
            setTimeout(() => setSaved(false), 2000);
          }
        } catch { /* silent */ } finally {
          setSaving(false);
        }
      }, delay);
    },
    [sceneId, field, delay, queryClient]
  );
  return { save, saving, saved };
}

// ─── Fullscreen Image Modal ──────────────────────────────
function FullscreenImageModal({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-zoom-out"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Modifica Slide Button (per-scene) ────────────────────
type ModificaState = "idle" | "confirming" | "sending" | "generating" | "ready" | "error";

function ModificaSlideButton({ sceneId, currentSlide, onStateChange }: { sceneId: string; currentSlide: string | null; onStateChange?: (state: ModificaState) => void }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ModificaState>("idle");
  const stateRef = useRef<ModificaState>(state);
  stateRef.current = state;

  // Notify parent of state changes
  useEffect(() => { onStateChange?.(state); }, [state, onStateChange]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  useEffect(() => {
    if (state === "confirming") {
      timerRef.current = setTimeout(() => setState("idle"), 5000);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
  }, [state]);

  useEffect(() => {
    if (state === "ready" || state === "error") {
      const t = setTimeout(() => setState("idle"), 5000);
      return () => clearTimeout(t);
    }
  }, [state]);

  useEffect(() => {
    if (state === "generating") {
      startTimeRef.current = Date.now();
      setElapsed(0);
      tickRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      return () => { if (tickRef.current) clearInterval(tickRef.current); };
    } else {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    }
  }, [state]);

  // Poll for slide status change
  useEffect(() => {
    if (state !== "generating") {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    const baseSlide = currentSlide;
    const checkScene = async () => {
      try {
        const res = await fetch(`/api/data/scenes?ids=${sceneId}`);
        if (!res.ok) return;
        const scenes = await res.json();
        const scene = scenes?.[0];
        if (!scene) return;

        const newSlide = scene.slide;
        const slideStatus = (scene.status_slide || "").toLowerCase();

        // Slide changed or status indicates done
        if (
          (newSlide && newSlide !== baseSlide) ||
          slideStatus === "modificada" ||
          slideStatus === "publicada"
        ) {
          queryClient.invalidateQueries({ queryKey: ["video-detail"] });
          setState("ready");
        } else if (slideStatus === "error") {
          setState("error");
        }
      } catch { /* ignore */ }
    };
    pollRef.current = setInterval(checkScene, 8000);
    const maxTimeout = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current);
      setState((s) => s === "generating" ? "ready" : s);
    }, 300000); // 5 min max
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearTimeout(maxTimeout);
    };
  }, [state, sceneId, currentSlide, queryClient]);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const cur = stateRef.current;
    if (cur === "error" || cur === "ready") { setState("idle"); return; }
    if (cur === "idle") { setState("confirming"); return; }
    if (cur === "confirming") {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState("sending");
      try {
        const res = await fetch("/api/webhooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ModificaSlide", recordId: sceneId }),
        });
        setState(res.ok ? "generating" : "error");
      } catch {
        setState("error");
      }
    }
  }, [sceneId]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={state === "sending" || state === "generating"}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all border shadow-sm whitespace-nowrap",
        state === "idle" && "bg-violet-600 hover:bg-violet-500 border-violet-500 text-white cursor-pointer",
        state === "confirming" && "bg-amber-500 hover:bg-amber-400 border-amber-400 text-black cursor-pointer animate-pulse",
        state === "sending" && "bg-violet-600/50 border-violet-500/50 text-white/70 cursor-wait",
        state === "generating" && "bg-violet-600/30 border-violet-400/50 text-violet-300 cursor-wait animate-pulse",
        state === "ready" && "bg-emerald-600 border-emerald-500 text-white cursor-pointer",
        state === "error" && "bg-red-600 border-red-500 text-white cursor-pointer",
      )}
    >
      {state === "sending" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {state === "generating" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {state === "ready" && <CheckCircle2 className="w-3.5 h-3.5" />}
      {state === "error" && <XCircle className="w-3.5 h-3.5" />}
      {(state === "idle" || state === "confirming") && <Wand2 className="w-3.5 h-3.5" />}
      {state === "idle" && "Modifica Slide"}
      {state === "confirming" && "Confirmar?"}
      {state === "sending" && "Enviando..."}
      {state === "generating" && <>Generando slide… {formatElapsed(elapsed)}</>}
      {state === "ready" && "Slide lista!"}
      {state === "error" && "Error — click para reintentar"}
    </button>
  );
}

// ─── Montaje Scene Row ────────────────────────────────────
function MontajeSceneRow({ scene, isExpanded, onToggle, expandedRef }: {
  scene: SceneDetail;
  isExpanded: boolean;
  onToggle: () => void;
  expandedRef?: React.RefObject<HTMLTableRowElement | null>;
}) {
  const [feedbackValue, setFeedbackValue] = useState(scene.feedback_slide || "");
  const { save: saveFeedback, saving: savingFeedback, saved: savedFeedback } = useSceneAutoSave(scene.id, "Feedback Slide");
  const [engineValue, setEngineValue] = useState(scene.slide_engine || "");
  const { save: saveEngine } = useSceneAutoSave(scene.id, "SlideEngine");
  const feedbackRef = useRef<HTMLTextAreaElement>(null);
  const [fullscreenSrc, setFullscreenSrc] = useState<string | null>(null);
  const [modificaState, setModificaState] = useState<ModificaState>("idle");
  const isGenerating = modificaState === "generating" || modificaState === "sending";

  useEffect(() => { setFeedbackValue(scene.feedback_slide || ""); }, [scene.feedback_slide]);
  useEffect(() => { setEngineValue(scene.slide_engine || ""); }, [scene.slide_engine]);

  useEffect(() => {
    if (isExpanded && feedbackRef.current) {
      feedbackRef.current.style.height = "auto";
      feedbackRef.current.style.height = feedbackRef.current.scrollHeight + "px";
    }
  }, [isExpanded, feedbackValue]);

  const colors = sceneClassColors(scene.clasificación_escena);
  const engineColor = getEngineColor(scene.slide_engine || "");
  const slideStatus = statusSlideStyle(scene.status_slide);
  const score = scoreStyle(scene.calificacion_imagen_final);

  return (
    <>
      {/* Summary Row */}
      <tr
        ref={expandedRef}
        onClick={onToggle}
        className={cn(
          "border-b border-border/40 cursor-pointer transition-colors",
          isExpanded ? "bg-muted/20" : "hover:bg-muted/10"
        )}
      >
        {/* # */}
        <td className="px-2 py-2 text-center">
          <span className={cn("inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-bold", colors.bg, colors.text)}>
            {scene.n_escena}
          </span>
        </td>
        {/* Clasificación */}
        <td className="px-2 py-2">
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium border", colors.bg, colors.text, colors.border)}>
            {scene.clasificación_escena || "—"}
          </span>
        </td>
        {/* Start */}
        <td className="px-2 py-2 text-right text-xs text-muted-foreground font-mono">
          {scene.start != null ? `${scene.start.toFixed(1)}s` : "—"}
        </td>
        {/* Duration */}
        <td className="px-2 py-2 text-right text-xs text-muted-foreground font-mono">
          {scene.duration != null ? `${scene.duration.toFixed(1)}s` : "—"}
        </td>
        {/* Slide Activa */}
        <td className="px-1 py-2 text-center">
          <span className={cn(
            "inline-block w-2.5 h-2.5 rounded-full",
            scene.slide_activa ? "bg-emerald-400" : "bg-muted-foreground/20"
          )} title={scene.slide_activa ? "Activa" : "Inactiva"} />
        </td>
        {/* StatusSlide */}
        <td className="px-1 py-2">
          {isGenerating ? (
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium animate-pulse", "bg-amber-400/10 text-amber-400")}>
              Modificando
            </span>
          ) : scene.status_slide ? (
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", slideStatus.bg, slideStatus.text)}>
              {scene.status_slide}
            </span>
          ) : null}
        </td>
        {/* SlideEngine */}
        <td className="px-1 py-2">
          {scene.slide_engine && (
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium border", engineColor.bg, engineColor.text, engineColor.border)}>
              {scene.slide_engine}
            </span>
          )}
        </td>
        {/* Calificacion Imagen Final */}
        <td className="px-1 py-2 text-center">
          {score && (
            <span className={cn(
              "inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border",
              score.bg, score.text, score.border,
            )}>
              {scene.calificacion_imagen_final}
            </span>
          )}
        </td>
        {/* Slide thumbnail */}
        <td className="px-1 py-2">
          {isGenerating ? (
            <div className="w-12 h-8 rounded bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
              <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
            </div>
          ) : scene.slide ? (
            <div className="w-12 h-8 rounded overflow-hidden bg-muted border border-border/30">
              <img src={scene.slide} alt={`Slide ${scene.n_escena}`} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-8 rounded bg-muted/30 border border-border/20 flex items-center justify-center">
              <ImageIcon className="w-3 h-3 text-muted-foreground/20" />
            </div>
          )}
        </td>
        {/* Expand indicator */}
        <td className="w-4 pr-2">
          <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground/40 transition-transform", isExpanded && "rotate-90")} />
        </td>
      </tr>

      {/* Expanded Content */}
      {isExpanded && (
        <tr className="border-b border-border/40 bg-muted/10">
          <td colSpan={10} className="px-4 py-4">
            <div className="space-y-4">
              {/* Script (readonly) */}
              {(scene.script || scene.script_elevenlabs) && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Script</p>
                  <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed bg-background/50 rounded-lg p-3 border border-border/30 max-h-[120px] overflow-y-auto">
                    {scene.script || scene.script_elevenlabs}
                  </p>
                </div>
              )}

              {/* Slide image large + controls */}
              <div className="flex gap-6">
                {/* Slide image — large */}
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Slide</p>
                    {score && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-md font-bold border",
                        score.bg, score.text, score.border,
                      )}>
                        Score: {scene.calificacion_imagen_final}/10
                      </span>
                    )}
                  </div>
                  {isGenerating ? (
                    <div className="w-[480px] h-[270px] rounded-xl bg-muted/20 border border-violet-500/30 flex flex-col items-center justify-center gap-3 animate-pulse">
                      <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                      <p className="text-xs text-violet-300 font-medium">Generando nueva slide…</p>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", "bg-amber-400/10 text-amber-400")}>
                        Modificando
                      </span>
                    </div>
                  ) : (scene.slide_full || scene.slide) ? (
                    <div className="relative group">
                      <div className="w-[480px] h-[270px] rounded-xl overflow-hidden bg-muted border border-border/30">
                        <img
                          src={scene.slide_full || scene.slide || ""}
                          alt={`Slide ${scene.n_escena}`}
                          className="w-full h-full object-contain bg-black/20"
                        />
                      </div>
                      {/* Fullscreen button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFullscreenSrc(scene.slide_full || scene.slide || "");
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                        title="Ver a pantalla completa"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-[480px] h-[270px] rounded-xl bg-muted/30 border border-border/20 flex items-center justify-center">
                      <ImageLucide className="w-10 h-10 text-muted-foreground/15" />
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex-1 space-y-3 min-w-0">
                  {/* SlideEngine selector */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Slide Engine</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SLIDE_ENGINES.map((eng) => {
                        const ec = getEngineColor(eng);
                        const isActive = engineValue === eng;
                        return (
                          <button
                            key={eng}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEngineValue(eng);
                              saveEngine(eng);
                            }}
                            className={cn(
                              "text-[10px] px-2 py-1 rounded-md font-medium border transition-all",
                              isActive
                                ? cn(ec.bg, ec.text, ec.border, "ring-1 ring-offset-1 ring-offset-background", ec.border)
                                : "bg-muted/30 text-muted-foreground border-border/30 hover:bg-muted/50"
                            )}
                          >
                            {eng}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback Slide */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Feedback Slide</p>
                      {savingFeedback && <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />}
                      {savedFeedback && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    </div>
                    <textarea
                      ref={feedbackRef}
                      value={feedbackValue}
                      onChange={(e) => { setFeedbackValue(e.target.value); saveFeedback(e.target.value); }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Instrucciones para regenerar la slide..."
                      className="w-full bg-background/50 border border-border/30 rounded-lg px-3 py-2 text-xs text-foreground resize-none overflow-hidden focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 min-h-[60px]"
                    />
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-3">
                    <ModificaSlideButton sceneId={scene.id} currentSlide={scene.slide} onStateChange={setModificaState} />
                    {scene.status_slide && (
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", statusSlideStyle(scene.status_slide).bg, statusSlideStyle(scene.status_slide).text)}>
                        {scene.status_slide}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Fullscreen modal */}
      {fullscreenSrc && (
        <FullscreenImageModal
          src={fullscreenSrc}
          alt={`Slide ${scene.n_escena}`}
          onClose={() => setFullscreenSrc(null)}
        />
      )}
    </>
  );
}

// ─── Montaje Scene Table ──────────────────────────────────
function MontajeSceneTable({ scenes }: { scenes: SceneDetail[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const expandedRowRef = useRef<HTMLTableRowElement>(null);

  // Scroll expanded scene — summary row pinned to top
  useEffect(() => {
    if (expandedId && expandedRowRef.current) {
      expandedRowRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [expandedId]);

  // Keyboard navigation: ArrowUp / ArrowDown
  const handleKeyNav = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      // Don't capture when typing in a textarea/input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;

      e.preventDefault();
      const currentIdx = scenes.findIndex((s) => s.id === expandedId);
      let nextIdx: number;

      if (e.key === "ArrowDown") {
        nextIdx = currentIdx < scenes.length - 1 ? currentIdx + 1 : 0;
      } else {
        nextIdx = currentIdx > 0 ? currentIdx - 1 : scenes.length - 1;
      }
      setExpandedId(scenes[nextIdx].id);
    },
    [expandedId, scenes]
  );

  const withSlides = scenes.filter((s) => s.slide).length;
  const activaCount = scenes.filter((s) => s.slide_activa).length;

  return (
    <div
      className="glass-card rounded-xl overflow-hidden"
      onKeyDown={handleKeyNav}
      tabIndex={0}
    >
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ImageLucide className="w-4 h-4 text-violet-400" />
          Escenas — Slides
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-medium text-muted-foreground">
            {scenes.length}
          </span>
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground/80">
            {withSlides}/{scenes.length} slides · {activaCount} activas
          </span>
          <span className="text-[10px] text-muted-foreground/40">↑↓ navegar</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-center px-2 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-8">#</th>
              <th className="text-left px-2 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-24">Tipo</th>
              <th className="text-right px-2 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-14">Start</th>
              <th className="text-right px-2 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-14">Dur.</th>
              <th className="text-center px-1 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-8" title="Slide Activa">Act</th>
              <th className="text-left px-1 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-20">Status</th>
              <th className="text-left px-1 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-24">Engine</th>
              <th className="text-center px-1 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-10" title="Calificación Imagen">Score</th>
              <th className="text-left px-1 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-16">Slide</th>
              <th className="w-4"></th>
            </tr>
          </thead>
          <tbody>
            {scenes.map((scene) => (
              <MontajeSceneRow
                key={scene.id}
                scene={scene}
                isExpanded={expandedId === scene.id}
                onToggle={() => setExpandedId(expandedId === scene.id ? null : scene.id)}
                expandedRef={expandedId === scene.id ? expandedRowRef : undefined}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Linked Record Card ───────────────────────────────────
function LinkedRecordCard({ label, icon, record, emptyText }: {
  label: string; icon: React.ReactNode; record: LinkedRecord | null; emptyText: string;
}) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</span>
      </div>
      {record ? (
        <div className="flex items-center gap-4 p-4">
          {record.image_url ? (
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted border border-border/50">
              <img src={record.image_url} alt={record.name || label} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg flex-shrink-0 bg-muted/50 border border-border/30 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{record.name || "Sin nombre"}</p>
            <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{String(record.id).slice(0, 12)}…</p>
          </div>
        </div>
      ) : (
        <div className="px-4 py-6 flex items-center justify-center">
          <p className="text-xs text-muted-foreground/50">{emptyText}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────
export function MontajeTabPanel({ video }: { video: VideoWithScenes }) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="h-full overflow-y-auto px-6 py-6 space-y-6">
      {/* Linked Record Cards: Formato Slides + Estilo Musical */}
      <div className="grid grid-cols-2 gap-4">
        <LinkedRecordCard
          label="Formato Diseño Slides"
          icon={<Palette className="w-3.5 h-3.5 text-violet-400" />}
          record={video.linkedFormatoDisenoSlides}
          emptyText="Sin formato asignado"
        />
        <LinkedRecordCard
          label="Estilo Musical"
          icon={<Music className="w-3.5 h-3.5 text-pink-400" />}
          record={video.linkedEstiloMusical}
          emptyText="Sin estilo asignado"
        />
      </div>

      {/* Action: Crear Video (GenerateAvatars) */}
      <ActionButton
        videoId={video.id}
        action="GenerateAvatars"
        label="Crear Video (Avatares)"
        confirmLabel="Confirmar creación de video"
        icon={<Play className="w-5 h-5" />}
        color="amber"
      />

      {/* Montaje Scene Table — Slides */}
      {video.scenes.length > 0 && (
        <MontajeSceneTable scenes={video.scenes} />
      )}

      {/* Advanced Editing Menu */}
      <div className="glass-card rounded-xl overflow-hidden">
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="w-full px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-foreground">Edición Avanzada</span>
            <span className="text-[10px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full font-medium">
              Próximamente
            </span>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            advancedOpen && "rotate-180"
          )} />
        </button>
        {advancedOpen && (
          <div className="px-5 py-8 border-t border-border">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Settings2 className="w-8 h-8 mb-3 opacity-20" />
              <p className="text-sm font-medium">Controles de edición avanzada</p>
              <p className="text-xs mt-1 opacity-60">Transiciones, timing, efectos y más — en desarrollo</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
