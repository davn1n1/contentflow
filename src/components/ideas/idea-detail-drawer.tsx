"use client";

import { cn } from "@/lib/utils";
import type { Idea } from "@/types/database";
import {
  X,
  ExternalLink,
  Star,
  Clock,
  Eye,
  MessageSquare,
  Users,
  Image as ImageIcon,
  Calendar,
  Tag,
  FileText,
  ListTree,
  Loader2,
  FileAudio,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CreateVideoButton } from "@/components/shared/create-video-button";

interface IdeaDetailDrawerProps {
  idea: Idea | null;
  onClose: () => void;
}

const TIPO_IDEA_CONFIG: Record<string, { color: string; bg: string }> = {
  "Video Youtube": { color: "text-red-400", bg: "bg-red-500/20" },
  URL: { color: "text-blue-400", bg: "bg-blue-500/20" },
  "Reel Instagram": { color: "text-pink-400", bg: "bg-pink-500/20" },
  "Ad Meta": { color: "text-indigo-400", bg: "bg-indigo-500/20" },
  "Post X": { color: "text-sky-400", bg: "bg-sky-500/20" },
  Manual: { color: "text-amber-400", bg: "bg-amber-500/20" },
};

const TRANSCRIPT_CONFIG: Record<string, { color: string; bg: string }> = {
  "Transcript OK": { color: "text-emerald-400", bg: "bg-emerald-500/20" },
  "Error Transcript": { color: "text-red-400", bg: "bg-red-500/20" },
};

