"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Extracts a simplified waveform (array of peak amplitudes 0-1) from an audio URL.
 * Uses Web Audio API to decode audio data, then downsamples to `bars` peaks.
 * Fetches via the media-proxy to avoid CORS issues with S3/HeyGen URLs.
 *
 * Results are cached in a module-level Map so re-renders don't re-fetch.
 */

const cache = new Map<string, number[]>();
const inflight = new Map<string, Promise<number[]>>();

async function extractPeaks(url: string, bars: number): Promise<number[]> {
  const key = `${url}::${bars}`;
  if (cache.has(key)) return cache.get(key)!;
  if (inflight.has(key)) return inflight.get(key)!;

  const p = (async () => {
    try {
      // Fetch through our CORS proxy
      const proxyUrl = `/api/remotion/media-proxy?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Proxy returned ${res.status}`);

      const buf = await res.arrayBuffer();
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const decoded = await ctx.decodeAudioData(buf);

      // Use first channel
      const raw = decoded.getChannelData(0);
      const samplesPerBar = Math.floor(raw.length / bars);
      const peaks: number[] = [];

      for (let i = 0; i < bars; i++) {
        let max = 0;
        const start = i * samplesPerBar;
        const end = Math.min(start + samplesPerBar, raw.length);
        for (let j = start; j < end; j++) {
          const abs = Math.abs(raw[j]);
          if (abs > max) max = abs;
        }
        peaks.push(max);
      }

      // Normalize to 0-1
      const globalMax = Math.max(...peaks, 0.01);
      const normalized = peaks.map((p) => p / globalMax);

      cache.set(key, normalized);
      inflight.delete(key);
      await ctx.close();
      return normalized;
    } catch {
      inflight.delete(key);
      return [];
    }
  })();

  inflight.set(key, p);
  return p;
}

export function useWaveform(src: string | undefined, bars: number = 60) {
  const [peaks, setPeaks] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!src) return;

    const key = `${src}::${bars}`;
    if (cache.has(key)) {
      setPeaks(cache.get(key)!);
      return;
    }

    setLoading(true);
    extractPeaks(src, bars).then((p) => {
      if (mountedRef.current) {
        setPeaks(p);
        setLoading(false);
      }
    });
  }, [src, bars]);

  return { peaks, loading };
}
