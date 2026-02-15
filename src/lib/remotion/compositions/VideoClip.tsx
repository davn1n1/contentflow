import React, { useContext, useState, useCallback } from "react";
import { Video as RemotionVideo } from "remotion";
import { Video as MediaVideo } from "@remotion/media";
import type { RemotionClip } from "../types";
import { RenderModeContext } from "../RenderModeContext";
import { useZoomInSlow, useTransitionIn, useTransitionOut } from "./effects";

export const VideoClip: React.FC<{ clip: RemotionClip }> = ({ clip }) => {
  const isWebRender = useContext(RenderModeContext);
  const [useFallback, setUseFallback] = useState(false);
  const scale = useZoomInSlow(clip.effect, clip.durationInFrames);
  const transIn = useTransitionIn(clip.transition, clip.durationInFrames);
  const transOut = useTransitionOut(clip.transition, clip.durationInFrames);

  // If proxy fails, fall back to original src
  const src = useFallback
    ? clip.src
    : clip.proxySrc || clip.src;

  const onMediaError = useCallback((error: Error) => {
    if (clip.proxySrc && !useFallback) {
      console.warn(`[VideoClip] Proxy failed for "${clip.name}", falling back to original src:`, error.message);
      setUseFallback(true);
    }
    // Return "fallback" so @remotion/media uses OffthreadVideo instead of crashing
    return "fallback" as const;
  }, [clip.proxySrc, clip.name, useFallback]);

  // For standard <Video>, onError is a plain event handler
  const onVideoError = useCallback(() => {
    if (clip.proxySrc && !useFallback) {
      console.warn(`[VideoClip] Proxy failed for "${clip.name}", falling back to original src`);
      setUseFallback(true);
    }
  }, [clip.proxySrc, clip.name, useFallback]);

  // Build transform string
  const transforms: string[] = [];
  if (scale !== 1) transforms.push(`scale(${scale})`);
  if (clip.offset) {
    transforms.push(`translate(${clip.offset.x}%, ${clip.offset.y}%)`);
  }
  if (clip.scale && clip.scale !== 1) {
    transforms.push(`scale(${clip.scale})`);
  }
  if (transIn.transform) transforms.push(transIn.transform);
  if (transOut.transform) transforms.push(transOut.transform);

  const opacity = transIn.opacity ?? transOut.opacity ?? 1;

  const videoStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: clip.fit || "cover",
    transform: transforms.length > 0 ? transforms.join(" ") : undefined,
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        overflow: "hidden",
        opacity,
        filter: clip.filter === "blur" ? "blur(10px)" : undefined,
      }}
    >
      {isWebRender ? (
        <MediaVideo
          src={src}
          trimBefore={clip.startFrom}
          volume={clip.volume ?? 1}
          fallbackOffthreadVideoProps={{ pauseWhenBuffering: true }}
          onError={onMediaError}
          style={videoStyle}
        />
      ) : (
        <RemotionVideo
          src={src}
          startFrom={clip.startFrom}
          volume={clip.volume ?? 1}
          pauseWhenBuffering
          onError={onVideoError}
          style={videoStyle}
        />
      )}
    </div>
  );
};