export function IdeaDetailDrawer({ idea, onClose }: IdeaDetailDrawerProps) {
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptResult, setTranscriptResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Reset state when idea changes
  useEffect(() => {
    setTranscriptLoading(false);
    setTranscriptResult(null);
  }, [idea?.id]);

  async function handleCrearTranscript() {
    if (!idea) return;
    setTranscriptLoading(true);
    setTranscriptResult(null);

    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transcriptYSummary",
          recordId: idea.id,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Webhook failed");
      }

      setTranscriptResult({
        type: "success",
        message: "Transcript + Summary iniciado en n8n",
      });
    } catch (err) {
      setTranscriptResult({
        type: "error",
        message: err instanceof Error ? err.message : "Error desconocido",
      });
    } finally {
      setTranscriptLoading(false);
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (idea) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [idea]);

  if (!idea) return null;

  const tipoConfig = TIPO_IDEA_CONFIG[idea.tipo_idea || ""] || {
    color: "text-muted-foreground",
    bg: "bg-muted",
  };
  const transcriptConfig = idea.status_transcript
    ? TRANSCRIPT_CONFIG[idea.status_transcript]
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background border-l border-border z-50 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground leading-tight">
              {idea.idea_title || "Untitled Idea"}
            </h2>
            {idea.yt_channel_name && (
              <p className="text-sm text-muted-foreground mt-1">
                {idea.yt_channel_name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCrearTranscript}
              disabled={transcriptLoading}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                transcriptLoading
                  ? "bg-primary/50 text-primary-foreground cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
            >
              {transcriptLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileAudio className="w-3.5 h-3.5" />
              )}
              Crear Transcript
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Thumbnail */}
          {idea.thumb_url ? (
            <div className="rounded-xl overflow-hidden border border-border">
              <img
                src={idea.thumb_url}
                alt={idea.idea_title || ""}
                className="w-full aspect-video object-cover"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-muted/30 aspect-video flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Create Video Button */}
          <CreateVideoButton
            ideaId={idea.id}
            ideaTitle={idea.idea_title}
            variant="full"
          />

          {/* Transcript feedback */}
          {transcriptResult && (
            <div
              className={cn(
                "rounded-lg px-4 py-3 text-sm font-medium",
                transcriptResult.type === "success"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              )}
            >
              {transcriptResult.message}
            </div>
          )}

          {/* Info Principal */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Informaci&oacute;n Principal
            </h3>

            <div className="grid grid-cols-[140px_1fr] gap-y-3 gap-x-4 text-sm">
              {/* Tipo Idea */}
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Tipo Idea
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium w-fit",
                  tipoConfig.bg,
                  tipoConfig.color
                )}
              >
                {idea.tipo_idea || "-"}
              </span>

              {/* short/long */}
              <span className="text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                short/long
              </span>
              <span>
                {idea.short_long ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400">
                    {idea.short_long}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </span>

              {/* Status */}
              <span className="text-muted-foreground flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                Status
              </span>
              <span>
                {idea.status ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400">
                    {idea.status}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </span>

              {/* Priority Level */}
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                Priority Level
              </span>
              <span className="text-foreground">
                {idea.priority_level || (
                  <span className="text-muted-foreground">-</span>
                )}
              </span>

              {/* Favorita */}
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                Favorita
              </span>
              <span>
                {idea.favorita ? (
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ) : (
                  <span className="text-muted-foreground">No</span>
                )}
              </span>

              {/* Created */}
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Created
              </span>
              <span className="text-foreground">
                {new Date(idea.created).toLocaleString("es-ES", {
                  day: "numeric",
                  month: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>

              {/* Transcript Status */}
              {idea.status_transcript && (
                <>
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    StatusTranscript
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium w-fit",
                      transcriptConfig?.bg || "bg-muted",
                      transcriptConfig?.color || "text-muted-foreground"
                    )}
                  >
                    {idea.status_transcript}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* URL Fuente */}
          {idea.url_fuente && (
            <div className="glass-card rounded-xl p-5 space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4" />
                URL Fuente
              </h3>
              <a
                href={idea.url_fuente}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:text-primary/80 transition-colors break-all"
              >
                {idea.url_fuente}
              </a>
            </div>
          )}

          {/* YouTube Stats */}
          {idea.tipo_idea === "Video Youtube" && (
            <div className="glass-card rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                YouTube Info
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {idea.yt_duration && (
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium text-foreground">
                      {idea.yt_duration}
                    </p>
                  </div>
                )}
                {idea.yt_views_count !== null && (
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Eye className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Views</p>
                    <p className="text-sm font-medium text-foreground">
                      {idea.yt_views_count_k || idea.yt_views_count?.toLocaleString()}
                    </p>
                  </div>
                )}
                {idea.yt_comments_count !== null && (
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <MessageSquare className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Comments</p>
                    <p className="text-sm font-medium text-foreground">
                      {idea.yt_comments_count}
                    </p>
                  </div>
                )}
                {idea.yt_channel_subs !== null && (
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Subs</p>
                    <p className="text-sm font-medium text-foreground">
                      {idea.yt_channel_subs >= 1000000
                        ? `${(idea.yt_channel_subs / 1000000).toFixed(1)}M`
                        : idea.yt_channel_subs >= 1000
                          ? `${(idea.yt_channel_subs / 1000).toFixed(0)}K`
                          : idea.yt_channel_subs}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          {idea.summary && (
            <div className="glass-card rounded-xl p-5 space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Summary
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {idea.summary}
              </p>
            </div>
          )}

          {/* YT Estructure */}
          {idea.yt_estructure && (
            <div className="glass-card rounded-xl p-5 space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <ListTree className="w-4 h-4" />
                Estructura del Video
              </h3>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line prose prose-invert prose-sm max-w-none">
                {idea.yt_estructure}
              </div>
            </div>
          )}

          {/* Score */}
          {idea.score !== null && idea.score !== undefined && (
            <div className="glass-card rounded-xl p-5 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Score</h3>
              <p className="text-2xl font-bold text-foreground">{idea.score}</p>
            </div>
          )}

          {/* Notas IA */}
          {idea.notas_ia && (
            <div className="glass-card rounded-xl p-5 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Notas IA
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {idea.notas_ia}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
