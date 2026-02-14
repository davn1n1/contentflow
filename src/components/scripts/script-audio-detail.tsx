"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Loader2, FileText, Headphones, Clapperboard,
  CheckCircle2, XCircle, Clock, Hash,
  Volume2, Calendar, ExternalLink, Lightbulb,
  Save, AlertCircle, Users, UserCog,
  Cpu, Zap, Shield, Play,
} from "lucide-react";
import type { VideoWithScenes, LinkedIdea, SceneDetail } from "@/lib/hooks/use-video-detail";
import { ChevronDown } from "lucide-react";
import { LinkedRecordPicker } from "./linked-record-picker";

interface ScriptAudioDetailProps {
  video: VideoWithScenes | undefined;
  isLoading: boolean;
}

const TABS = [
  { key: "script", label: "Script & Copy", icon: FileText },
  { key: "audio", label: "Audio", icon: Headphones },
  { key: "escenas", label: "Escenas", icon: Clapperboard },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ScriptAudioDetail({ video, isLoading }: ScriptAudioDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("script");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <FileText className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">Cargando video...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="px-6 border-b border-border">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.key === "escenas" && video.scenes.length > 0 && (
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-medium">
                    {video.scenes.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {activeTab === "script" && <TabScript video={video} />}
        {activeTab === "audio" && <TabAudio video={video} />}
        {activeTab === "escenas" && <TabEscenas video={video} />}
      </div>
    </div>
  );
}

// ─── Tab: Script & Copy ──────────────────────────────────

function TabScript({ video }: { video: VideoWithScenes }) {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Scheduled Date */}
      <ScheduledDateEditor videoId={video.id} initialDate={video.scheduled_date} />

      {/* Basado en — Inspiration Source */}
      {video.linkedIdea && (
        <InspirationSource idea={video.linkedIdea} />
      )}

      {/* Extension Listado */}
      {video.extension_listado && (
        <InfoSection title="Extension Listado">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium">
            <Clock className="w-4 h-4" />
            {video.extension_listado}
          </div>
        </InfoSection>
      )}

      {/* VoiceDNA */}
      {video.voice_dna_ids && video.voice_dna_ids.length > 0 && (
        <InfoSection title="VoiceDNA">
          <div className="flex flex-wrap gap-2">
            {video.voice_dna_ids.map((id, i) => (
              <span key={i} className="px-3 py-1.5 bg-muted rounded-lg text-sm">
                {id}
              </span>
            ))}
          </div>
        </InfoSection>
      )}

      {/* Intro & CTA — Horizontal layout */}
      <LinkedRecordSection videoId={video.id} video={video} />

      {/* Pre Feedback — IMPORTANT field */}
      <FeedbackEditor videoId={video.id} initialFeedback={video.feedback_copy} />

      {/* Busca Videos en X */}
      {(video.busca_videos_x || video.keywords_search) && (
        <InfoSection title="Busca Videos en X">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {video.busca_videos_x && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Buscar</span>
                <p className="mt-0.5">{video.busca_videos_x}</p>
              </div>
            )}
            {video.keywords_search && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Keywords</span>
                <p className="mt-0.5">{video.keywords_search}</p>
              </div>
            )}
          </div>
        </InfoSection>
      )}

      {/* Avatar Set & Persona — Side by Side with pickers */}
      <AvatarPersonaSection videoId={video.id} video={video} />

      {/* Engine Copy & Genera Reels */}
      {(video.engine_copy || video.genera_reels) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {video.engine_copy && (
            <InfoSection title="Engine Copy">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 text-rose-400 rounded-lg text-sm font-medium">
                <Cpu className="w-4 h-4" />
                {video.engine_copy}
              </div>
            </InfoSection>
          )}
          {video.genera_reels && (
            <InfoSection title="Genera Reels">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium">
                <Zap className="w-4 h-4" />
                {video.genera_reels}
              </div>
            </InfoSection>
          )}
        </div>
      )}

      {/* Sponsors */}
      {video.sponsor_ids && video.sponsor_ids.length > 0 && (
        <InfoSection title="Sponsors">
          <div className="flex flex-wrap gap-2">
            {video.sponsor_ids.map((id, i) => (
              <span key={i} className="px-3 py-1.5 bg-muted rounded-lg text-sm">
                {id}
              </span>
            ))}
          </div>
        </InfoSection>
      )}

      {/* ── ACTION: Crear Copy ── */}
      <div className="pt-2">
        <ActionButton
          videoId={video.id}
          action="GenerateCopy"
          label="Crear Copy (Script)"
          confirmLabel="Confirmar ejecución"
          icon={<Play className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* ── Scene Summary Table ── */}
      {video.scenes.length > 0 && (
        <SceneSummaryTable scenes={video.scenes} />
      )}

      {/* Status */}
      {video.status_copy_analysis && (
        <InfoSection title="Status & Copy Analysis">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm font-medium">
            {video.status_copy_analysis}
          </span>
        </InfoSection>
      )}

      {/* Post Content / Script */}
      {video.post_content && (
        <InfoSection title="Post Content / Copy">
          <div className="text-sm whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
            {video.post_content}
          </div>
        </InfoSection>
      )}

      {/* ElevenLabs Text */}
      {video.elevenlabs_text && (
        <InfoSection title="ElevenLabs Text (Script Final)">
          <div className="text-sm whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto font-mono text-xs">
            {video.elevenlabs_text}
          </div>
        </InfoSection>
      )}

      {/* Tags */}
      {video.tags && (
        <InfoSection title="Tags IA">
          <p className="text-sm text-muted-foreground">{video.tags}</p>
        </InfoSection>
      )}
    </div>
  );
}

