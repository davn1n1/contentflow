import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import type { RemotionTimeline, RemotionTrack, RemotionClip } from "../types";
import { VideoClip } from "./VideoClip";
import { ImageClip } from "./ImageClip";
import { AudioClip } from "./AudioClip";

/** Premount clips 3 seconds before they appear (at 30fps = 90 frames) */
const PREMOUNT_FRAMES = 90;

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

  // Separate visual and audio tracks
  const visualTracks = tracks
    .filter((t) => t.type === "visual")
    .sort((a, b) => a.zIndex - b.zIndex); // lowest zIndex first (background)

  const audioTracks = tracks.filter((t) => t.type === "audio");

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* Visual tracks: render in zIndex order (lowest = background, highest = foreground) */}
      {visualTracks.map((track) => (
        <TrackLayer key={track.id} track={track} />
      ))}

      {/* Audio tracks: no visual rendering needed */}
      {audioTracks.map((track) =>
        track.clips.map((clip) => (
          <Sequence
            key={clip.id}
            from={clip.from}
            durationInFrames={clip.durationInFrames}
            premountFor={PREMOUNT_FRAMES}
            name={`${track.id}: ${clipLabel(clip)}`}
          >
            <AudioClip clip={clip} />
          </Sequence>
        ))
      )}
    </AbsoluteFill>
  );
};

const TrackLayer: React.FC<{ track: RemotionTrack }> = ({ track }) => {
  return (
    <>
      {track.clips.map((clip) => (
        <Sequence
          key={clip.id}
          from={clip.from}
          durationInFrames={clip.durationInFrames}
          premountFor={PREMOUNT_FRAMES}
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
    default:
      return null;
  }
};
