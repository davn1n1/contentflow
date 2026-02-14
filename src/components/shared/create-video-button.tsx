"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Plus, Loader2, Check, AlertCircle, ExternalLink } from "lucide-react";
import { useAccountStore } from "@/lib/stores/account-store";
import { useVideoContextStore } from "@/lib/stores/video-context-store";
import confetti from "canvas-confetti";

interface CreateVideoButtonProps {
  ideaId: string;
  ideaTitle?: string | null;
  /** "compact" = small inline button, "full" = full-width prominent button */
  variant?: "compact" | "full";
  className?: string;
}

export function CreateVideoButton({
  ideaId,
  ideaTitle,
  variant = "full",
  className,
}: CreateVideoButtonProps) {
  const { currentAccount } = useAccountStore();
  const { setActiveVideo } = useVideoContextStore();
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
    videoId?: string;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const accountSlug = (currentAccount?.nameapp || currentAccount?.name || "")
    .toLowerCase()
    .replace(/\s+/g, "-");

  const fireConfetti = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { x, y },
      colors: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#3b82f6", "#818cf8"],
      ticks: 120,
      gravity: 1.2,
      scalar: 0.9,
    });
  }, []);

  async function handleCreate(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!currentAccount?.id || creating) return;

    setCreating(true);
    setResult(null);

    try {
      const res = await fetch("/api/data/videos/create-from-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId,
          accountId: currentAccount.id,
          format: "Horizontal",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al crear video");
      }

      const data = await res.json();
      setResult({
        type: "success",
        message: "Video creado!",
        videoId: data.videoId,
      });

      setActiveVideo(
        data.videoId,
        data.videoName || null,
        data.videoTitle || ideaTitle || null
      );

      fireConfetti();
    } catch (err) {
      setResult({
        type: "error",
        message: err instanceof Error ? err.message : "Error desconocido",
      });
    } finally {
      setCreating(false);
    }
  }

  if (result?.type === "success") {
    return (
      <div className={cn("space-y-2", className)} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20">
            <Check className="w-3 h-3" />
          </div>
          {result.message}
        </div>
        {result.videoId && accountSlug && (
          <Link
            href={`/${accountSlug}/videos?videoId=${result.videoId}`}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors",
              variant === "compact" ? "px-2 py-1.5" : "w-full px-3 py-2"
            )}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ir al Video Studio
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={cn(className)} onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        onClick={handleCreate}
        disabled={creating}
        className={cn(
          "flex items-center justify-center gap-2 rounded-lg font-semibold transition-all",
          variant === "compact"
            ? "px-3 py-1.5 text-[11px]"
            : "w-full px-3 py-2.5 text-xs",
          creating
            ? "bg-primary/50 text-primary-foreground cursor-not-allowed"
            : "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
        )}
      >
        {creating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Plus className="w-3.5 h-3.5" />
        )}
        Crear Nuevo Video
      </button>
      {result?.type === "error" && (
        <div className="flex items-center gap-2 text-xs text-red-400 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {result.message}
        </div>
      )}
    </div>
  );
}