// ─── Scheduled Date Editor ─────────────────────────────────

function formatDateHuman(iso: string): { day: string; weekday: string; time: string; relative: string } {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const weekday = d.toLocaleDateString("es-ES", { weekday: "long" });
  const day = d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  let relative = "";
  if (diffDays === 0) relative = "Hoy";
  else if (diffDays === 1) relative = "Mañana";
  else if (diffDays === -1) relative = "Ayer";
  else if (diffDays > 1) relative = `En ${diffDays} días`;
  else relative = `Hace ${Math.abs(diffDays)} días`;

  return { day, weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1), time, relative };
}

function ScheduledDateEditor({ videoId, initialDate }: { videoId: string; initialDate: string | null }) {
  const [date, setDate] = useState(initialDate || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  const parsed = date ? formatDateHuman(date) : null;
  const isPast = date ? new Date(date).getTime() < Date.now() : false;

  const handleSave = useCallback(async () => {
    if (!date) return;
    setSaving(true);
    try {
      await fetch("/api/data/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: videoId,
          fields: { "Scheduled Date": date },
        }),
      });
      setSaved(true);
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["video-detail", videoId] });
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Error handled silently
    } finally {
      setSaving(false);
    }
  }, [date, videoId, queryClient]);

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Calendar icon block */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0",
            isPast ? "bg-red-500/10" : "bg-primary/10"
          )}>
            <Calendar className={cn("w-5 h-5", isPast ? "text-red-400" : "text-primary")} />
          </div>

          {/* Date display */}
          <div>
            {parsed ? (
              <>
                <p className="text-sm font-semibold">
                  {parsed.weekday}, {parsed.day}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{parsed.time}h</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md font-medium",
                    parsed.relative === "Hoy" && "bg-emerald-500/15 text-emerald-400",
                    parsed.relative === "Mañana" && "bg-blue-500/15 text-blue-400",
                    parsed.relative.startsWith("En") && "bg-primary/10 text-primary",
                    (parsed.relative.startsWith("Hace") || parsed.relative === "Ayer") && "bg-red-500/15 text-red-400",
                  )}>
                    {parsed.relative}
                  </span>
                  {saved && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-emerald-500/15 text-emerald-400 animate-in fade-in">
                      Guardado
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sin fecha programada</p>
            )}
          </div>
        </div>

        {/* Edit toggle */}
        <button
          onClick={() => setEditing(!editing)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
        >
          {editing ? "Cancelar" : "Editar"}
        </button>
      </div>

      {/* Inline editor */}
      {editing && (
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
          <input
            type="datetime-local"
            value={date ? new Date(date).toISOString().slice(0, 16) : ""}
            onChange={(e) => {
              setDate(e.target.value ? new Date(e.target.value).toISOString() : "");
              setSaved(false);
            }}
            className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            onClick={handleSave}
            disabled={saving || !date}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              "bg-primary/10 text-primary hover:bg-primary/20",
              (saving || !date) && "opacity-50 cursor-not-allowed"
            )}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Feedback Editor ─────────────────────────────────────

function FeedbackEditor({ videoId, initialFeedback }: { videoId: string; initialFeedback: string | null }) {
  const [feedback, setFeedback] = useState(initialFeedback || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/data/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: videoId,
          fields: { Feedback: feedback },
        }),
      });
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["video-detail", videoId] });
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Error handled silently
    } finally {
      setSaving(false);
    }
  }, [feedback, videoId, queryClient]);

  return (
    <div className="rounded-xl p-5 space-y-3 border-2 border-amber-500/30 bg-amber-500/[0.03]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          Pre Feedback para la creación del copy
        </h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
            saved
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
            saving && "opacity-50 cursor-not-allowed"
          )}
        >
          {saving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <Save className="w-3 h-3" />
          )}
          {saved ? "Guardado" : "Guardar"}
        </button>
      </div>
      <textarea
        value={feedback}
        onChange={(e) => {
          setFeedback(e.target.value);
          setSaved(false);
        }}
        rows={4}
        placeholder="Escribe aquí las instrucciones y feedback para la creación del copy..."
        className="w-full bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-y placeholder:text-muted-foreground/50"
      />
    </div>
  );
}

