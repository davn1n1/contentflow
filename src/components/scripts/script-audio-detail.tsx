"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Loader2, FileText, Headphones, Clapperboard,
  CheckCircle2, XCircle, Clock, Hash,
  Volume2, Calendar, ExternalLink, Lightbulb,
  Save, AlertCircle, Users, UserCog,
  Cpu, Zap, Shield, Play, Info,
  ChevronDown, Twitter, Newspaper, ImageIcon, AlertTriangle,
} from "lucide-react";
import type { VideoWithScenes, LinkedIdea, LinkedIdeaFull, SceneDetail } from "@/lib/hooks/use-video-detail";
import { WaveformAudioPlayer } from "@/components/shared/waveform-audio-player";
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

export function TabScript({ video }: { video: VideoWithScenes }) {
  return (
    <div className="space-y-6">
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

      {/* ── Ideas Inspiración (Videos X + Noticias) ── */}
      {video.linkedIdeas && video.linkedIdeas.length > 0 && (
        <IdeasSection ideas={video.linkedIdeas} />
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


// ─── Action Button with Generating State + Polling ──────────────

type ActionState = "idle" | "confirming" | "sending" | "generating" | "ready" | "error";

// Polling config per action: what to check and how to detect completion
const ACTION_POLL_CONFIG: Record<string, {
  pollEndpoint: "video" | "scenes";
  detectReady: (data: Record<string, unknown>, baseline: Record<string, unknown>) => boolean;
  generatingLabel: string;
  readyLabel: string;
  maxTimeout: number; // ms
}> = {
  GenerateCopy: {
    pollEndpoint: "video",
    detectReady: (d, b) => {
      // Copy done when status_copy becomes true or scenes appear/change
      const escenas = d.escenas_ids as string[] | undefined;
      const baseEscenas = b.escenas_ids as string[] | undefined;
      return (
        d.status_copy === true ||
        (!!escenas && escenas.length > 0 && (!baseEscenas || escenas.length !== baseEscenas.length))
      );
    },
    generatingLabel: "Generando copy…",
    readyLabel: "Copy generado!",
    maxTimeout: 600000, // 10 min
  },
  GenerateAudio: {
    pollEndpoint: "video",
    detectReady: (d) => d.status_audio === true,
    generatingLabel: "Generando audio…",
    readyLabel: "Audio generado!",
    maxTimeout: 600000,
  },
  GenerateAvatars: {
    pollEndpoint: "video",
    detectReady: (d) => d.status_avatares === true,
    generatingLabel: "Generando avatares…",
    readyLabel: "Avatares generados!",
    maxTimeout: 600000,
  },
  ProcesoFinalRender: {
    pollEndpoint: "video",
    detectReady: (d) => d.status_rendering_video === true,
    generatingLabel: "Renderizando video…",
    readyLabel: "Render completado!",
    maxTimeout: 900000, // 15 min
  },
};

export function ActionButton({
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
  const queryClient = useQueryClient();
  const [state, setState] = useState<ActionState>("idle");
  const stateRef = useRef<ActionState>(state);
  stateRef.current = state;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const baselineRef = useRef<Record<string, unknown>>({});

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // Auto-dismiss confirming after 5s
  useEffect(() => {
    if (state === "confirming") {
      timerRef.current = setTimeout(() => setState("idle"), 5000);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
  }, [state]);

  // Auto-dismiss ready/error after 8s
  useEffect(() => {
    if (state === "ready" || state === "error") {
      const t = setTimeout(() => setState("idle"), 8000);
      return () => clearTimeout(t);
    }
  }, [state]);

  // Elapsed timer during generating
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

  // Polling for status changes
  useEffect(() => {
    if (state !== "generating") {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    const config = ACTION_POLL_CONFIG[action];
    if (!config) return; // No polling config — stay in generating until timeout

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/data/videos?id=${videoId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (config.detectReady(data, baselineRef.current)) {
          queryClient.invalidateQueries({ queryKey: ["video-detail"] });
          setState("ready");
        }
      } catch { /* ignore */ }
    };
    pollRef.current = setInterval(checkStatus, 8000);
    const maxTimeout = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current);
      // After max timeout, show ready (webhook was sent successfully)
      setState((s) => s === "generating" ? "ready" : s);
    }, config.maxTimeout);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearTimeout(maxTimeout);
    };
  }, [state, action, videoId, queryClient]);

  const handleClick = useCallback(async () => {
    const cur = stateRef.current;
    if (cur === "error" || cur === "ready") { setState("idle"); return; }
    if (cur === "idle") { setState("confirming"); return; }
    if (cur === "confirming") {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState("sending");
      try {
        // Capture baseline before sending
        const baseRes = await fetch(`/api/data/videos?id=${videoId}`).catch(() => null);
        if (baseRes?.ok) baselineRef.current = await baseRes.json();

        const res = await fetch("/api/webhooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, recordId: videoId }),
        });
        if (res.ok) {
          setState("generating");
        } else {
          setState("error");
        }
      } catch {
        setState("error");
      }
    }
  }, [action, videoId]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
  };

  const config = ACTION_POLL_CONFIG[action];

  const colorStyles = {
    blue: {
      idle: "bg-blue-600 hover:bg-blue-500 text-white",
      confirming: "bg-amber-500 hover:bg-amber-400 text-black",
      sending: "bg-blue-600/50 text-white/70",
      generating: "bg-blue-600/30 border-blue-400/50 text-blue-300 animate-pulse",
      ready: "bg-emerald-600 text-white",
      error: "bg-red-600 text-white",
    },
    green: {
      idle: "bg-emerald-600 hover:bg-emerald-500 text-white",
      confirming: "bg-amber-500 hover:bg-amber-400 text-black",
      sending: "bg-emerald-600/50 text-white/70",
      generating: "bg-emerald-600/30 border-emerald-400/50 text-emerald-300 animate-pulse",
      ready: "bg-emerald-600 text-white",
      error: "bg-red-600 text-white",
    },
    amber: {
      idle: "bg-amber-600 hover:bg-amber-500 text-white",
      confirming: "bg-red-500 hover:bg-red-400 text-white",
      sending: "bg-amber-600/50 text-white/70",
      generating: "bg-amber-600/30 border-amber-400/50 text-amber-300 animate-pulse",
      ready: "bg-emerald-600 text-white",
      error: "bg-red-600 text-white",
    },
    rose: {
      idle: "bg-rose-600 hover:bg-rose-500 text-white",
      confirming: "bg-amber-500 hover:bg-amber-400 text-black",
      sending: "bg-rose-600/50 text-white/70",
      generating: "bg-rose-600/30 border-rose-400/50 text-rose-300 animate-pulse",
      ready: "bg-emerald-600 text-white",
      error: "bg-red-600 text-white",
    },
  };

  const styles = colorStyles[color];

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={state === "sending" || state === "generating"}
        className={cn(
          "w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 border border-transparent",
          styles[state],
          (state === "sending" || state === "generating") && "cursor-wait"
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
        {state === "sending" && (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Enviando…
          </>
        )}
        {state === "generating" && (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {config?.generatingLabel || "Procesando…"} {formatElapsed(elapsed)}
          </>
        )}
        {state === "ready" && (
          <>
            <CheckCircle2 className="w-5 h-5" />
            {config?.readyLabel || "Completado!"}
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="w-5 h-5" />
            Error — click para reintentar
          </>
        )}
      </button>
      {state === "confirming" && (
        <p className="text-[10px] text-center text-amber-400/80 animate-pulse">
          Se reiniciará en 5 segundos si no confirmas
        </p>
      )}
      {state === "generating" && (
        <p className="text-[10px] text-center text-muted-foreground/60">
          Procesando en n8n… la tabla se actualizará automáticamente
        </p>
      )}
    </div>
  );
}


// ─── Tab: Audio ──────────────────────────────────────────

export function TabAudio({ video }: { video: VideoWithScenes }) {
  const scenesWithAudio = video.scenes.filter(s => s.voice_s3).length;
  const scenesRevisadas = video.scenes.filter(s => s.audio_revisado_ok).length;
  const totalDuration = video.scenes.reduce((sum, s) => sum + (s.voice_length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Audio Stats Grid */}
      <div className="grid grid-cols-5 gap-3">
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
          label="Voice Length"
          value={video.voice_length_minutes || "—"}
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          label="Status Audio"
          value={video.status_audio ? "Completado" : "Pendiente"}
          icon={<Headphones className="w-4 h-4" />}
          highlight={video.status_audio}
        />
      </div>

      {/* ── ACTION: Crear Audio ── */}
      <ActionButton
        videoId={video.id}
        action="GenerateAudio"
        label="Crear Audio"
        confirmLabel="Confirmar creación de audio"
        icon={<Headphones className="w-5 h-5" />}
        color="green"
      />

      {/* ── Audio Scene Summary Table ── */}
      {video.scenes.length > 0 && (
        <AudioSceneSummaryTable scenes={video.scenes} />
      )}

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
    </div>
  );
}

// ─── Scene Summary Table (below Crear Copy button) ───────

// Auto-save a scene field to Airtable (debounced)
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
        } catch {
          // Silently fail — user can retry
        } finally {
          setSaving(false);
        }
      }, delay);
    },
    [sceneId, field, delay, queryClient]
  );

  return { save, saving, saved };
}

