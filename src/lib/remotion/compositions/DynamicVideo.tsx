import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import type { RemotionTimeline, RemotionTrack, RemotionClip } from "../types";
import { VideoClip } from "./VideoClip";
import { ImageClip } from "./ImageClip";
import { AudioClip } from "./AudioClip";
import { TemplateClip } from "./TemplateClip";

function clipLabel(clip: RemotionClip): string {
  return clip.name || clip.src.split("/").pop() || clip.id;
}

/**
 * DynamicVideo — The main Remotion composition.
 * Receives a RemotionTimeline (converted from Shotstack JSON)
 * and renders all tracks and clips dynamically.
 */
export const DynamicVideo: React.FC<RemotionTimeline> = (props) => {
  const { tracks, backgroundColor } = props;
  const { fps } = useVideoConfig();

  /** Premount clips 3 seconds before they appear */
  const premountFrames = fps * 3;

  // Separate visual and audio tracks
  const visualTracks = tracks
    .filter((t) => t.type === "visual")
    .sort((a, b) => a.zIndex - b.zIndex); // lowest zIndex first (background)

  const audioTracks = tracks.filter((t) => t.type === "audio");

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* Visual tracks: render in zIndex order (lowest = background, highest = foreground) */}
      {visualTracks.map((track) => (
        <TrackLayer key={track.id} track={track} premountFrames={premountFrames} />
      ))}

      {/* Audio tracks: layout="none" since audio has no visual rendering */}
      {audioTracks.map((track) =>
        track.clips.map((clip) => (
          <Sequence
            key={clip.id}
            from={clip.from}
            durationInFrames={clip.durationInFrames}
            layout="none"
            name={`${track.id}: ${clipLabel(clip)}`}
          >
            <AudioClip clip={clip} />
          </Sequence>
        ))
      )}
    </AbsoluteFill>
  );
};

const TrackLayer: React.FC<{ track: RemotionTrack; premountFrames: number }> = ({ track, premountFrames }) => {
  return (
    <>
      {track.clips.map((clip) => (
        <Sequence
          key={clip.id}
          from={clip.from}
          durationInFrames={clip.durationInFrames}
          premountFor={premountFrames}
          name={`${track.id}: ${clipLabel(clip)}`}
          style={{ zIndex: track.zIndex }}
        >
          <ClipRenderer clip={clip} />
        </Sequence>
      ))}
    </>
  );
};

const ClipRenderer: React.FC<{ clip: RemotionClip }> = ({ clip }) => {
  switch (clip.type) {
    case "video":
      return <VideoClip clip={clip} />;
    case "image":
      return <ImageClip clip={clip} />;
    case "audio":
      return <AudioClip clip={clip} />;
    case "template":
      return <TemplateClip clip={clip} />;
    default:
      return null;
  }
};
