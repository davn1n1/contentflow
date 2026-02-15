import React from "react";
import { Img } from "remotion";
import type { RemotionClip } from "../types";
import { useZoomInSlow, useTransitionIn, useTransitionOut } from "./effects";

export const ImageClip: React.FC<{ clip: RemotionClip }> = ({ clip }) => {
  const scale = useZoomInSlow(clip.effect, clip.durationInFrames);
  const transIn = useTransitionIn(clip.transition, clip.durationInFrames);
  const transOut = useTransitionOut(clip.transition, clip.durationInFrames);

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
      <Img
        src={clip.proxySrc || clip.src}
        pauseWhenLoading
        style={{
          width: "100%",
          height: "100%",
          objectFit: clip.fit || "cover",
          transform: transforms.length > 0 ? transforms.join(" ") : undefined,
        }}
      />
    </div>
  );
};