// ─── Inspiration Source ──────────────────────────────────

function InspirationSource({ idea }: { idea: LinkedIdea }) {
  return (
    <div className="glass-card rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        Basado en
      </h3>
      <div className="flex gap-4">
        {/* Thumbnail */}
        {idea.thumb_url && (
          <div className="w-40 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={idea.thumb_url}
              alt={idea.idea_title || ""}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-2">
          {/* Title */}
          <p className="text-sm font-semibold leading-tight">
            {idea.idea_title || "Idea sin título"}
          </p>

          {/* Channel / Domain */}
          {(idea.yt_channel_name || idea.domain) && (
            <div className="flex items-center gap-2">
              {idea.yt_channel_name && (
                <span className="inline-flex items-center px-2 py-0.5 bg-muted rounded-md text-xs font-medium">
                  {idea.yt_channel_name}
                </span>
              )}
              {idea.domain && (
                <span className="text-xs text-muted-foreground">{idea.domain}</span>
              )}
            </div>
          )}

          {/* Summary */}
          {idea.summary && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {idea.summary}
            </p>
          )}

          {/* Link */}
          {idea.url_fuente && (
            <a
              href={idea.url_fuente}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Ver fuente
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Linked Record Section (Intro, CTA — with Picker) ────

function LinkedRecordSection({ videoId, video }: { videoId: string; video: VideoWithScenes }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);

  const handleUpdate = useCallback(
    async (field: string, ids: string[]) => {
      setSaving(field);
      try {
        const res = await fetch("/api/data/videos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: videoId, fields: { [field]: ids } }),
        });
        if (!res.ok) {
          // PATCH failed — force refetch to restore correct state
          queryClient.invalidateQueries({ queryKey: ["video-detail", videoId] });
        }
        // On success: DON'T invalidate immediately — Airtable cache (60s) would
        // return stale data and wipe the optimistic selection. The picker's
        // optimistic state handles the visual update. Data syncs on next navigation.
      } catch {
        queryClient.invalidateQueries({ queryKey: ["video-detail", videoId] });
      } finally {
        setSaving(null);
      }
    },
    [videoId, queryClient]
  );

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Intro & CTA</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Intro Text */}
        <LinkedRecordPicker
          label="Intro (Texto)"
          table="ctas"
          selected={video.linkedIntros}
          onSelectionChange={(ids) => handleUpdate("Intro", ids)}
          multiple={false}
          color="emerald"
          showImages={false}
          isSaving={saving === "Intro"}
          clientFilters={[{ field: "CTA/Intro", values: ["Intro"] }]}
        />
        {/* CTA Text */}
        <LinkedRecordPicker
          label="CTA (Texto)"
          table="ctas"
          selected={video.linkedCtas}
          onSelectionChange={(ids) => handleUpdate("CTA", ids)}
          multiple={false}
          color="blue"
          showImages={false}
          isSaving={saving === "CTA"}
          clientFilters={[{ field: "CTA/Intro", values: ["CTA"] }]}
        />
        {/* Intro Broll: Account + Status active + Custom true + Tags INTRO */}
        <LinkedRecordPicker
          label="Intro Broll"
          table="broll"
          selected={video.linkedIntroBrolls}
          onSelectionChange={(ids) => handleUpdate("Intro Broll", ids)}
          color="emerald"
          largePreview
          isSaving={saving === "Intro Broll"}
          clientFilters={[
            { field: "Status", values: ["Activo"] },
            { field: "Custom", values: [true, "true"] },
            { field: "Tags", values: ["INTRO", "Intro"] },
          ]}
        />
        {/* CTA Broll: Account + Status Activo + Custom true + Tags CTA */}
        <LinkedRecordPicker
          label="CTA Broll"
          table="broll"
          selected={video.linkedCtaBrolls}
          onSelectionChange={(ids) => handleUpdate("CTA Broll", ids)}
          color="blue"
          largePreview
          isSaving={saving === "CTA Broll"}
          clientFilters={[
            { field: "Status", values: ["Activo"] },
            { field: "Custom", values: [true, "true"] },
            { field: "Tags", values: ["CTA", "Cta"] },
          ]}
        />
      </div>
    </div>
  );
}

// ─── Avatar & Persona Section (with Picker) ──────────────

function AvatarPersonaSection({ videoId, video }: { videoId: string; video: VideoWithScenes }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);

  const handleUpdate = useCallback(
    async (field: string, ids: string[]) => {
      setSaving(field);
      try {
        const res = await fetch("/api/data/videos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: videoId, fields: { [field]: ids } }),
        });
        if (!res.ok) {
          queryClient.invalidateQueries({ queryKey: ["video-detail", videoId] });
        }
        // On success: DON'T invalidate — optimistic state handles the visual update
      } catch {
        queryClient.invalidateQueries({ queryKey: ["video-detail", videoId] });
      } finally {
        setSaving(null);
      }
    },
    [videoId, queryClient]
  );

  // Convert linked avatar/persona to PickerRecord format
  const avatarSelected = video.linkedAvatarSet
    ? [{ id: video.linkedAvatarSet.id, name: video.linkedAvatarSet.name, image_url: video.linkedAvatarSet.image_url, status: video.linkedAvatarSet.status }]
    : [];
  const personaSelected = video.linkedPersona
    ? [{ id: video.linkedPersona.id, name: video.linkedPersona.name, image_url: video.linkedPersona.image_url, status: video.linkedPersona.status }]
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="glass-card rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" />
          Avatar Set
        </h3>
        <LinkedRecordPicker
          label="Avatar Set"
          table="avatares-set"
          selected={avatarSelected}
          onSelectionChange={(ids) => handleUpdate("Avatar Set", ids)}
          multiple={false}
          color="violet"
          largePreview
          isSaving={saving === "Avatar Set"}
        />
      </div>
      <div className="glass-card rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <UserCog className="w-4 h-4 text-cyan-400" />
          Persona
        </h3>
        <LinkedRecordPicker
          label="Persona"
          table="persona"
          selected={personaSelected}
          onSelectionChange={(ids) => handleUpdate("Persona", ids)}
          multiple={false}
          color="cyan"
          largePreview
          isSaving={saving === "Persona"}
        />
      </div>
    </div>
  );
}