function SceneSummaryTable({ scenes }: { scenes: SceneDetail[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Keyboard navigation: up/down arrows to move between scenes, space to play/pause
  const handleKeyNav = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return;

      // Spacebar: toggle play/pause on the expanded scene's audio
      if (e.key === " ") {
        e.preventDefault();
        const audio = (e.currentTarget as HTMLElement).querySelector("audio");
        if (audio) {
          if (audio.paused) audio.play();
          else audio.pause();
        }
        return;
      }

      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;

      e.preventDefault();
      // Pause any playing audio before navigating
      const audio = (e.currentTarget as HTMLElement).querySelector("audio");
      if (audio && !audio.paused) audio.pause();

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

  // Scroll expanded scene — summary row pinned to top of visible area
  const expandedRowRef = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    if (expandedId && expandedRowRef.current) {
      expandedRowRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [expandedId]);

  const copyOkCount = scenes.filter((s) => s.copy_revisado_ok).length;

  return (
    <div
      className="-mx-6 overflow-hidden border-y border-border/40 bg-background/30"
      onKeyDown={handleKeyNav}
      tabIndex={0}
    >
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-primary" />
          Script & Copy por Escena
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-medium text-muted-foreground">
            {scenes.length}
          </span>
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground/80">
            {copyOkCount}/{scenes.length} copy OK
          </span>
          <span className="text-[10px] text-muted-foreground/40">↑↓ navegar · ␣ play/pause</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-2 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-8">#</th>
              <th className="text-left px-2 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-16">Tipo</th>
              <th className="text-left px-2 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Script</th>
              <th className="text-center px-1 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-8">OK</th>
              <th className="text-left px-2 py-2.5 text-[10px] uppercase tracking-wider text-emerald-400/60 font-semibold w-40 border-l border-emerald-500/15 bg-emerald-500/[0.04]">Informe</th>
              <th className="text-left px-2 py-2.5 text-[10px] uppercase tracking-wider text-emerald-400/60 font-semibold w-40 bg-emerald-500/[0.04]">Observaciones</th>
              <th className="text-left px-2 py-2.5 text-[10px] uppercase tracking-wider text-emerald-400/60 font-semibold w-36 bg-emerald-500/[0.04]">Comparativa</th>
              <th className="text-left px-2 py-2.5 text-[10px] uppercase tracking-wider text-amber-400/60 font-semibold w-36 border-l border-amber-500/15 bg-amber-500/[0.04]">Conclusión</th>
              <th className="text-left px-2 py-2.5 text-[10px] uppercase tracking-wider text-blue-400/60 font-semibold w-32 bg-blue-500/[0.04]">Guardaraíles</th>
              <th className="text-left px-2 py-2.5 text-[10px] uppercase tracking-wider text-red-400/60 font-semibold w-28 bg-red-500/[0.04]">Conflictivas</th>
              <th className="w-5"></th>
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
                  expandedRef={isExpanded ? expandedRowRef : undefined}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SceneSummaryRow({ scene, isExpanded, onToggle, expandedRef }: {
  scene: SceneDetail;
  isExpanded: boolean;
  onToggle: () => void;
  expandedRef?: React.RefObject<HTMLTableRowElement | null>;
}) {
  const [scriptValue, setScriptValue] = useState(scene.script || "");
  const { save: saveScript, saving, saved } = useSceneAutoSave(scene.id, "Script");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local state when scene data changes from server
  useEffect(() => {
    setScriptValue(scene.script || "");
  }, [scene.script]);

  // Auto-resize textarea
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [isExpanded, scriptValue]);

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setScriptValue(val);
    saveScript(val);
  };

  // Handle keyboard in textarea
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      saveScript(scriptValue);
      e.currentTarget.blur();
      if (expandedRef?.current) {
        expandedRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      const table = e.currentTarget.closest("[tabindex]");
      if (table instanceof HTMLElement) table.focus();
      return;
    }
    if ((e.key === "ArrowUp" || e.key === "ArrowDown") && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveScript(scriptValue);
      e.currentTarget.blur();
      const parent = e.currentTarget.closest("[tabindex]");
      if (parent) {
        parent.dispatchEvent(new KeyboardEvent("keydown", { key: e.key, bubbles: true }));
      }
    }
  };

  const colors = sceneClassColors(scene.clasificación_escena);
  const scriptPreview = scene.script
    ? scene.script.length > 100 ? scene.script.slice(0, 100) + "..." : scene.script
    : "—";

  return (
    <>
      {/* Summary row */}
      <tr
        ref={isExpanded ? expandedRef : undefined}
        onClick={onToggle}
        className={cn(
          "border-b border-border/50 cursor-pointer transition-colors",
          isExpanded ? "bg-primary/5" : "hover:bg-muted/30"
        )}
      >
        <td className="px-2 py-2.5">
          <span
            className={cn(
              "inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold transition-all duration-300",
              colors.numBg, colors.numText,
              isExpanded && "ring-2 ring-offset-1 ring-offset-background scale-110 shadow-lg animate-pulse-once",
              isExpanded && colors.ringColor
            )}
          >
            {scene.n_escena}
          </span>
        </td>
        <td className="px-2 py-2.5">
          <SceneTypeBadge type={scene.clasificación_escena} />
        </td>
        <td className="px-2 py-2.5">
          <p className="text-xs text-foreground/80 line-clamp-1 leading-relaxed">{scriptPreview}</p>
        </td>
        <td className="px-1 py-2.5 text-center">
          {scene.copy_revisado_ok ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-muted-foreground/30 mx-auto" />
          )}
        </td>
        {/* Informe Resumen */}
        <td className="px-2 py-2.5 border-l border-emerald-500/10 bg-emerald-500/[0.02]">
          <p className="text-[11px] text-foreground/70 line-clamp-2 leading-relaxed">
            {scene.informe_resumen_emoticonos || <span className="text-muted-foreground/30">—</span>}
          </p>
        </td>
        {/* Observaciones */}
        <td className="px-2 py-2.5 bg-emerald-500/[0.02]">
          <p className="text-[11px] text-foreground/70 line-clamp-2 leading-relaxed">
            {scene.solo_observaciones || <span className="text-muted-foreground/30">—</span>}
          </p>
        </td>
        {/* Comparativa */}
        <td className="px-2 py-2.5 bg-emerald-500/[0.02]">
          {scene.comparativa_transcript_original ? (
            <p className={cn(
              "text-[11px] line-clamp-2 leading-relaxed",
              scene.comparativa_transcript_original.toLowerCase().startsWith("ok") || scene.comparativa_transcript_original.startsWith("✅")
                ? "text-emerald-400"
                : "text-foreground/70"
            )}>
              {scene.comparativa_transcript_original}
            </p>
          ) : <span className="text-muted-foreground/30 text-[11px]">—</span>}
        </td>
        {/* Conclusión */}
        <td className="px-2 py-2.5 border-l border-amber-500/10 bg-amber-500/[0.02]">
          <p className="text-[11px] text-foreground/70 line-clamp-2 leading-relaxed">
            {scene.conclusion_general_datos_difieren_mucho || <span className="text-muted-foreground/30">—</span>}
          </p>
        </td>
        {/* Guardaraíles */}
        <td className="px-2 py-2.5 bg-blue-500/[0.02]">
          <p className="text-[11px] text-foreground/70 line-clamp-2 leading-relaxed">
            {scene.informe_guardarailes || <span className="text-muted-foreground/30">—</span>}
          </p>
        </td>
        {/* Palabras Conflictivas */}
        <td className="px-2 py-2.5 bg-red-500/[0.02]">
          <p className="text-[11px] text-foreground/70 line-clamp-2 leading-relaxed">
            {scene.palabras_conflictivas || <span className="text-muted-foreground/30">—</span>}
          </p>
        </td>
        <td className="px-1 py-2.5">
          <ChevronDown className={cn(
            "w-3 h-3 text-muted-foreground transition-transform",
            isExpanded && "rotate-180"
          )} />
        </td>
      </tr>

      {/* Expanded detail */}
      {isExpanded && (
        <tr className="bg-primary/5">
          <td colSpan={11} className="px-4 py-4">
            <div className="space-y-3">
              {/* Two-column layout: Script + Metadata */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
                {/* Left: Editable script */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Script completo</span>
                    <span className="text-[10px] text-muted-foreground/50">
                      {saving ? (
                        <span className="flex items-center gap-1 text-amber-400">
                          <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
                        </span>
                      ) : saved ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Guardado
                        </span>
                      ) : (
                        <span>Esc para salir · ↑↓ navegar</span>
                      )}
                    </span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={scriptValue}
                    onChange={handleScriptChange}
                    onKeyDown={handleTextareaKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-lg p-3 border border-transparent focus:border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none transition-colors text-xs"
                    rows={4}
                  />
                </div>

                {/* Right: Metadata */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {scene.topic && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Topic</span>
                        <div className="mt-1">
                          <TopicTags topic={scene.topic} />
                        </div>
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
                    {scene.clasificación_escena && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tipo</span>
                        <p className="mt-0.5"><SceneTypeBadge type={scene.clasificación_escena} /></p>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Copy OK</span>
                      <p className="text-sm mt-0.5">{scene.copy_revisado_ok ? "✅ Sí" : "❌ No"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full informe */}
              {scene.informe_resumen_emoticonos && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Informe Resumen</span>
                  <p className="text-xs whitespace-pre-wrap leading-relaxed mt-1 bg-muted/30 rounded-lg p-3">
                    {scene.informe_resumen_emoticonos}
                  </p>
                </div>
              )}

              {/* Full observaciones */}
              {scene.solo_observaciones && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                    Observaciones
                    <span title="Lo ha creado el Agente Informe, revisando el copy y consultando decenas de fuentes externas para confirmar los datos.">
                      <Info className="w-3 h-3 text-emerald-400/50 cursor-help" />
                    </span>
                  </p>
                  <p className="text-xs whitespace-pre-wrap leading-relaxed mt-1 bg-amber-500/10 rounded-lg p-3 text-amber-200">
                    {scene.solo_observaciones}
                  </p>
                </div>
              )}

              {/* ── Feedback grid — Copy con Observaciones, Comparativa, Conclusión, Guardaraíles, Conflictivas ── */}
              {(scene.montaje_copy_con_observaciones || scene.comparativa_transcript_original || scene.conclusion_general_datos_difieren_mucho || scene.informe_guardarailes || scene.palabras_conflictivas) && (
                <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-400/70 font-semibold mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Informe Detallado
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {scene.montaje_copy_con_observaciones && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1 flex items-center gap-1">
                          Copy con Observaciones
                          <span title="El texto combinado con el informe, para saber exactamente donde está.">
                            <Info className="w-3 h-3 text-emerald-400/50 cursor-help" />
                          </span>
                        </p>
                        <div className="text-[11px] text-foreground/70 whitespace-pre-wrap leading-relaxed bg-background/40 rounded-lg p-2.5 border border-emerald-500/15 max-h-[120px] overflow-y-auto">
                          {scene.montaje_copy_con_observaciones}
                        </div>
                      </div>
                    )}

                    {scene.comparativa_transcript_original && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1 flex items-center gap-1">
                          Comparativa Transcript
                          <span title="Cuanto difiere de la fuente original. OK green es que no hay grandes diferencias.">
                            <Info className="w-3 h-3 text-emerald-400/50 cursor-help" />
                          </span>
                        </p>
                        <div className={cn(
                          "text-[11px] whitespace-pre-wrap leading-relaxed rounded-lg p-2.5 border max-h-[120px] overflow-y-auto",
                          scene.comparativa_transcript_original.toLowerCase().startsWith("ok") || scene.comparativa_transcript_original.startsWith("✅")
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-background/40 border-emerald-500/15 text-foreground/70"
                        )}>
                          {scene.comparativa_transcript_original}
                        </div>
                      </div>
                    )}

                    {scene.conclusion_general_datos_difieren_mucho && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400/60" /> Conclusión General
                        </p>
                        <div className="text-[11px] text-foreground/70 whitespace-pre-wrap leading-relaxed bg-background/40 rounded-lg p-2.5 border border-amber-500/15 max-h-[120px] overflow-y-auto">
                          {scene.conclusion_general_datos_difieren_mucho}
                        </div>
                      </div>
                    )}

                    {scene.informe_guardarailes && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-blue-400/60" /> Guardaraíles
                        </p>
                        <div className="text-[11px] text-foreground/70 whitespace-pre-wrap leading-relaxed bg-background/40 rounded-lg p-2.5 border border-blue-500/15 max-h-[120px] overflow-y-auto">
                          {scene.informe_guardarailes}
                        </div>
                      </div>
                    )}

                    {scene.palabras_conflictivas && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-400/60" /> Palabras Conflictivas
                        </p>
                        <div className="text-[11px] text-foreground/70 whitespace-pre-wrap leading-relaxed bg-background/40 rounded-lg p-2.5 border border-red-500/15 max-h-[120px] overflow-y-auto">
                          {scene.palabras_conflictivas}
                        </div>
                      </div>
                    )}
                  </div>
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

// ─── Audio Scene Summary Table (below Crear Audio button) ──

// Extract first emoji from a text string
function extractEmoji(text: string | null): string {
  if (!text) return "—";
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
  const match = text.match(emojiRegex);
  return match ? match[0] : "—";
}

// Parse "RESUMEN\n✅\n\nANÁLISIS DETALLADO\ntext..." → "✅ text..."
function parseVozCompact(text: string | null): string | null {
  if (!text) return null;
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
  const emojiMatch = text.match(emojiRegex);
  const emoji = emojiMatch ? emojiMatch[0] : "";
  // Extract text after "ANÁLISIS DETALLADO" header (if present)
  const detailMatch = text.match(/AN[ÁA]LISIS\s+DETALLADO\s*\n+([\s\S]+)/i);
  const detailText = detailMatch ? detailMatch[1].trim() : "";
  if (detailText) return `${emoji} ${detailText}`;
  // Fallback: remove headers and emoji-only lines, return remaining text
  const cleaned = text
    .replace(/^RESUMEN\s*$/gim, "")
    .replace(/^AN[ÁA]LISIS\s+DETALLADO\s*$/gim, "")
    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*$/gmu, "")
    .trim();
  return cleaned ? `${emoji} ${cleaned}` : emoji || null;
}

// Tag color map for ElevenLabs emotion tags
const TAG_COLORS: Record<string, string> = {
  surprised: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  excited: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  thoughtful: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  serious: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  sad: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  happy: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  angry: "bg-red-500/20 text-red-300 border-red-500/30",
  whisper: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  calm: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  neutral: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};
const DEFAULT_TAG_COLOR = "bg-violet-500/20 text-violet-300 border-violet-500/30";

function RenderTaggedText({ text }: { text: string }) {
  // Split text by [tag] patterns, render tags as colored badges
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <p className="text-[11px] leading-relaxed">
      {parts.map((part, i) => {
        const tagMatch = part.match(/^\[(.+)\]$/);
        if (tagMatch) {
          const tag = tagMatch[1].toLowerCase();
          const colorClass = TAG_COLORS[tag] || DEFAULT_TAG_COLOR;
          return (
            <span key={i} className={cn("inline-block px-1.5 py-0.5 rounded-full text-[9px] font-semibold border mx-0.5 align-middle", colorClass)}>
              {tagMatch[1]}
            </span>
          );
        }
        return <span key={i} className="text-foreground/70">{part}</span>;
      })}
    </p>
  );
}

function AudioSceneSummaryTable({ scenes }: { scenes: SceneDetail[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Keyboard navigation: up/down arrows to move between scenes, space to play/pause
  const handleKeyNav = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return;

      // Spacebar: toggle play/pause on the expanded scene's audio
      if (e.key === " ") {
        e.preventDefault();
        const audio = (e.currentTarget as HTMLElement).querySelector("audio");
        if (audio) {
          if (audio.paused) audio.play();
          else audio.pause();
        }
        return;
      }

      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;

      e.preventDefault();
      // Pause any playing audio before navigating
      const audio = (e.currentTarget as HTMLElement).querySelector("audio");
      if (audio && !audio.paused) audio.pause();

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

  // Scroll expanded scene — summary row pinned to top of visible area
  const expandedRowRef = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    if (expandedId && expandedRowRef.current) {
      expandedRowRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [expandedId]);

  // Totals for header
  const totalDuration = scenes.reduce((sum, s) => sum + (s.voice_length || 0), 0);
  const revisadoCount = scenes.filter((s) => s.audio_revisado_ok).length;
  const withAudio = scenes.filter((s) => s.voice_s3).length;

  return (
    <div
      className="glass-card rounded-xl overflow-hidden"
      onKeyDown={handleKeyNav}
      tabIndex={0}
    >
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Headphones className="w-4 h-4 text-emerald-400" />
          Audio por Escena
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-medium text-muted-foreground">
            {scenes.length}
          </span>
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground/80">
            {withAudio}/{scenes.length} audio · {revisadoCount} revisado · {formatSeconds(totalDuration)}
          </span>
          <span className="text-[10px] text-muted-foreground/40">↑↓ navegar · ␣ play/pause</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-2 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-8">#</th>
              <th className="text-left px-2 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-16">Tipo</th>
              <th className="text-center px-1 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-8">
                <Volume2 className="w-3 h-3 mx-auto" />
              </th>
              <th className="text-left px-1 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-20">Status</th>
              <th className="text-left px-2 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold min-w-[120px]">Script</th>
              <th className="text-right px-1 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-12">Dur.</th>
              <th className="text-center px-1 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-8">OK</th>
              <th className="text-center px-1 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-8" title="Analisis Voz 1">V1</th>
              <th className="text-center px-1 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-8" title="Analisis Voz 2">V2</th>
              <th className="text-center px-1 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-8" title="Analisis Voz 3">V3</th>
              <th className="w-4"></th>
            </tr>
          </thead>
          <tbody>
            {scenes.map((scene) => {
              const isExpanded = expandedId === scene.id;
              return (
                <AudioSceneSummaryRow
                  key={scene.id}
                  scene={scene}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedId(isExpanded ? null : scene.id)}
                  expandedRef={isExpanded ? expandedRowRef : undefined}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AudioSceneSummaryRow({ scene, isExpanded, onToggle, expandedRef }: {
  scene: SceneDetail;
  isExpanded: boolean;
  onToggle: () => void;
  expandedRef?: React.RefObject<HTMLTableRowElement | null>;
}) {
  const [scriptValue, setScriptValue] = useState(scene.script || "");
  const { save: saveScript, saving: savingScript, saved: savedScript } = useSceneAutoSave(scene.id, "Script");
  const [feedbackValue, setFeedbackValue] = useState(scene.feedback_audio || "");
  const { save: saveFeedback, saving: savingFeedback, saved: savedFeedback } = useSceneAutoSave(scene.id, "Feedback Audio Elevenlabs");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const feedbackRef = useRef<HTMLTextAreaElement>(null);
  const [audioRevisado, setAudioRevisado] = useState(scene.audio_revisado_ok);
  const { save: saveRevisado } = useSceneAutoSave(scene.id, "Audio Revisado OK");
  const [showExtra, setShowExtra] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);

  // Sync local state when scene data changes from server
  useEffect(() => {
    setScriptValue(scene.script || "");
  }, [scene.script]);
  useEffect(() => {
    setFeedbackValue(scene.feedback_audio || "");
  }, [scene.feedback_audio]);
  useEffect(() => {
    setAudioRevisado(scene.audio_revisado_ok);
  }, [scene.audio_revisado_ok]);

  // Auto-resize textareas
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [isExpanded, scriptValue]);
  useEffect(() => {
    if (isExpanded && feedbackRef.current) {
      feedbackRef.current.style.height = "auto";
      feedbackRef.current.style.height = feedbackRef.current.scrollHeight + "px";
    }
  }, [isExpanded, feedbackValue]);

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setScriptValue(val);
    saveScript(val);
  };

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setFeedbackValue(val);
    saveFeedback(val);
  };

  const toggleRevisado = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !audioRevisado;
    setAudioRevisado(next);
    saveRevisado(next);
  };

  // Handle keyboard in textarea
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      saveScript(scriptValue);
      e.currentTarget.blur();
      if (expandedRef?.current) {
        expandedRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      const table = e.currentTarget.closest("[tabindex]");
      if (table instanceof HTMLElement) table.focus();
      return;
    }
    if ((e.key === "ArrowUp" || e.key === "ArrowDown") && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveScript(scriptValue);
      e.currentTarget.blur();
      const parent = e.currentTarget.closest("[tabindex]");
      if (parent) {
        parent.dispatchEvent(new KeyboardEvent("keydown", { key: e.key, bubbles: true }));
      }
    }
  };

  const colors = sceneClassColors(scene.clasificación_escena);
  const scriptText = scene.script || scene.script_elevenlabs;
  const scriptPreview = scriptText
    ? scriptText.length > 100 ? scriptText.slice(0, 100) + "..." : scriptText
    : "—";

  const vozTexts = generatingAudio ? [null, null, null] : [scene.analisis_voz_1, scene.analisis_voz_2, scene.analisis_voz_3];
  const hasAnyVoz = !generatingAudio && [scene.analisis_voz_1, scene.analisis_voz_2, scene.analisis_voz_3].some(Boolean);

  return (
    <>
      {/* Summary row */}
      <tr
        ref={isExpanded ? expandedRef : undefined}
        onClick={onToggle}
        className={cn(
          "border-b border-border/50 cursor-pointer transition-colors",
          isExpanded ? "bg-emerald-500/5" : "hover:bg-muted/30"
        )}
      >
        <td className="px-2 py-2.5">
          <span
            className={cn(
              "inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold transition-all duration-300",
              colors.numBg, colors.numText,
              isExpanded && "ring-2 ring-offset-1 ring-offset-background scale-110 shadow-lg animate-pulse-once",
              isExpanded && colors.ringColor
            )}
          >
            {scene.n_escena}
          </span>
        </td>
        <td className="px-2 py-2.5">
          <SceneTypeBadge type={scene.clasificación_escena} />
        </td>
        <td className="px-1 py-2.5 text-center">
          {generatingAudio ? (
            <Loader2 className="w-3.5 h-3.5 text-blue-400 mx-auto animate-spin" />
          ) : scene.voice_s3 ? (
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
          ) : (
            <span className="text-muted-foreground/30 text-xs">—</span>
          )}
        </td>
        <td className="px-1 py-2.5">
          <AudioStatusTag status={scene.status_audio} />
        </td>
        <td className="px-2 py-2.5">
          <p className="text-xs text-foreground/80 line-clamp-1 leading-relaxed">{scriptPreview}</p>
        </td>
        <td className="px-1 py-2.5 text-right text-xs text-muted-foreground">
          {generatingAudio ? <span className="text-blue-400/50">…</span> : scene.voice_length != null ? `${scene.voice_length.toFixed(1)}s` : "—"}
        </td>
        <td className="px-1 py-2.5 text-center">
          {audioRevisado ? (
            <span className="text-emerald-400 text-xs font-bold">✓</span>
          ) : (
            <span className="text-muted-foreground/30 text-xs">✗</span>
          )}
        </td>
        <td className="px-1 py-2.5 text-center text-sm" title={generatingAudio ? undefined : scene.analisis_voz_1 || undefined}>
          {generatingAudio ? <span className="text-blue-400/50 text-xs">…</span> : extractEmoji(scene.analisis_voz_1)}
        </td>
        <td className="px-1 py-2.5 text-center text-sm" title={generatingAudio ? undefined : scene.analisis_voz_2 || undefined}>
          {generatingAudio ? <span className="text-blue-400/50 text-xs">…</span> : extractEmoji(scene.analisis_voz_2)}
        </td>
        <td className="px-1 py-2.5 text-center text-sm" title={generatingAudio ? undefined : scene.analisis_voz_3 || undefined}>
          {generatingAudio ? <span className="text-blue-400/50 text-xs">…</span> : extractEmoji(scene.analisis_voz_3)}
        </td>
        <td className="px-0.5 py-2.5">
          <ChevronDown className={cn(
            "w-3 h-3 text-muted-foreground transition-transform",
            isExpanded && "rotate-180"
          )} />
        </td>
      </tr>

      {/* Expanded detail — compact, full-width */}
      {isExpanded && (
        <tr className="bg-emerald-500/5">
          <td colSpan={11} className="px-3 py-2">
            <div className="space-y-1.5">

              {/* ── Top bar: Audio player + timing + revisado ── */}
              <div className="flex items-center gap-2">
                {generatingAudio ? (
                  <div className="flex-1 flex items-center gap-2 text-blue-400 text-[11px] bg-blue-500/10 rounded px-3 py-1.5 border border-blue-500/20 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando nuevo audio…
                  </div>
                ) : scene.voice_s3 ? (
                  <WaveformAudioPlayer url={scene.voice_s3} color="emerald" height={32} compact className="flex-1 border-emerald-500/20" />
                ) : (
                  <div className="flex-1 flex items-center gap-1.5 text-muted-foreground/40 text-[10px]">
                    <Volume2 className="w-3.5 h-3.5" /> Sin audio
                  </div>
                )}
                {!generatingAudio && (
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                    {scene.voice_length != null ? `${scene.voice_length.toFixed(1)}s` : "—"}
                    {scene.start != null && <> · {formatMmSs(scene.start)}</>}
                    {scene.end != null && <>–{formatMmSs(scene.end)}</>}
                  </span>
                )}
                <button
                  onClick={toggleRevisado}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all border shadow-sm cursor-pointer shrink-0",
                    audioRevisado
                      ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20"
                      : "bg-muted/60 hover:bg-red-500/20 border-border hover:border-red-500/50 text-muted-foreground hover:text-red-400"
                  )}
                >
                  {audioRevisado ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {audioRevisado ? "OK" : "No"}
                </button>
                <SceneActionButton sceneId={scene.id} currentVoiceS3={scene.voice_s3} onGenerating={() => setGeneratingAudio(true)} onAudioReady={() => setGeneratingAudio(false)} />
              </div>

              {/* ── Script (editable) + V1/V2/V3 análisis ── */}
              <div className="flex gap-1.5">
                {/* Script (editable) */}
                <div className="flex-1 min-w-0 relative">
                  <textarea
                    ref={textareaRef}
                    value={scriptValue}
                    onChange={handleScriptChange}
                    onKeyDown={handleTextareaKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-muted/25 rounded px-2 py-1.5 border border-transparent focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 resize-none text-[11px] leading-snug"
                    rows={3}
                    placeholder="Script..."
                  />
                  {savingScript && <Loader2 className="w-3 h-3 animate-spin text-amber-400 absolute top-1.5 right-1.5" />}
                  {savedScript && !savingScript && <CheckCircle2 className="w-3 h-3 text-emerald-400 absolute top-1.5 right-1.5" />}
                </div>

                {/* V1/V2/V3 análisis inline */}
                {hasAnyVoz && vozTexts.map((raw, i) => {
                  const parsed = parseVozCompact(raw);
                  if (!parsed) return null;
                  return (
                    <div key={i} className="flex-1 bg-muted/25 rounded px-2 py-1.5 min-w-0">
                      <p className="text-[11px] whitespace-pre-wrap leading-snug text-foreground/80">{parsed}</p>
                    </div>
                  );
                })}
              </div>

              {/* ── Tags entonación + Feedback (colapsable) ── */}
              {(scene.elevenlabs_text_v3_enhanced || scene.feedback_audio) && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowExtra(!showExtra); }}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border cursor-pointer",
                      showExtra
                        ? "bg-violet-500/20 border-violet-400/40 text-violet-300 shadow-sm shadow-violet-500/10"
                        : "bg-violet-500/10 border-violet-500/25 text-violet-400/80 hover:bg-violet-500/20 hover:text-violet-300 hover:border-violet-400/40"
                    )}
                  >
                    <ChevronDown className={cn("w-3 h-3 transition-transform", showExtra && "rotate-180")} />
                    Tags entonación · Feedback
                  </button>
                  {showExtra && (
                    <div className="flex gap-1.5">
                      {scene.elevenlabs_text_v3_enhanced && (
                        <div className="flex-1 min-w-0 bg-violet-500/10 rounded px-2 py-1.5">
                          <RenderTaggedText text={scene.elevenlabs_text_v3_enhanced} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 relative">
                        <textarea
                          ref={feedbackRef}
                          value={feedbackValue}
                          onChange={handleFeedbackChange}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); saveFeedback(feedbackValue); e.currentTarget.blur(); } }}
                          className="w-full bg-muted/25 rounded px-2 py-1.5 border border-transparent focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-none text-[11px] leading-snug"
                          rows={2}
                          placeholder="Feedback audio..."
                        />
                        {savingFeedback && <Loader2 className="w-3 h-3 animate-spin text-amber-400 absolute top-1.5 right-1.5" />}
                        {savedFeedback && !savingFeedback && <CheckCircle2 className="w-3 h-3 text-emerald-400 absolute top-1.5 right-1.5" />}
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Ideas Section (Videos X + Noticias) ─────────────────

const IDEAS_TABS = [
  { key: "noticias", label: "Noticias", icon: Newspaper, filter: "URL" },
  { key: "videos_x", label: "Videos X", icon: Twitter, filter: "Post X" },
] as const;

type IdeaTabKey = (typeof IDEAS_TABS)[number]["key"];

export function IdeasSection({ ideas }: { ideas: LinkedIdeaFull[] }) {
  const [activeTab, setActiveTab] = useState<IdeaTabKey>("noticias");

  const currentFilter = IDEAS_TABS.find(t => t.key === activeTab)?.filter;
  const filtered = ideas.filter(i => i.tipo_idea === currentFilter);
  const done = filtered.filter(i => i.status_start_calculado === "Done");
  const notDone = filtered.filter(i => i.status_start_calculado !== "Done");

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header with tabs */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Ideas Inspiración
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-medium text-muted-foreground">
            {ideas.length}
          </span>
        </h3>
        <div className="flex gap-1">
          {IDEAS_TABS.map((tab) => {
            const Icon = tab.icon;
            const count = ideas.filter(i => i.tipo_idea === tab.filter).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  activeTab === tab.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {count > 0 && (
                  <span className="text-[10px] bg-muted px-1 py-0.5 rounded-full">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Done section */}
      {done.length > 0 && (
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
              Para Publicar ({done.length})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {done.map(idea => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        </div>
      )}

      {/* Not Done section */}
      {notDone.length > 0 && (
        <div className={cn("p-5", done.length > 0 && "border-t border-border/50")}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">
              Pendiente de Revisión ({notDone.length})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {notDone.map(idea => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay ideas de tipo {currentFilter} para este video</p>
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea }: { idea: LinkedIdeaFull }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-hidden hover:ring-1 hover:ring-primary/20 transition-all">
      {/* Thumbnail */}
      {idea.thumb_url ? (
        <div className="aspect-video bg-muted overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={idea.thumb_url}
            alt={idea.idea_title || ""}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
        </div>
      )}

      {/* Content */}
      <div className="p-3 space-y-2">
        <p className="text-sm font-semibold leading-tight line-clamp-2">
          {idea.idea_title || "Sin título"}
        </p>

        {idea.domain && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Domain</span>
            <span className="text-xs text-foreground/80">{idea.domain}</span>
          </div>
        )}

        {idea.fuentes_inspiracion_ids.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Fuentes</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium">
              Web Research IA
            </span>
          </div>
        )}

        {idea.publica_video && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Publica Video</span>
            <span className="text-xs text-foreground/80">{idea.publica_video}</span>
          </div>
        )}

        {idea.summary && (
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Summary</span>
            <p className="text-xs text-foreground/70 line-clamp-3 leading-relaxed mt-0.5">
              {idea.summary}
            </p>
          </div>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {idea.contenido_coincide_copy && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Coincide Copy
              </span>
            )}
          </div>
          {idea.n_escena && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
              Escena {idea.n_escena}
            </span>
          )}
        </div>

        {/* Link */}
        {idea.url_fuente && (
          <a
            href={idea.url_fuente}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1"
          >
            <ExternalLink className="w-3 h-3" />
            Ver fuente
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Escenas ────────────────────────────────────────

export function TabEscenas({ video }: { video: VideoWithScenes }) {
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
                  <div className="mt-0.5">
                    <TopicTags topic={scene.topic} />
                  </div>
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

// Color map for scene classification
function sceneClassColors(type: string | null): { bg: string; text: string; border: string; numBg: string; numText: string; ringColor: string } {
  const t = (type || "").toLowerCase();
  if (t.includes("hook")) return { bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/30", numBg: "bg-cyan-500/20", numText: "text-cyan-400", ringColor: "ring-cyan-400/60" };
  if (t.includes("intro")) return { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", numBg: "bg-emerald-500/20", numText: "text-emerald-400", ringColor: "ring-emerald-400/60" };
  if (t.includes("desarrollo")) return { bg: "bg-slate-500/15", text: "text-slate-400", border: "border-slate-500/30", numBg: "bg-slate-500/20", numText: "text-slate-400", ringColor: "ring-slate-400/60" };
  if (t.includes("cta")) return { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30", numBg: "bg-orange-500/20", numText: "text-orange-400", ringColor: "ring-orange-400/60" };
  return { bg: "bg-muted/50", text: "text-muted-foreground", border: "border-border/50", numBg: "bg-muted", numText: "text-muted-foreground", ringColor: "ring-muted-foreground/60" };
}

function SceneTypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const colors = sceneClassColors(type);
  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", colors.bg, colors.text)}>
      {type}
    </span>
  );
}

// Airtable Status Audio colors: Idle=blueLight2, Generating Audio=yellowBright, Audio Generated=greenBright, Audio Failed=redBright
function AudioStatusTag({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground/30 text-xs">—</span>;
  const s = status.toLowerCase();
  let bg: string, text: string;
  if (s.includes("generated") || s.includes("ok")) {
    bg = "bg-emerald-500/15"; text = "text-emerald-400";
  } else if (s.includes("generating") || s.includes("progress")) {
    bg = "bg-yellow-500/15"; text = "text-yellow-400";
  } else if (s.includes("fail") || s.includes("error")) {
    bg = "bg-red-500/15"; text = "text-red-400";
  } else {
    bg = "bg-blue-500/15"; text = "text-blue-400"; // Idle
  }
  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap", bg, text)}>
      {status}
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

// Topic tag colors — deterministic by hash for consistent colors per topic
const TOPIC_PALETTES = [
  { bg: "bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/30" },
  { bg: "bg-pink-500/15", text: "text-pink-400", border: "border-pink-500/30" },
  { bg: "bg-sky-500/15", text: "text-sky-400", border: "border-sky-500/30" },
  { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  { bg: "bg-teal-500/15", text: "text-teal-400", border: "border-teal-500/30" },
  { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30" },
  { bg: "bg-indigo-500/15", text: "text-indigo-400", border: "border-indigo-500/30" },
  { bg: "bg-lime-500/15", text: "text-lime-400", border: "border-lime-500/30" },
];

function topicColor(topic: string) {
  let hash = 0;
  for (let i = 0; i < topic.length; i++) hash = ((hash << 5) - hash + topic.charCodeAt(i)) | 0;
  return TOPIC_PALETTES[Math.abs(hash) % TOPIC_PALETTES.length];
}

function TopicTags({ topic }: { topic: string }) {
  // Split by comma, semicolon, or pipe
  const topics = topic.split(/[,;|]/).map((t) => t.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1">
      {topics.map((t) => {
        const c = topicColor(t.toLowerCase());
        return (
          <span
            key={t}
            className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium border", c.bg, c.text, c.border)}
          >
            {t}
          </span>
        );
      })}
    </div>
  );
}

function formatSeconds(sec: number): string {
  const min = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return min > 0 ? `${min}m ${s}s` : `${s}s`;
}

function formatMmSs(sec: number): string {
  const min = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${min}:${s.toString().padStart(2, "0")}`;
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center">
      <Info className="w-3 h-3 text-muted-foreground/50 cursor-help" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 w-56 px-2.5 py-1.5 text-[10px] leading-tight text-foreground bg-popover border border-border rounded-md shadow-lg">
        {text}
      </span>
    </span>
  );
}

function SceneActionButton({ sceneId, currentVoiceS3, onGenerating, onAudioReady }: { sceneId: string; currentVoiceS3: string | null; onGenerating?: () => void; onAudioReady?: () => void }) {
  const queryClient = useQueryClient();
  type BtnState = "idle" | "confirming" | "sending" | "generating" | "ready" | "error";
  const [state, setState] = useState<BtnState>("idle");
  // Use a ref mirror to avoid stale closures in callbacks
  const stateRef = useRef<BtnState>(state);
  stateRef.current = state;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // Auto-dismiss confirming after 5s
  useEffect(() => {
    if (state === "confirming") {
      timerRef.current = setTimeout(() => setState("idle"), 5000);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
  }, [state]);

  // Auto-dismiss ready/error after 5s
  useEffect(() => {
    if (state === "ready" || state === "error") {
      const t = setTimeout(() => setState("idle"), 5000);
      return () => clearTimeout(t);
    }
  }, [state]);

  // Elapsed timer during generating
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

  // Track phases: audio arrival + analysis updates
  const [audioArrived, setAudioArrived] = useState(false);
  const lastAnalysisRef = useRef<(string | null)[]>([null, null, null]);

  // Poll for audio + analysis changes while in "generating" state
  useEffect(() => {
    if (state !== "generating") {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      if (state === "idle") { setAudioArrived(false); lastAnalysisRef.current = [null, null, null]; }
      return;
    }
    const baseVoice = currentVoiceS3;
    let audioFound = false;
    const checkScene = async () => {
      try {
        const res = await fetch(`/api/data/scenes?ids=${sceneId}`);
        if (!res.ok) return;
        const scenes = await res.json();
        const scene = scenes?.[0];
        if (!scene) return;

        const newVoice = scene.voice_s3;
        const audioStatus = scene.status_audio;

        // Phase 1: Detect new audio
        if (!audioFound) {
          if (
            (newVoice && newVoice !== baseVoice) ||
            (audioStatus && audioStatus.toLowerCase().includes("generated") && newVoice)
          ) {
            audioFound = true;
            setAudioArrived(true);
            lastAnalysisRef.current = [scene.analisis_voz_1, scene.analisis_voz_2, scene.analisis_voz_3];
            queryClient.invalidateQueries({ queryKey: ["video-detail"] });
            onAudioReady?.();
          }
          return;
        }

        // Phase 2: Audio arrived, keep polling for analysis field changes
        const currentAnalysis = [scene.analisis_voz_1, scene.analisis_voz_2, scene.analisis_voz_3];
        const analysisChanged = currentAnalysis.some((v, i) => v !== lastAnalysisRef.current[i]);
        if (analysisChanged) {
          lastAnalysisRef.current = currentAnalysis;
          queryClient.invalidateQueries({ queryKey: ["video-detail"] });
        }
        // Done: all 3 analysis fields contain real analysis (emoji like ✅/❌, not just "Analizando...")
        const hasRealAnalysis = (v: string | null) =>
          !!v && /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(v) && v.length > 20;
        if (currentAnalysis.every(hasRealAnalysis)) {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          setState("ready");
        }
      } catch { /* ignore polling errors */ }
    };
    pollRef.current = setInterval(checkScene, 8000);
    // Max 10 minutes total (audio comes fast, analysis can take 5+ min)
    const maxTimeout = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current);
      setState((s) => s === "generating" ? (audioFound ? "ready" : "idle") : s);
    }, 600000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearTimeout(maxTimeout);
    };
  }, [state, sceneId, currentVoiceS3, queryClient]);

  // Use ref-based state reading to avoid stale closure issues
  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const cur = stateRef.current;

    // Allow clicking in error/ready to reset
    if (cur === "error" || cur === "ready") {
      setState("idle");
      return;
    }

    if (cur === "idle") {
      setState("confirming");
      return;
    }

    if (cur === "confirming") {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState("sending");
      try {
        console.log("[SceneActionButton] Calling webhook for scene:", sceneId);
        const res = await fetch("/api/webhooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ModificaAudioEscena", recordId: sceneId }),
        });
        if (res.ok) {
          console.log("[SceneActionButton] Webhook OK, entering generating state");
          setState("generating");
          onGenerating?.();
        } else {
          const errText = await res.text().catch(() => "unknown");
          console.error("[SceneActionButton] Webhook failed:", res.status, errText);
          setState("error");
        }
      } catch (err) {
        console.error("[SceneActionButton] Webhook exception:", err);
        setState("error");
      }
    }
  }, [sceneId]); // Note: state NOT in deps — read from stateRef instead

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
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all border shadow-sm whitespace-nowrap shrink-0",
        state === "idle" && "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white cursor-pointer",
        state === "confirming" && "bg-amber-500 hover:bg-amber-400 border-amber-400 text-black cursor-pointer animate-pulse",
        state === "sending" && "bg-blue-600/50 border-blue-500/50 text-white/70 cursor-wait",
        state === "generating" && !audioArrived && "bg-blue-600/30 border-blue-400/50 text-blue-300 cursor-wait animate-pulse",
        state === "generating" && audioArrived && "bg-emerald-600/30 border-emerald-400/50 text-emerald-300 cursor-wait animate-pulse",
        state === "ready" && "bg-emerald-600 border-emerald-500 text-white cursor-pointer",
        state === "error" && "bg-red-600 border-red-500 text-white cursor-pointer",
      )}
    >
      {state === "sending" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {state === "generating" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {state === "ready" && <CheckCircle2 className="w-3.5 h-3.5" />}
      {(state === "idle" || state === "confirming" || state === "error") && <Headphones className="w-3.5 h-3.5" />}
      {state === "idle" && "Modifica / Crea Audio Escena"}
      {state === "confirming" && "Confirmar?"}
      {state === "sending" && "Enviando..."}
      {state === "generating" && !audioArrived && <>Generando audio… {formatElapsed(elapsed)}</>}
      {state === "generating" && audioArrived && <>Audio listo, analizando… {formatElapsed(elapsed)}</>}
      {state === "ready" && "Completo!"}
      {state === "error" && "Error — click para reintentar"}
    </button>
  );
}
