"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Play, Settings2, ChevronDown, ImageIcon, Image as ImageLucide,
  ChevronRight, Loader2, CheckCircle2, XCircle, Wand2, Maximize2, X,
  Film, User2, Tag, Volume2, Star, Headphones, Info, FileText, Shield, AlertTriangle,
  Save, Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { getEngineColor } from "@/lib/constants/engine-colors";
import { ActionButton } from "@/components/scripts/script-audio-detail";
import { WaveformAudioPlayer } from "@/components/shared/waveform-audio-player";
import { useRenders } from "@/lib/hooks/use-renders";
import type { AeRender } from "@/types/database";
import type { VideoWithScenes, SceneDetail } from "@/lib/hooks/use-video-detail";
import { LinkedRecordSelector } from "@/components/app-data/linked-record-selector";
import { getLinkedFieldDef } from "@/lib/constants/linked-fields";
import { useAccountStore } from "@/lib/stores/account-store";

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
  if (t.includes("hook")) return { bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/30", divider: "bg-cyan-400", ringColor: "ring-cyan-500/40" };
  if (t.includes("intro")) return { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", divider: "bg-emerald-400", ringColor: "ring-emerald-500/40" };
  if (t.includes("desarrollo")) return { bg: "bg-slate-500/15", text: "text-slate-400", border: "border-slate-500/30", divider: "bg-slate-400", ringColor: "ring-slate-500/40" };
  if (t.includes("cta")) return { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30", divider: "bg-orange-400", ringColor: "ring-orange-500/40" };
  return { bg: "bg-slate-500/10", text: "text-slate-500", border: "border-slate-500/20", divider: "bg-slate-400", ringColor: "ring-slate-500/40" };
}

// ─── Topic tag colors ───────────────────────────────────
const TOPIC_COLORS = [
  { bg: "bg-violet-400/15", text: "text-violet-400", border: "border-violet-500/25" },
  { bg: "bg-sky-400/15", text: "text-sky-400", border: "border-sky-500/25" },
  { bg: "bg-rose-400/15", text: "text-rose-400", border: "border-rose-500/25" },
  { bg: "bg-emerald-400/15", text: "text-emerald-400", border: "border-emerald-500/25" },
  { bg: "bg-amber-400/15", text: "text-amber-400", border: "border-amber-500/25" },
  { bg: "bg-cyan-400/15", text: "text-cyan-400", border: "border-cyan-500/25" },
  { bg: "bg-pink-400/15", text: "text-pink-400", border: "border-pink-500/25" },
  { bg: "bg-teal-400/15", text: "text-teal-400", border: "border-teal-500/25" },
];
function topicTagColor(idx: number) {
  return TOPIC_COLORS[idx % TOPIC_COLORS.length];
}

// ─── Editable Activa Toggle ─────────────────────────────
function ActivaToggle({ active, sceneId, field, color = "emerald" }: {
  active: boolean; sceneId: string; field: string; color?: "emerald" | "sky";
}) {
  const [value, setValue] = useState(active);
  const { save, saving } = useSceneAutoSave(sceneId, field, 0);

  useEffect(() => { setValue(active); }, [active]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !value;
    setValue(next);
    save(next);
  };

  const activeColor = color === "sky" ? "bg-sky-400" : "bg-emerald-400";
  const activeRing = color === "sky" ? "ring-sky-400/40" : "ring-emerald-400/40";

  return (
    <button
      onClick={handleClick}
      disabled={saving}
      className={cn(
        "inline-flex items-center justify-center w-4 h-4 rounded-full border transition-all cursor-pointer",
        value
          ? cn(activeColor, "border-transparent ring-2", activeRing)
          : "bg-muted-foreground/10 border-muted-foreground/30 hover:border-muted-foreground/50",
        saving && "opacity-50"
      )}
      title={value ? "Activa — click para desactivar" : "Inactiva — click para activar"}
    />
  );
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

// ─── Fullscreen Lightbox (Portal → body, above everything) ──
function FullscreenImageModal({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/95 backdrop-blur-md cursor-pointer animate-[fade-in_0.15s_ease-out]"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      {/* X button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white/80 hover:text-white transition-all backdrop-blur-sm border border-white/10"
        style={{ zIndex: 100000 }}
      >
        <X className="w-5 h-5" />
      </button>
      {/* Image in original aspect ratio */}
      <img
        src={src}
        alt={alt}
        className="max-w-[92vw] max-h-[92vh] rounded-xl shadow-2xl shadow-black/50 animate-[scale-in_0.2s_ease-out]"
        style={{ objectFit: "scale-down" }}
      />
    </div>,
    document.body
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
  const feedbackFocusedRef = useRef(false);
  const [fullscreenSrc, setFullscreenSrc] = useState<string | null>(null);
  const [modificaState, setModificaState] = useState<ModificaState>("idle");
  const isGenerating = modificaState === "generating" || modificaState === "sending";
  // Pop animation on expand
  const [popKey, setPopKey] = useState(0);
  const wasExpanded = useRef(false);
  useEffect(() => {
    if (isExpanded && !wasExpanded.current) {
      setPopKey((k) => k + 1);
    }
    wasExpanded.current = isExpanded;
  }, [isExpanded]);

  useEffect(() => { if (!feedbackFocusedRef.current) setFeedbackValue(scene.feedback_slide || ""); }, [scene.feedback_slide]);
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
          "sticky top-[41px] z-10 bg-background",
          isExpanded ? "shadow-md shadow-black/10" : "hover:bg-muted/30"
        )}
      >
        {/* # */}
        <td className="px-2 py-3 text-center">
          <span
            key={popKey}
            className={cn(
              "inline-flex items-center justify-center rounded-md text-[11px] font-bold transition-all",
              colors.bg, colors.text,
              isExpanded
                ? "w-8 h-8 text-sm shadow-lg shadow-current/20 ring-2 ring-current/30 animate-[scene-pop_0.4s_ease-out]"
                : "w-6 h-6"
            )}
          >
            {scene.n_escena}
          </span>
        </td>
        {/* Clasificación */}
        <td className="px-2 py-3">
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium border", colors.bg, colors.text, colors.border)}>
            {scene.clasificación_escena || "—"}
          </span>
        </td>
        {/* Start */}
        <td className="px-2 py-3 text-right text-xs text-muted-foreground font-mono">
          {scene.start != null ? `${scene.start.toFixed(1)}s` : "—"}
        </td>
        {/* Duration */}
        <td className="px-2 py-3 text-right text-xs text-muted-foreground font-mono">
          {scene.duration != null ? `${scene.duration.toFixed(1)}s` : "—"}
        </td>
        {/* ── Slide group (violet bg) ── */}
        {/* Slide Activa (editable) */}
        <td className="px-1 py-3 text-center bg-violet-500/[0.06] border-l border-violet-500/10">
          <ActivaToggle active={scene.slide_activa} sceneId={scene.id} field="Slide Activa" color="emerald" />
        </td>
        {/* StatusSlide */}
        <td className="px-1 py-3 bg-violet-500/[0.06]">
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
        <td className="px-1 py-3 bg-violet-500/[0.06]">
          {scene.slide_engine && (
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium border", engineColor.bg, engineColor.text, engineColor.border)}>
              {scene.slide_engine}
            </span>
          )}
        </td>
        {/* Calificacion Imagen Final */}
        <td className="px-1 py-3 text-center bg-violet-500/[0.06]">
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
        <td className="px-0.5 py-1.5 bg-violet-500/[0.06]">
          {isGenerating ? (
            <div className="w-16 h-10 rounded bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
              <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
            </div>
          ) : scene.slide ? (
            <div className="w-16 h-10 rounded overflow-hidden bg-muted border border-border/30">
              <img src={scene.slide} alt={`Slide ${scene.n_escena}`} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-10 rounded bg-muted/30 border border-border/20 flex items-center justify-center">
              <ImageIcon className="w-3 h-3 text-muted-foreground/20" />
            </div>
          )}
        </td>
        {/* ── Broll group (sky bg) ── */}
        {/* Broll Activa (editable) */}
        <td className="px-1 py-3 text-center bg-sky-500/[0.06] border-l border-sky-500/10">
          <ActivaToggle active={scene.broll_activa} sceneId={scene.id} field="Broll Activa" color="sky" />
        </td>
        {/* Custom (checkbox) */}
        <td className="px-1 py-3 text-center bg-sky-500/[0.06]">
          {scene.broll_custom && (
            <CheckCircle2 className="w-4 h-4 text-sky-400 inline-block" />
          )}
        </td>
        {/* Broll thumbnail */}
        <td className="px-0.5 py-1.5 bg-sky-500/[0.06]">
          {scene.broll_thumb ? (
            <div className={cn("w-16 h-10 rounded overflow-hidden bg-muted border", scene.broll_custom ? "border-sky-500/40" : "border-border/30")}>
              <img src={scene.broll_thumb} alt={`Broll ${scene.n_escena}`} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-10 rounded bg-muted/30 border border-border/20 flex items-center justify-center">
              <Film className="w-3 h-3 text-muted-foreground/20" />
            </div>
          )}
        </td>
        {/* ── Avatar group (amber bg) ── */}
        {/* Tipo Avatar */}
        <td className="px-1 py-3 bg-amber-500/[0.06] border-l border-amber-500/10">
          {scene.tipo_avatar && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-amber-400/10 text-amber-400 truncate max-w-[60px] inline-block">
              {scene.tipo_avatar}
            </span>
          )}
        </td>
        {/* Zoom Camera */}
        <td className="px-1 py-3 text-center bg-amber-500/[0.06]">
          {scene.zoom_camera && (
            <span className="text-[10px] font-mono text-muted-foreground">{scene.zoom_camera}%</span>
          )}
        </td>
        {/* Avatar image/video thumbnail */}
        <td className="px-0.5 py-1.5 bg-amber-500/[0.06]">
          {scene.photo_avatar ? (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-amber-500/30">
              <img src={scene.photo_avatar} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          ) : scene.camera_s3_url ? (
            <div className="w-14 h-9 rounded overflow-hidden bg-muted border border-amber-500/30 relative">
              <video src={scene.camera_s3_url} preload="metadata" muted className="w-full h-full object-cover" />
              <Play className="w-3 h-3 text-white absolute bottom-0.5 right-0.5 drop-shadow" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted/30 border border-border/20 flex items-center justify-center">
              <User2 className="w-3 h-3 text-muted-foreground/20" />
            </div>
          )}
        </td>
        {/* ── Audio group (rose bg) ── */}
        {/* Estilos Musicales */}
        <td className="px-1 py-3 bg-rose-500/[0.06] border-l border-rose-500/10">
          {scene.estilos_musicales?.length > 0 ? (
            <div className="flex flex-wrap gap-0.5">
              {scene.estilos_musicales.map((est, i) => (
                <span key={i} className="text-[9px] px-1 py-0.5 rounded font-medium bg-rose-400/10 text-rose-400 truncate max-w-[60px] inline-block">
                  {typeof est === "string" ? est : `#${i + 1}`}
                </span>
              ))}
            </div>
          ) : null}
        </td>
        {/* Muestra audio image (icon size) */}
        <td className="px-0.5 py-1.5 bg-rose-500/[0.06]">
          {scene.muestra_audio ? (
            <div className="w-8 h-8 rounded overflow-hidden bg-muted border border-rose-500/30">
              <img src={scene.muestra_audio} alt="Muestra" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded bg-muted/30 border border-border/20 flex items-center justify-center">
              <Volume2 className="w-3 h-3 text-muted-foreground/20" />
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
          <td colSpan={20} className="px-4 py-4">
            <div className="space-y-5">

              {/* ── Section: SLIDE ── */}
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ImageLucide className="w-3.5 h-3.5 text-violet-400" />
                  <p className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold">Slide</p>
                  <div className="flex items-center gap-1.5 ml-2">
                    <ActivaToggle active={scene.slide_activa} sceneId={scene.id} field="Slide Activa" color="emerald" />
                    <span className="text-[10px] text-muted-foreground">{scene.slide_activa ? "Activa" : "Inactiva"}</span>
                  </div>
                  {score && (
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-bold border ml-auto", score.bg, score.text, score.border)}>
                      Score: {scene.calificacion_imagen_final}/10
                    </span>
                  )}
                </div>

                <div className="flex gap-6">
                  {/* Slide image — large */}
                  <div className="flex-shrink-0">
                    {isGenerating ? (
                      <div className="w-[480px] h-[270px] rounded-xl bg-muted/20 border border-violet-500/30 flex flex-col items-center justify-center gap-3 animate-pulse">
                        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                        <p className="text-xs text-violet-300 font-medium">Generando nueva slide…</p>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", "bg-amber-400/10 text-amber-400")}>Modificando</span>
                      </div>
                    ) : (scene.slide_full || scene.slide) ? (
                      <div
                        className="relative group cursor-zoom-in"
                        onClick={(e) => { e.stopPropagation(); setFullscreenSrc(scene.slide_full || scene.slide || ""); }}
                      >
                        <div className="w-[480px] h-[270px] rounded-xl overflow-hidden bg-muted border border-border/30 hover:border-primary/40 transition-colors">
                          <img src={scene.slide_full || scene.slide || ""} alt={`Slide ${scene.n_escena}`} className="w-full h-full object-contain bg-black/20" />
                        </div>
                        <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white/60 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-[480px] h-[270px] rounded-xl bg-muted/30 border border-border/20 flex items-center justify-center">
                        <ImageLucide className="w-10 h-10 text-muted-foreground/15" />
                      </div>
                    )}
                  </div>

                  {/* Slide Controls */}
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
                              onClick={(e) => { e.stopPropagation(); setEngineValue(eng); saveEngine(eng); }}
                              className={cn(
                                "text-[10px] px-2 py-1 rounded-md font-medium border transition-all",
                                isActive ? cn(ec.bg, ec.text, ec.border, "ring-1 ring-offset-1 ring-offset-background", ec.border) : "bg-muted/30 text-muted-foreground border-border/30 hover:bg-muted/50"
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
                        onFocus={() => { feedbackFocusedRef.current = true; }}
                        onBlur={() => { feedbackFocusedRef.current = false; }}
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

              {/* ── Section: B-ROLL ── */}
              <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Film className="w-3.5 h-3.5 text-sky-400" />
                  <p className="text-[10px] uppercase tracking-wider text-sky-400 font-semibold">B-Roll</p>
                  <div className="flex items-center gap-1.5 ml-2">
                    <ActivaToggle active={scene.broll_activa} sceneId={scene.id} field="Broll Activa" color="sky" />
                    <span className="text-[10px] text-muted-foreground">{scene.broll_activa ? "Activa" : "Inactiva"}</span>
                  </div>
                  {scene.broll_custom && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-sky-400/10 text-sky-400 border border-sky-500/25 ml-auto flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Custom
                    </span>
                  )}
                </div>

                <div className="flex gap-5">
                  {/* Broll Thumbnail image */}
                  <div className="flex-shrink-0">
                    {scene.broll_thumb ? (
                      <div
                        className="relative group cursor-zoom-in"
                        onClick={(e) => { e.stopPropagation(); setFullscreenSrc(scene.broll_thumb || ""); }}
                      >
                        <div className={cn(
                          "w-[280px] h-[158px] rounded-lg overflow-hidden bg-muted border transition-colors",
                          scene.broll_custom ? "border-sky-500/40 hover:border-sky-400/60" : "border-border/30 hover:border-sky-400/40"
                        )}>
                          <img src={scene.broll_thumb} alt={`Broll ${scene.n_escena}`} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/50 text-white/60 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-[280px] h-[158px] rounded-lg bg-muted/30 border border-border/20 flex items-center justify-center">
                        <Film className="w-8 h-8 text-muted-foreground/15" />
                      </div>
                    )}
                  </div>

                  {/* Broll Video + Info */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Broll Video player */}
                    {scene.broll_video && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Video B-Roll</p>
                        <video
                          src={scene.broll_video}
                          controls
                          preload="metadata"
                          onClick={(e) => e.stopPropagation()}
                          className="w-full max-w-[360px] rounded-lg border border-border/30 bg-black"
                        />
                      </div>
                    )}

                    {/* Broll metadata */}
                    <div className="flex gap-4">
                      {scene.broll_custom && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">Custom</p>
                          <CheckCircle2 className="w-4 h-4 text-sky-400 mt-0.5" />
                        </div>
                      )}
                      {scene.broll_offset != null && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">Offset</p>
                          <p className="text-xs font-mono text-foreground/80">{scene.broll_offset}s</p>
                        </div>
                      )}
                      {scene.broll_duration != null && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">Duración</p>
                          <p className="text-xs font-mono text-foreground/80">{scene.broll_duration}s</p>
                        </div>
                      )}
                    </div>

                    {!scene.broll_thumb && !scene.broll_video && (
                      <p className="text-xs text-muted-foreground/40 italic">Sin B-Roll asignado</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Section: AVATAR ── */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User2 className="w-3.5 h-3.5 text-amber-400" />
                  <p className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">Avatar</p>
                  {scene.tipo_avatar && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-amber-400/10 text-amber-400 border border-amber-500/25">
                      {scene.tipo_avatar}
                    </span>
                  )}
                  {scene.heygen_render && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium border",
                      scene.heygen_render.toLowerCase().includes("rendered")
                        ? "bg-emerald-400/10 text-emerald-400 border-emerald-500/25"
                        : "bg-amber-400/10 text-amber-400 border-amber-500/25 animate-pulse"
                    )}>
                      {scene.heygen_render}
                    </span>
                  )}
                  {scene.zoom_camera && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-amber-400/10 text-amber-400/70 border border-amber-500/20 ml-auto">
                      Zoom: {scene.zoom_camera}%
                    </span>
                  )}
                </div>

                <div className="flex gap-5 items-start">
                  {/* Avatar photo */}
                  {scene.photo_avatar && (
                    <div className="flex-shrink-0">
                      <div
                        className="relative group cursor-zoom-in"
                        onClick={(e) => { e.stopPropagation(); setFullscreenSrc(scene.photo_avatar || ""); }}
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-muted border border-amber-500/30 hover:border-amber-400/50 transition-colors">
                          <img src={scene.photo_avatar} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Camera S3 video (rendered avatar) */}
                  {scene.camera_s3_url && (
                    <div className="flex-shrink-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Camera Render</p>
                      <video
                        src={scene.camera_s3_url}
                        controls
                        preload="metadata"
                        onClick={(e) => e.stopPropagation()}
                        className="w-[200px] rounded-lg border border-amber-500/30 bg-black"
                      />
                    </div>
                  )}

                  {!scene.photo_avatar && !scene.camera_s3_url && (
                    <p className="text-xs text-muted-foreground/40 italic">Sin avatar asignado</p>
                  )}
                </div>
              </div>

              {/* ── Section: AUDIO ── */}
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Headphones className="w-3.5 h-3.5 text-rose-400" />
                  <p className="text-[10px] uppercase tracking-wider text-rose-400 font-semibold">Audio</p>
                  {scene.audio_favorito && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-yellow-400/15 text-yellow-400 border border-yellow-500/25 ml-auto flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400" /> Favorito
                    </span>
                  )}
                </div>

                <div className="flex gap-5 items-start">
                  {/* Audio waveform player */}
                  {scene.audio_attachment && (
                    <div className="flex-1 min-w-0 max-w-[360px]">
                      <WaveformAudioPlayer
                        url={scene.audio_attachment}
                        color="rose"
                        height={40}
                        compact
                        className="border-rose-500/20"
                      />
                    </div>
                  )}

                  {/* Muestra icon + Estilo Musical */}
                  <div className="flex gap-4 items-start">
                    {scene.muestra_audio && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1">Muestra</p>
                        <div className="w-10 h-10 rounded overflow-hidden bg-muted border border-rose-500/30">
                          <img src={scene.muestra_audio} alt="Muestra" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}

                    {scene.estilos_musicales?.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1">Estilos Musicales</p>
                        <div className="flex flex-wrap gap-1">
                          {scene.estilos_musicales.map((est, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-rose-400/10 text-rose-400 border border-rose-500/25">
                              {typeof est === "string" ? est : `Estilo ${i + 1}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Audio metadata */}
                  <div className="flex gap-4 items-start ml-auto">
                    {scene.audio_tipo && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1">Tipo</p>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-medium border",
                          scene.audio_tipo.toLowerCase().includes("musica") || scene.audio_tipo.toLowerCase().includes("música")
                            ? "bg-pink-400/15 text-pink-400 border-pink-500/25"
                            : scene.audio_tipo.toLowerCase().includes("sfx") || scene.audio_tipo.toLowerCase().includes("efecto")
                            ? "bg-cyan-400/15 text-cyan-400 border-cyan-500/25"
                            : "bg-violet-400/15 text-violet-400 border-violet-500/25"
                        )}>
                          {scene.audio_tipo}
                        </span>
                      </div>
                    )}
                    {scene.audio_seccion && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1">Sección</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-400/15 text-slate-400 border border-slate-500/25">
                          {scene.audio_seccion}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1">Escena</p>
                      <span className={cn(
                        "inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold",
                        colors.bg, colors.text
                      )}>
                        {scene.n_escena}
                      </span>
                    </div>
                  </div>
                </div>

                {!scene.audio_attachment && !scene.muestra_audio && scene.estilos_musicales?.length === 0 && (
                  <p className="text-xs text-muted-foreground/40 italic mt-2">Sin audio asignado</p>
                )}
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

// ─── Prefetch images for adjacent scenes ──────────────────
function usePrefetchAdjacentScenes(scenes: SceneDetail[], expandedId: string | null) {
  useEffect(() => {
    if (!expandedId) return;
    const idx = scenes.findIndex((s) => s.id === expandedId);
    if (idx === -1) return;

    // Prefetch next 3 scenes (ahead) + 1 behind
    const indicesToPrefetch = [idx + 1, idx + 2, idx + 3, idx - 1].filter(
      (i) => i >= 0 && i < scenes.length
    );

    const urls: string[] = [];
    for (const i of indicesToPrefetch) {
      const s = scenes[i];
      if (s.slide_full) urls.push(s.slide_full);
      else if (s.slide) urls.push(s.slide);
      if (s.broll_thumb) urls.push(s.broll_thumb);
      if (s.photo_avatar) urls.push(s.photo_avatar);
      if (s.muestra_audio) urls.push(s.muestra_audio);
    }

    // Preload images via Image() constructor — browser caches them
    const images: HTMLImageElement[] = [];
    for (const url of urls) {
      const img = new Image();
      img.src = url;
      images.push(img);
    }

    // Prefetch videos via link[rel=prefetch] for next 2 scenes
    const videoUrls: string[] = [];
    for (const i of [idx + 1, idx + 2]) {
      if (i >= 0 && i < scenes.length && scenes[i].broll_video) {
        videoUrls.push(scenes[i].broll_video!);
      }
    }
    const links: HTMLLinkElement[] = [];
    for (const url of videoUrls) {
      if (document.querySelector(`link[href="${url}"]`)) continue;
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "video";
      link.href = url;
      document.head.appendChild(link);
      links.push(link);
    }

    return () => {
      links.forEach((l) => l.remove());
    };
  }, [scenes, expandedId]);
}

// ─── Montaje Scene Table ──────────────────────────────────
function MontajeSceneTable({ scenes }: { scenes: SceneDetail[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const expandedRowRef = useRef<HTMLTableRowElement>(null);

  // Prefetch images/videos for adjacent scenes
  usePrefetchAdjacentScenes(scenes, expandedId);

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
  const withBroll = scenes.filter((s) => s.broll_thumb).length;
  const withAvatar = scenes.filter((s) => s.photo_avatar || s.camera_s3_url).length;
  const withAudio = scenes.filter((s) => s.audio_attachment || s.muestra_audio).length;
  const activaSlideCount = scenes.filter((s) => s.slide_activa).length;
  const activaBrollCount = scenes.filter((s) => s.broll_activa).length;

  return (
    <div
      className="-mx-6 border-y border-border/40 bg-background/30"
      onKeyDown={handleKeyNav}
      tabIndex={0}
    >
      <div className="sticky top-0 z-20 px-5 py-3 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ImageLucide className="w-4 h-4 text-violet-400" />
          Escenas — Montaje
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-medium text-muted-foreground">
            {scenes.length}
          </span>
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-violet-400/80">{withSlides} slides · {activaSlideCount} act</span>
          <span className="text-[10px] text-sky-400/80">{withBroll} broll · {activaBrollCount} act</span>
          <span className="text-[10px] text-amber-400/80">{withAvatar} avatar</span>
          <span className="text-[10px] text-rose-400/80">{withAudio} audio</span>
          <span className="text-[10px] text-muted-foreground/40">↑↓ navegar</span>
        </div>
      </div>

      <table className="w-full text-sm">
          <thead>
            {/* Group header row */}
            <tr className="border-b border-border/30">
              <th colSpan={4} className="text-left px-2 py-1.5 text-[9px] uppercase tracking-widest text-muted-foreground/60 font-semibold bg-muted/20">Escena</th>
              <th colSpan={5} className="text-left px-1 py-1.5 text-[9px] uppercase tracking-widest text-violet-400/70 font-semibold border-l border-violet-500/20 bg-violet-500/[0.12]">
                <span className="flex items-center gap-1"><ImageLucide className="w-3 h-3" /> Slide</span>
              </th>
              <th colSpan={3} className="text-left px-1 py-1.5 text-[9px] uppercase tracking-widest text-sky-400/70 font-semibold border-l border-sky-500/20 bg-sky-500/[0.12]">
                <span className="flex items-center gap-1"><Film className="w-3 h-3" /> B-Roll</span>
              </th>
              <th colSpan={3} className="text-left px-1 py-1.5 text-[9px] uppercase tracking-widest text-amber-400/70 font-semibold border-l border-amber-500/20 bg-amber-500/[0.12]">
                <span className="flex items-center gap-1"><User2 className="w-3 h-3" /> Avatar</span>
              </th>
              <th colSpan={2} className="text-left px-1 py-1.5 text-[9px] uppercase tracking-widest text-rose-400/70 font-semibold border-l border-rose-500/20 bg-rose-500/[0.12]">
                <span className="flex items-center gap-1"><Headphones className="w-3 h-3" /> Audio</span>
              </th>
              <th className="w-4 bg-muted/20"></th>
            </tr>
            {/* Column header row */}
            <tr className="border-b border-border">
              {/* Escena group */}
              <th className="text-center px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-8 bg-muted/30">#</th>
              <th className="text-left px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-20 bg-muted/30">Tipo</th>
              <th className="text-right px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-12 bg-muted/30">Start</th>
              <th className="text-right px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-12 bg-muted/30">Dur.</th>
              {/* Slide group */}
              <th className="text-center px-1 py-2 text-[10px] uppercase tracking-wider text-violet-400/50 font-semibold w-7 border-l border-violet-500/20 bg-violet-500/[0.08]" title="Slide Activa">A</th>
              <th className="text-left px-1 py-2 text-[10px] uppercase tracking-wider text-violet-400/50 font-semibold w-18 bg-violet-500/[0.08]">Status</th>
              <th className="text-left px-1 py-2 text-[10px] uppercase tracking-wider text-violet-400/50 font-semibold w-20 bg-violet-500/[0.08]">Engine</th>
              <th className="text-center px-1 py-2 text-[10px] uppercase tracking-wider text-violet-400/50 font-semibold w-8 bg-violet-500/[0.08]" title="Calificación Imagen">Sc</th>
              <th className="text-left px-1 py-2 text-[10px] uppercase tracking-wider text-violet-400/50 font-semibold w-16 bg-violet-500/[0.08]">Img</th>
              {/* Broll group */}
              <th className="text-center px-1 py-2 text-[10px] uppercase tracking-wider text-sky-400/50 font-semibold w-7 border-l border-sky-500/20 bg-sky-500/[0.08]" title="Broll Activa">A</th>
              <th className="text-left px-1 py-2 text-[10px] uppercase tracking-wider text-sky-400/50 font-semibold w-14 bg-sky-500/[0.08]">Custom</th>
              <th className="text-left px-1 py-2 text-[10px] uppercase tracking-wider text-sky-400/50 font-semibold w-16 bg-sky-500/[0.08]">Img</th>
              {/* Avatar group */}
              <th className="text-left px-1 py-2 text-[10px] uppercase tracking-wider text-amber-400/50 font-semibold w-16 border-l border-amber-500/20 bg-amber-500/[0.08]">Tipo</th>
              <th className="text-center px-1 py-2 text-[10px] uppercase tracking-wider text-amber-400/50 font-semibold w-10 bg-amber-500/[0.08]">Zoom</th>
              <th className="text-left px-1 py-2 text-[10px] uppercase tracking-wider text-amber-400/50 font-semibold w-16 bg-amber-500/[0.08]">Img</th>
              {/* Audio group */}
              <th className="text-left px-1 py-2 text-[10px] uppercase tracking-wider text-rose-400/50 font-semibold w-16 border-l border-rose-500/20 bg-rose-500/[0.08]">Estilo</th>
              <th className="text-left px-1 py-2 text-[10px] uppercase tracking-wider text-rose-400/50 font-semibold w-10 bg-rose-500/[0.08]">Img</th>
              <th className="w-4 bg-muted/30"></th>
            </tr>
          </thead>
          <tbody>
            {scenes.map((scene, idx) => {
              const prev = idx > 0 ? scenes[idx - 1] : null;
              const sectionChanged = prev && prev.clasificación_escena !== scene.clasificación_escena;
              const sectionColors = sceneClassColors(scene.clasificación_escena);
              return (
                <React.Fragment key={scene.id}>
                  {sectionChanged && (
                    <tr>
                      <td colSpan={19} className="h-0 py-0">
                        <div className={cn("h-[2px] opacity-30", sectionColors.divider || "bg-border")} />
                      </td>
                    </tr>
                  )}
                  <MontajeSceneRow
                    scene={scene}
                    isExpanded={expandedId === scene.id}
                    onToggle={() => setExpandedId(expandedId === scene.id ? null : scene.id)}
                    expandedRef={expandedId === scene.id ? expandedRowRef : undefined}
                  />
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
    </div>
  );
}

// ─── AE Render Status colors ─────────────────────────────
function renderStatusStyle(status: string | null) {
  const s = (status || "").toLowerCase();
  if (s.includes("done") || s.includes("complete") || s.includes("publicad")) return { text: "text-emerald-400", bg: "bg-emerald-400/10" };
  if (s.includes("render") || s.includes("process") || s.includes("progress")) return { text: "text-amber-400", bg: "bg-amber-400/10" };
  if (s.includes("error") || s.includes("fail")) return { text: "text-red-400", bg: "bg-red-400/10" };
  if (s.includes("pendi") || s.includes("wait")) return { text: "text-blue-400", bg: "bg-blue-400/10" };
  return { text: "text-gray-400", bg: "bg-gray-400/10" };
}

// ─── AE Render Row ───────────────────────────────────────
function AeRenderRow({ render, isExpanded, onToggle }: {
  render: AeRender;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const estilo = renderStatusStyle(render.estado_render);
  const previewImg = render.slide || render.muestra_ae;

  return (
    <>
      <tr
        onClick={onToggle}
        className={cn(
          "border-b border-border/40 cursor-pointer transition-colors",
          "sticky top-[41px] z-10 bg-background",
          isExpanded ? "shadow-md shadow-black/10" : "hover:bg-muted/30"
        )}
      >
        {/* # */}
        <td className="px-2 py-3 text-center">
          <span className={cn(
            "inline-flex items-center justify-center rounded-md text-[11px] font-bold",
            isExpanded ? "w-8 h-8 text-sm bg-teal-500/20 text-teal-400 shadow-lg ring-2 ring-teal-500/30" : "w-6 h-6 bg-teal-500/15 text-teal-400"
          )}>
            {render.n_render}
          </span>
        </td>
        {/* Start */}
        <td className="px-2 py-3 text-right text-xs text-muted-foreground font-mono">
          {render.start != null ? `${render.start.toFixed(1)}s` : "—"}
        </td>
        {/* Actual Duration */}
        <td className="px-2 py-3 text-right text-xs text-muted-foreground font-mono">
          {render.actual_duration != null ? `${render.actual_duration.toFixed(1)}s` : render.duration_total_escena != null ? `${render.duration_total_escena.toFixed(1)}s` : "—"}
        </td>
        {/* Activa */}
        <td className="px-2 py-3 text-center">
          {render.activa ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 inline-block" />
          ) : (
            <XCircle className="w-4 h-4 text-muted-foreground/30 inline-block" />
          )}
        </td>
        {/* Estado Render */}
        <td className="px-2 py-3">
          {render.estado_render && (
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", estilo.bg, estilo.text)}>
              {render.estado_render}
            </span>
          )}
        </td>
        {/* Copy_ES (truncated) */}
        <td className="px-2 py-3 max-w-[180px]">
          {render.copy_es && (
            <p className="text-[10px] text-muted-foreground truncate">{render.copy_es}</p>
          )}
        </td>
        {/* AE Template Estilo */}
        <td className="px-2 py-3">
          {render.ae_template_estilo?.length > 0 && (
            <div className="flex flex-wrap gap-0.5">
              {render.ae_template_estilo.map((e, i) => (
                <span key={i} className="text-[9px] px-1 py-0.5 rounded font-medium bg-teal-400/10 text-teal-400 truncate max-w-[80px] inline-block">
                  {e}
                </span>
              ))}
            </div>
          )}
        </td>
        {/* Preview image (Slide or Muestra) */}
        <td className="px-0.5 py-1.5">
          {previewImg ? (
            <div className="w-16 h-10 rounded overflow-hidden bg-muted border border-teal-500/30">
              <img src={previewImg} alt={`Render ${render.n_render}`} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-10 rounded bg-muted/30 border border-border/20 flex items-center justify-center">
              <ImageIcon className="w-3 h-3 text-muted-foreground/20" />
            </div>
          )}
        </td>
        {/* Expand */}
        <td className="w-4 pr-2">
          <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground/40 transition-transform", isExpanded && "rotate-90")} />
        </td>
      </tr>

      {/* Expanded Content */}
      {isExpanded && (
        <tr className="border-b border-border/40 bg-muted/10">
          <td colSpan={9} className="px-4 py-4">
            <div className="space-y-4">
              {/* Preview large */}
              {previewImg && (
                <div className="w-[480px] h-[270px] rounded-xl overflow-hidden bg-muted border border-border/30">
                  <img src={previewImg} alt={`Render ${render.n_render}`} className="w-full h-full object-contain bg-black/20" />
                </div>
              )}

              {/* Copy_ES full */}
              {render.copy_es && (
                <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-teal-400 font-semibold mb-2">Copy ES</p>
                  <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">{render.copy_es}</p>
                </div>
              )}

              {/* Metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Start</p>
                  <p className="text-xs font-mono text-foreground">{render.start != null ? `${render.start.toFixed(2)}s` : "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Duración</p>
                  <p className="text-xs font-mono text-foreground">{render.actual_duration != null ? `${render.actual_duration.toFixed(2)}s` : render.duration_total_escena != null ? `${render.duration_total_escena.toFixed(2)}s` : "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Estado</p>
                  {render.estado_render ? (
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", estilo.bg, estilo.text)}>{render.estado_render}</span>
                  ) : (
                    <p className="text-xs text-muted-foreground">—</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Status</p>
                  <p className="text-xs text-foreground">{render.status || "—"}</p>
                </div>
              </div>

              {/* AE Template info */}
              {render.ae_template_estilo?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">After Effects Template — Estilo</p>
                  <div className="flex flex-wrap gap-1.5">
                    {render.ae_template_estilo.map((e, i) => (
                      <span key={i} className="text-[10px] px-2 py-1 rounded-md font-medium bg-teal-400/10 text-teal-400 border border-teal-500/20">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback */}
              {render.feedback_render && (
                <div className="rounded-lg border border-border/30 bg-muted/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Feedback Render</p>
                  <p className="text-xs text-foreground/70 whitespace-pre-wrap">{render.feedback_render}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── AE Render Table ─────────────────────────────────────
function AeRenderTable({ renders }: { renders: AeRender[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const withSlide = renders.filter((r) => r.slide).length;
  const withMuestra = renders.filter((r) => r.muestra_ae).length;
  const activeCount = renders.filter((r) => r.activa).length;

  return (
    <div className="-mx-6 border-y border-border/40 bg-background/30">
      <div className="sticky top-0 z-20 px-5 py-3 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Film className="w-4 h-4 text-teal-400" />
          AE Renders
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-medium text-muted-foreground">
            {renders.length}
          </span>
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-teal-400/80">{activeCount} activos</span>
          <span className="text-[10px] text-violet-400/80">{withSlide} slides</span>
          <span className="text-[10px] text-pink-400/80">{withMuestra} muestras</span>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-center px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-8 bg-muted/30">#</th>
            <th className="text-right px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-14 bg-muted/30">Start</th>
            <th className="text-right px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-14 bg-muted/30">Dur.</th>
            <th className="text-center px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-10 bg-muted/30">Act</th>
            <th className="text-left px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-24 bg-muted/30">Estado</th>
            <th className="text-left px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold bg-muted/30">Copy ES</th>
            <th className="text-left px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-24 bg-muted/30">Estilo AE</th>
            <th className="text-left px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-16 bg-muted/30">Img</th>
            <th className="w-4 bg-muted/30"></th>
          </tr>
        </thead>
        <tbody>
          {renders.map((render) => (
            <AeRenderRow
              key={render.id}
              render={render}
              isExpanded={expandedId === render.id}
              onToggle={() => setExpandedId(expandedId === render.id ? null : render.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────
export function MontajeTabPanel({ video }: { video: VideoWithScenes }) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: renders = [] } = useRenders(video.id);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(false);
  const { currentAccount } = useAccountStore();
  const accountId = currentAccount?.id;

  const handleLinkedUpdate = useCallback(
    async (field: string, ids: string[]) => {
      try {
        const res = await fetch("/api/data/videos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: video.id, fields: { [field]: ids } }),
        });
        if (!res.ok) {
          queryClient.invalidateQueries({ queryKey: ["video-detail", video.id] });
        }
      } catch {
        queryClient.invalidateQueries({ queryKey: ["video-detail", video.id] });
      }
    },
    [video.id, queryClient]
  );

  const formatoConfig = getLinkedFieldDef("videos", "Formato Diseño Slides");
  const estiloConfig = getLinkedFieldDef("videos", "Estilos Musicales");

  // On mount: immediately fetch fresh data
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ["video-detail"] });
    }
  }, [queryClient]);

  // Smart polling: refresh while active scenes are missing slides/broll/avatars/audio
  const totalScenes = video.scenes.length;
  const needsPolling = totalScenes > 0 && (
    video.scenes.some(s => s.slide_activa && !s.slide) ||
    video.scenes.some(s => s.broll_activa && !s.broll_thumb) ||
    video.scenes.some(s => !s.camera_s3_url && !s.photo_avatar) ||
    video.scenes.some(s => !s.audio_attachment)
  );

  useEffect(() => {
    if (!needsPolling) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }

    pollRef.current = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["video-detail"] });
    }, 10_000);

    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [needsPolling, queryClient]);

  return (
    <div
      className="h-full overflow-y-auto px-6 py-6 space-y-6"
      onKeyDown={(e) => { if (e.key === " " && (e.target as HTMLElement).tagName !== "TEXTAREA" && (e.target as HTMLElement).tagName !== "INPUT") e.preventDefault(); }}
    >
      {/* Linked Record Selectors: Formato Slides + Estilo Musical */}
      <div className="grid grid-cols-2 gap-4">
        {formatoConfig && (
          <LinkedRecordSelector
            fieldName="Formato Diseño Slides"
            recordIds={video.formato_diseno_slides_ids || []}
            config={formatoConfig}
            accountId={accountId}
            onChange={(ids) => handleLinkedUpdate("Formato Diseño Slides", ids)}
          />
        )}
        {estiloConfig && (
          <LinkedRecordSelector
            fieldName="Estilo Musical"
            recordIds={video.estilo_musical_ids || []}
            config={estiloConfig}
            accountId={accountId}
            onChange={(ids) => handleLinkedUpdate("Estilos Musicales", ids)}
          />
        )}
      </div>

      {/* Action: Crear Video (GenerateFullVideo) */}
      <ActionButton
        videoId={video.id}
        action="GenerateFullVideo"
        label="Crear Video Completo"
        confirmLabel="Confirmar creación de video completo"
        icon={<Play className="w-5 h-5" />}
        color="amber"
      />

      {/* Montaje Scene Table */}
      {video.scenes.length > 0 && (
        <MontajeSceneTable scenes={video.scenes} />
      )}

      {/* AE Render Table */}
      {renders.length > 0 && (
        <AeRenderTable renders={renders} />
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
