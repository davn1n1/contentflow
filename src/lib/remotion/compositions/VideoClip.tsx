import React, { useContext } from "react";
import { Video as RemotionVideo } from "remotion";
import { Video as MediaVideo } from "@remotion/media";
import type { RemotionClip } from "../types";
import { RenderModeContext } from "../RenderModeContext";
import { useZoomInSlow, useTransitionIn, useTransitionOut } from "./effects";

export const VideoClip: React.FC<{ clip: RemotionClip }> = ({ clip }) => {
  const isWebRender = useContext(RenderModeContext);
  const scale = useZoomInSlow(clip.effect, clip.durationInFrames);
  const transIn = useTransitionIn(clip.transition, clip.durationInFrames);
  const transOut = useTransitionOut(clip.transition, clip.durationInFrames);

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
          src={clip.proxySrc || clip.src}
          trimBefore={clip.startFrom}
          volume={clip.volume ?? 1}
          fallbackOffthreadVideoProps={{ pauseWhenBuffering: true }}
          style={videoStyle}
        />
      ) : (
        <RemotionVideo
          src={clip.proxySrc || clip.src}
          startFrom={clip.startFrom}
          volume={clip.volume ?? 1}
          pauseWhenBuffering
          style={videoStyle}
        />
      )}
    </div>
  );
};
