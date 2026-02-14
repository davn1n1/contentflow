import React from "react";
import { Audio } from "@remotion/media";
import type { RemotionClip } from "../types";
import { useAudioEffect } from "./effects";

export const AudioClip: React.FC<{ clip: RemotionClip }> = ({ clip }) => {
  const baseVolume = clip.volume ?? 1;
  const volume = useAudioEffect(
    clip.audioEffect,
    baseVolume,
    clip.durationInFrames
  );

  return (
    <Audio
      src={clip.proxySrc || clip.src}
      trimBefore={clip.startFrom}
      volume={volume}
      fallbackHtml5AudioProps={{ pauseWhenBuffering: true }}
    />
  );
};