// ─── Action Button with Double Confirmation ──────────────

function ActionButton({
  videoId,
  action,
  label,
  confirmLabel,
  icon,
  color,
}: {
  videoId: string;
  action: string;
  label: string;
  confirmLabel: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "amber" | "rose";
}) {
  const [state, setState] = useState<"idle" | "confirming" | "executing" | "success" | "error">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-reset from confirming state after 5s
  useEffect(() => {
    if (state === "confirming") {
      timerRef.current = setTimeout(() => setState("idle"), 5000);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
  }, [state]);

  // Auto-reset success/error after 3s
  useEffect(() => {
    if (state === "success" || state === "error") {
      const t = setTimeout(() => setState("idle"), 3000);
      return () => clearTimeout(t);
    }
  }, [state]);

  const handleClick = useCallback(async () => {
    if (state === "idle") {
      setState("confirming");
      return;
    }
    if (state === "confirming") {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState("executing");
      try {
        const res = await fetch("/api/webhooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, recordId: videoId }),
        });
        setState(res.ok ? "success" : "error");
      } catch {
        setState("error");
      }
    }
  }, [state, action, videoId]);

  const colorStyles = {
    blue: {
      idle: "bg-blue-600 hover:bg-blue-500 text-white",
      confirming: "bg-amber-500 hover:bg-amber-400 text-black",
      executing: "bg-blue-600/50 text-white",
      success: "bg-emerald-600 text-white",
      error: "bg-red-600 text-white",
    },
    green: {
      idle: "bg-emerald-600 hover:bg-emerald-500 text-white",
      confirming: "bg-amber-500 hover:bg-amber-400 text-black",
      executing: "bg-emerald-600/50 text-white",
      success: "bg-emerald-600 text-white",
      error: "bg-red-600 text-white",
    },
    amber: {
      idle: "bg-amber-600 hover:bg-amber-500 text-white",
      confirming: "bg-red-500 hover:bg-red-400 text-white",
      executing: "bg-amber-600/50 text-white",
      success: "bg-emerald-600 text-white",
      error: "bg-red-600 text-white",
    },
    rose: {
      idle: "bg-rose-600 hover:bg-rose-500 text-white",
      confirming: "bg-amber-500 hover:bg-amber-400 text-black",
      executing: "bg-rose-600/50 text-white",
      success: "bg-emerald-600 text-white",
      error: "bg-red-600 text-white",
    },
  };

  const styles = colorStyles[color];

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        Pulsar para crear script
      </p>
      <p className="text-xs text-muted-foreground mb-3">
        Esperar unos minutos hasta que salga en la parte inferior
      </p>
      <button
        onClick={handleClick}
        disabled={state === "executing" || state === "success"}
        className={cn(
          "w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-bold transition-all duration-300",
          styles[state],
          (state === "executing" || state === "success") && "cursor-not-allowed"
        )}
      >
        {state === "idle" && (
          <>
            {icon}
            {label}
          </>
        )}
        {state === "confirming" && (
          <>
            <Shield className="w-5 h-5" />
            {confirmLabel} — Click para ejecutar
          </>
        )}
        {state === "executing" && (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Ejecutando...
          </>
        )}
        {state === "success" && (
          <>
            <CheckCircle2 className="w-5 h-5" />
            Enviado correctamente
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="w-5 h-5" />
            Error al ejecutar
          </>
        )}
      </button>
      {state === "confirming" && (
        <p className="text-[10px] text-center text-amber-400/80 animate-pulse">
          Se reiniciará en 5 segundos si no confirmas
        </p>
      )}
    </div>
  );
}


