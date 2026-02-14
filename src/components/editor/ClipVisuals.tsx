"use client";

import { memo, useRef, useEffect, useState } from "react";
import { useWaveform } from "@/lib/hooks/useWaveform";

// ─── Audio Waveform ──────────────────────────────────────

/**
 * Renders audio waveform bars inside a clip.
 * Fills the entire clip area as a background visualization.
 */
export const AudioWaveform = memo(function AudioWaveform({
  src,
  bars = 60,
}: {
  src: string;
  bars?: number;
}) {
  const { peaks } = useWaveform(src, bars);

  if (peaks.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
      viewBox={`0 0 ${peaks.length} 100`}
    >
      {peaks.map((p, i) => {
        const h = Math.max(p * 80, 2); // min 2% height
        const y = (100 - h) / 2;
        return (
          <rect
            key={i}
            x={i}
            y={y}
            width={0.6}
            height={h}
            rx={0.15}
            fill="rgba(255,255,255,0.35)"
          />
        );
      })}
    </svg>
  );
});

// ─── Video Thumbnail ─────────────────────────────────────

/**
 * Extracts the first frame of a video and renders it as a background
 * image inside the clip bar. Uses a hidden <video> element to capture
 * a poster frame via canvas.
 */

const thumbCache = new Map<string, string>();

export const VideoThumbnail = memo(function VideoThumbnail({
  src,
}: {
  src: string;
}) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(
    thumbCache.get(src) || null
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (thumbCache.has(src)) {
      setThumbUrl(thumbCache.get(src)!);
      return;
    }

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "metadata";

    // Use proxy to avoid CORS
    video.src = `/api/remotion/media-proxy?url=${encodeURIComponent(src)}`;
    videoRef.current = video;

    const handleSeeked = () => {
      try {
        const canvas = document.createElement("canvas");
        // Small thumbnail: 160x90
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
          thumbCache.set(src, dataUrl);
          setThumbUrl(dataUrl);
        }
      } catch {
        // Canvas tainted or other error — ignore
      }
      video.remove();
    };

    const handleLoaded = () => {
      // Seek to 0.5s for a representative frame (not always black at 0)
      video.currentTime = 0.5;
    };

    video.addEventListener("loadeddata", handleLoaded, { once: true });
    video.addEventListener("seeked", handleSeeked, { once: true });

    // Timeout: don't hang forever
    const timer = setTimeout(() => {
      video.remove();
    }, 10000);

    video.load();

    return () => {
      clearTimeout(timer);
      video.removeEventListener("loadeddata", handleLoaded);
      video.removeEventListener("seeked", handleSeeked);
      video.remove();
    };
  }, [src]);

  if (!thumbUrl) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-40"
      style={{
        backgroundImage: `url(${thumbUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
  );
});
