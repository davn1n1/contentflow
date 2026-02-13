import React from "react";
import { Audio, useCurrentFrame, useVideoConfig } from "remotion";
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
      src={clip.src}
      startFrom={clip.startFrom}
      volume={volume}
    />
  );
};