// ─── Tab: Audio ──────────────────────────────────────────

function TabAudio({ video }: { video: VideoWithScenes }) {
  const scenesWithAudio = video.scenes.filter(s => s.voice_s3).length;
  const scenesRevisadas = video.scenes.filter(s => s.audio_revisado_ok).length;
  const totalDuration = video.scenes.reduce((sum, s) => sum + (s.voice_length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Audio Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Escenas con Audio"
          value={`${scenesWithAudio}/${video.scenes.length}`}
          icon={<Volume2 className="w-4 h-4" />}
        />
        <StatCard
          label="Audio Revisado OK"
          value={`${scenesRevisadas}/${video.scenes.length}`}
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
        <StatCard
          label="Duración Total"
          value={totalDuration > 0 ? formatSeconds(totalDuration) : "—"}
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          label="Status Audio"
          value={video.status_audio ? "Completado" : "Pendiente"}
          icon={<Headphones className="w-4 h-4" />}
          highlight={video.status_audio}
        />
      </div>

      {/* Voice Length Minutes */}
      {video.voice_length_minutes && (
        <InfoSection title="Voice Length">
          <p className="text-lg font-bold font-mono">{video.voice_length_minutes}</p>
        </InfoSection>
      )}

      {/* ── ACTION: Crear Audio ── */}
      <ActionButton
        videoId={video.id}
        action="GenerateAudio"
        label="Crear Audio"
        confirmLabel="Confirmar creación de audio"
        icon={<Headphones className="w-5 h-5" />}
        color="green"
      />

      {/* Safety toggles */}
      <InfoSection title="Estado Pipeline Audio">
        <div className="grid grid-cols-[180px_1fr] gap-y-2 gap-x-4 text-sm">
          <span className="text-muted-foreground">Status Copy</span>
          <StatusIndicator active={video.status_copy} />
          <span className="text-muted-foreground">Status Audio</span>
          <StatusIndicator active={video.status_audio} />
          <span className="text-muted-foreground">Formato</span>
          <span>{video.formato || "—"}</span>
          {video.status_agentes && (
            <>
              <span className="text-muted-foreground">Status Agentes IA</span>
              <span>{video.status_agentes}</span>
            </>
          )}
        </div>
      </InfoSection>

      {/* Scenes Audio Table */}
      {video.scenes.length > 0 && (
        <InfoSection title="Audio por Escena">
          <div className="overflow-x-auto -mx-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-3 font-medium">#</th>
                  <th className="text-left py-2 px-3 font-medium">Clasificación</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium">Audio</th>
                  <th className="text-right py-2 px-3 font-medium">Duración</th>
                  <th className="text-center py-2 px-3 font-medium">Revisado</th>
                </tr>
              </thead>
              <tbody>
                {video.scenes.map((scene) => (
                  <tr key={scene.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-3 font-mono font-medium">{scene.n_escena}</td>
                    <td className="py-2 px-3">
                      <SceneTypeBadge type={scene.clasificación_escena} />
                    </td>
                    <td className="py-2 px-3">
                      <SceneStatusBadge status={scene.status} />
                    </td>
                    <td className="py-2 px-3">
                      {scene.voice_s3 ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Volume2 className="w-3 h-3" /> Audio OK
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {scene.voice_length ? `${scene.voice_length.toFixed(1)}s` : "—"}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {scene.audio_revisado_ok ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </InfoSection>
      )}
    </div>
  );
}

// ─── Scene Summary Table (below Crear Copy button) ───────

function SceneSummaryTable({ scenes }: { scenes: SceneDetail[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-primary" />
          Escenas
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-medium text-muted-foreground">
            {scenes.length}
          </span>
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-8">#</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-28">Clasificación</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Script</th>
              <th className="text-center px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-16">Copy OK</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-48">Informe Resumen</th>
              <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-48">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {scenes.map((scene) => {
              const isExpanded = expandedId === scene.id;
              return (
                <SceneSummaryRow
                  key={scene.id}
                  scene={scene}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedId(isExpanded ? null : scene.id)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SceneSummaryRow({ scene, isExpanded, onToggle }: {
  scene: SceneDetail;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const scriptPreview = scene.script
    ? scene.script.length > 120 ? scene.script.slice(0, 120) + "..." : scene.script
    : "—";

  return (
    <>
      {/* Summary row */}
      <tr
        onClick={onToggle}
        className={cn(
          "border-b border-border/50 cursor-pointer transition-colors",
          isExpanded ? "bg-primary/5" : "hover:bg-muted/30"
        )}
      >
        <td className="px-4 py-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold">
            {scene.n_escena}
          </span>
        </td>
        <td className="px-4 py-3">
          <SceneTypeBadge type={scene.clasificación_escena} />
        </td>
        <td className="px-4 py-3">
          <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">{scriptPreview}</p>
        </td>
        <td className="px-4 py-3 text-center">
          {scene.copy_revisado_ok ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
          ) : (
            <XCircle className="w-5 h-5 text-muted-foreground/30 mx-auto" />
          )}
        </td>
        <td className="px-4 py-3">
          <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
            {scene.informe_resumen_emoticonos || "—"}
          </p>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed flex-1">
              {scene.solo_observaciones || "—"}
            </p>
            <ChevronDown className={cn(
              "w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform",
              isExpanded && "rotate-180"
            )} />
          </div>
        </td>
      </tr>

      {/* Expanded detail */}
      {isExpanded && (
        <tr className="bg-primary/5">
          <td colSpan={6} className="px-4 py-4">
            <div className="space-y-3 max-w-4xl">
              {/* Full script */}
              {scene.script && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Script completo</span>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed mt-1 bg-muted/30 rounded-lg p-3">
                    {scene.script}
                  </p>
                </div>
              )}

              {/* Metadata grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {scene.topic && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Topic</span>
                    <p className="text-sm mt-0.5">{scene.topic}</p>
                  </div>
                )}
                {scene.role && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Role</span>
                    <p className="text-sm mt-0.5">{scene.role}</p>
                  </div>
                )}
                {scene.importance && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Importancia</span>
                    <p className="text-sm mt-0.5">{scene.importance}</p>
                  </div>
                )}
                {scene.voice_length != null && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Duración voz</span>
                    <p className="text-sm mt-0.5">{scene.voice_length.toFixed(1)}s</p>
                  </div>
                )}
                {scene.status && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status</span>
                    <p className="text-sm mt-0.5">{scene.status}</p>
                  </div>
                )}
                {scene.status_script && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status Script</span>
                    <p className="text-sm mt-0.5">{scene.status_script}</p>
                  </div>
                )}
                {scene.status_audio && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Status Audio</span>
                    <p className="text-sm mt-0.5">{scene.status_audio}</p>
                  </div>
                )}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Audio OK</span>
                  <p className="text-sm mt-0.5">{scene.audio_revisado_ok ? "✅" : "❌"}</p>
                </div>
              </div>

              {/* Full informe if longer than preview */}
              {scene.informe_resumen_emoticonos && scene.informe_resumen_emoticonos.length > 80 && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Informe Resumen Completo</span>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed mt-1 bg-muted/30 rounded-lg p-3">
                    {scene.informe_resumen_emoticonos}
                  </p>
                </div>
              )}

              {/* Full observaciones if longer */}
              {scene.solo_observaciones && scene.solo_observaciones.length > 80 && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Observaciones Completas</span>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed mt-1 bg-amber-500/10 rounded-lg p-3 text-amber-200">
                    {scene.solo_observaciones}
                  </p>
                </div>
              )}

              {/* Script ElevenLabs */}
              {scene.script_elevenlabs && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Script ElevenLabs</span>
                  <p className="text-xs font-mono whitespace-pre-wrap leading-relaxed mt-1 bg-muted/30 rounded-lg p-3 text-muted-foreground">
                    {scene.script_elevenlabs}
                  </p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Tab: Escenas ────────────────────────────────────────

function TabEscenas({ video }: { video: VideoWithScenes }) {
  if (video.scenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Clapperboard className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">No hay escenas disponibles</p>
        <p className="text-xs mt-1">Las escenas se generan durante el proceso de Copy</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {video.scenes.length} escenas
        </h3>
      </div>

      {video.scenes.map((scene) => (
        <div
          key={scene.id}
          className="glass-card rounded-xl p-4 space-y-3 hover:ring-1 hover:ring-primary/20 transition-all"
        >
          {/* Scene header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">
                {scene.n_escena}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <SceneTypeBadge type={scene.clasificación_escena} />
                  <SceneStatusBadge status={scene.status} />
                </div>
                {scene.topic && (
                  <p className="text-xs text-muted-foreground mt-0.5">{scene.topic}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {scene.voice_length && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {scene.voice_length.toFixed(1)}s
                </span>
              )}
              {scene.audio_revisado_ok && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>
          </div>

          {/* Script content */}
          {scene.script && (
            <div className="relative">
              <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-3">
                {scene.script}
              </p>
            </div>
          )}

          {/* Scene metadata row */}
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            {scene.role && (
              <span className="flex items-center gap-1">
                <Hash className="w-2.5 h-2.5" />
                {scene.role}
              </span>
            )}
            {scene.importance && (
              <span>Importancia: {scene.importance}</span>
            )}
            {scene.status_script && (
              <span>Script: {scene.status_script}</span>
            )}
            {scene.status_audio && (
              <span>Audio: {scene.status_audio}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function StatCard({
  label, value, icon, highlight,
}: {
  label: string; value: string; icon: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className={cn(
        "text-lg font-bold",
        highlight ? "text-emerald-400" : "text-foreground"
      )}>
        {value}
      </p>
    </div>
  );
}

function StatusIndicator({ active }: { active: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-xs font-medium",
      active ? "text-emerald-400" : "text-muted-foreground"
    )}>
      {active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 opacity-40" />}
      {active ? "Completado" : "Pendiente"}
    </span>
  );
}

function SceneTypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const isFocus = type.toLowerCase().includes("focus") || type.toLowerCase().includes("intro");
  return (
    <span className={cn(
      "text-[10px] px-1.5 py-0.5 rounded font-medium",
      isFocus
        ? "bg-blue-500/20 text-blue-400"
        : "bg-muted text-muted-foreground"
    )}>
      {type}
    </span>
  );
}

function SceneStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const isFocus = status.toLowerCase() === "focus";
  const isDesarrollo = status.toLowerCase() === "desarrollo";
  return (
    <span className={cn(
      "text-[10px] px-1.5 py-0.5 rounded font-medium",
      isFocus && "bg-amber-500/20 text-amber-400",
      isDesarrollo && "bg-sky-500/20 text-sky-400",
      !isFocus && !isDesarrollo && "bg-muted text-muted-foreground",
    )}>
      {status}
    </span>
  );
}

function formatSeconds(sec: number): string {
  const min = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return min > 0 ? `${min}m ${s}s` : `${s}s`;
}
