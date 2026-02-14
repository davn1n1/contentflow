"use client";

import { useCallback } from "react";
import { Video, ImageIcon, Volume2 } from "lucide-react";
import { useEditorStore } from "@/lib/stores/editor-store";
import type { RemotionClip, ClipEffect, AudioEffect } from "@/lib/remotion/types";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────

function clipTypeBadge(type: string) {
  const config = {
    video: { icon: Video, label: "Video", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    image: { icon: ImageIcon, label: "Imagen", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    audio: { icon: Volume2, label: "Audio", className: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  }[type] ?? { icon: Video, label: type, className: "bg-gray-500/15 text-gray-400 border-gray-500/30" };

  const Icon = config.icon;
  return (
    <span className={cn("flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border", config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────

export function ClipProperties({ clip, fps }: { clip: RemotionClip; fps: number }) {
  const updateClip = useEditorStore((s) => s.updateClip);

  const update = useCallback(
    (updates: Partial<RemotionClip>) => {
      updateClip(clip.id, updates);
    },
    [clip.id, updateClip]
  );

  const startSec = (clip.from / fps).toFixed(1);
  const durSec = (clip.durationInFrames / fps).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Type badge + timing */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {clipTypeBadge(clip.type)}
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Inicio: <span className="text-foreground font-mono">{startSec}s</span></span>
          <span>Duracion: <span className="text-foreground font-mono">{durSec}s</span></span>
        </div>
      </div>

      <Separator />

      {/* Volume (video + audio) */}
      {(clip.type === "video" || clip.type === "audio") && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Volumen</Label>
            <span className="text-xs font-mono text-muted-foreground">
              {Math.round((clip.volume ?? 1) * 100)}%
            </span>
          </div>
          <Slider
            value={[clip.volume ?? 1]}
            min={0}
            max={1}
            step={0.05}
            onValueChange={([v]) => update({ volume: v })}
          />
        </div>
      )}

      {/* Scale (video + image) */}
      {(clip.type === "video" || clip.type === "image") && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Escala</Label>
            <span className="text-xs font-mono text-muted-foreground">
              {((clip.scale ?? 1) * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            value={[clip.scale ?? 1]}
            min={0.5}
            max={2}
            step={0.05}
            onValueChange={([v]) => update({ scale: v })}
          />
        </div>
      )}

      {/* Fit (video + image) */}
      {(clip.type === "video" || clip.type === "image") && (
        <div className="space-y-2">
          <Label>Ajuste</Label>
          <Select
            value={clip.fit || "cover"}
            onValueChange={(v) => update({ fit: v as "cover" | "contain" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">Cover (recortar)</SelectItem>
              <SelectItem value="contain">Contain (ajustar)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Effect (video + image) */}
      {(clip.type === "video" || clip.type === "image") && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label>Efecto</Label>
            <Select
              value={clip.effect || "none"}
              onValueChange={(v) => update({ effect: v as ClipEffect })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                <SelectItem value="zoomInSlow">Zoom lento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Transition (video + image) */}
      {(clip.type === "video" || clip.type === "image") && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>Entrada</Label>
            <Select
              value={clip.transition?.in || "none"}
              onValueChange={(v) =>
                update({
                  transition: {
                    ...clip.transition,
                    in: v as "carouselRight" | "fadeIn" | "none",
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                <SelectItem value="fadeIn">Fade In</SelectItem>
                <SelectItem value="carouselRight">Carousel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Salida</Label>
            <Select
              value={clip.transition?.out || "none"}
              onValueChange={(v) =>
                update({
                  transition: {
                    ...clip.transition,
                    out: v as "slideRightFast" | "fadeOut" | "none",
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                <SelectItem value="fadeOut">Fade Out</SelectItem>
                <SelectItem value="slideRightFast">Slide</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Filter (video) */}
      {clip.type === "video" && (
        <div className="space-y-2">
          <Label>Filtro</Label>
          <Select
            value={clip.filter || "none"}
            onValueChange={(v) => update({ filter: v === "none" ? undefined : v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Ninguno</SelectItem>
              <SelectItem value="blur">Blur</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Audio Effect */}
      {(clip.type === "audio" || clip.type === "video") && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label>Efecto de audio</Label>
            <Select
              value={clip.audioEffect || "none"}
              onValueChange={(v) => update({ audioEffect: v as AudioEffect })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                <SelectItem value="fadeIn">Fade In</SelectItem>
                <SelectItem value="fadeOut">Fade Out</SelectItem>
                <SelectItem value="fadeInFadeOut">Fade In + Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Source URL */}
      <Separator />
      <div className="space-y-1">
        <Label>Fuente</Label>
        <p className="text-[10px] text-muted-foreground/50 break-all line-clamp-2" title={clip.src}>
          {clip.src}
        </p>
      </div>
    </div>
  );
}
