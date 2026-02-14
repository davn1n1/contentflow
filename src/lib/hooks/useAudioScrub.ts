import { useRef, useCallback, useEffect } from "react";
import type { RemotionTimeline, RemotionClip } from "@/lib/remotion/types";

/**
 * Audio scrubbing hook: plays a brief audio snippet when scrubbing through the timeline.
 *
 * When the user drags the playhead, this hook finds the audio clip at the current frame,
 * fetches its audio buffer (cached), and plays a ~100ms snippet at the corresponding position.
 * Uses Web Audio API for low-latency playback.
 */
export function useAudioScrub(timeline: RemotionTimeline | undefined) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const lastScrubFrameRef = useRef<number>(-1);
  const isScrubbingRef = useRef(false);

  // Lazily create AudioContext on first interaction
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Fetch and cache audio buffer for a given URL
  const getBuffer = useCallback(
    async (src: string): Promise<AudioBuffer | null> => {
      const cache = bufferCacheRef.current;
      if (cache.has(src)) return cache.get(src)!;

      try {
        const ctx = getAudioContext();
        // Use media-proxy for CORS-safe fetching
        const proxiedUrl = `/api/remotion/media-proxy?url=${encodeURIComponent(src)}`;
        const response = await fetch(proxiedUrl);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        cache.set(src, audioBuffer);
        return audioBuffer;
      } catch {
        return null;
      }
    },
    [getAudioContext]
  );

  // Find the most prominent audio clip at a given frame (prefer voice/main audio over music)
  const findAudioClipAtFrame = useCallback(
    (frame: number): RemotionClip | null => {
      if (!timeline) return null;
      let best: RemotionClip | null = null;
      let bestVolume = 0;
      for (const track of timeline.tracks) {
        if (track.type !== "audio") continue;
        for (const clip of track.clips) {
          const clipEnd = clip.from + clip.durationInFrames;
          if (frame >= clip.from && frame < clipEnd) {
            const vol = clip.volume ?? 1;
            if (vol > bestVolume) {
              best = clip;
              bestVolume = vol;
            }
          }
        }
      }
      return best;
    },
    [timeline]
  );

  // Play a brief snippet at the given frame
  const scrubAtFrame = useCallback(
    async (frame: number) => {
      if (!timeline) return;

      // Throttle: skip if same frame or too close to last scrub
      const FRAME_THRESHOLD = 3;
      if (Math.abs(frame - lastScrubFrameRef.current) < FRAME_THRESHOLD) return;
      lastScrubFrameRef.current = frame;

      const clip = findAudioClipAtFrame(frame);
      if (!clip) return;

      const buffer = await getBuffer(clip.src);
      if (!buffer) return;

      const ctx = getAudioContext();

      // Stop any currently playing snippet
      if (activeSourceRef.current) {
        try {
          activeSourceRef.current.stop();
        } catch {
          // already stopped
        }
      }

      // Calculate the position in the audio file
      const fps = timeline.fps;
      const frameInClip = frame - clip.from;
      const startFrom = clip.startFrom ?? 0;
      const audioTime = (startFrom + frameInClip) / fps;
      const snippetDuration = 0.1; // 100ms snippet

      // Clamp to buffer bounds
      if (audioTime < 0 || audioTime >= buffer.duration) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Apply clip volume
      const gainNode = ctx.createGain();
      gainNode.gain.value = Math.min(1, clip.volume ?? 1);
      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start(0, audioTime, snippetDuration);
      activeSourceRef.current = source;
    },
    [timeline, findAudioClipAtFrame, getBuffer, getAudioContext]
  );

  // Start/stop scrub mode
  const startScrub = useCallback(() => {
    isScrubbingRef.current = true;
    lastScrubFrameRef.current = -1;
  }, []);

  const stopScrub = useCallback(() => {
    isScrubbingRef.current = false;
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch {
        // already stopped
      }
      activeSourceRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      bufferCacheRef.current.clear();
    };
  }, []);

  return { scrubAtFrame, startScrub, stopScrub };
}
