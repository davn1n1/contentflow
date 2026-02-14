import React, { useContext } from "react";
import { Audio as RemotionAudio } from "remotion";
import { Audio as MediaAudio } from "@remotion/media";
import type { RemotionClip } from "../types";
import { RenderModeContext } from "../RenderModeContext";
import { useAudioEffect } from "./effects";

export const AudioClip: React.FC<{ clip: RemotionClip }> = ({ clip }) => {
  const isWebRender = useContext(RenderModeContext);
  const baseVolume = clip.volume ?? 1;
  const volume = useAudioEffect(
    clip.audioEffect,
    baseVolume,
    clip.durationInFrames
  );

  if (isWebRender) {
    return (
      <MediaAudio
        src={clip.proxySrc || clip.src}
        trimBefore={clip.startFrom}
        volume={volume}
        fallbackHtml5AudioProps={{ pauseWhenBuffering: true }}
      />
    );
  }

  return (
    <RemotionAudio
      src={clip.proxySrc || clip.src}
      startFrom={clip.startFrom}
      volume={volume}
      pauseWhenBuffering
    />
  );
};
