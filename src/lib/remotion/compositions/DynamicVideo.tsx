import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import type { RemotionTimeline, RemotionTrack, RemotionClip } from "../types";
import { VideoClip } from "./VideoClip";
import { ImageClip } from "./ImageClip";
import { AudioClip } from "./AudioClip";

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
            name={`${track.id}: ${clip.src.split("/").pop()}`}
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
          name={`${track.id}: ${clip.type} - ${clip.src.split("/").pop()}`}
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
