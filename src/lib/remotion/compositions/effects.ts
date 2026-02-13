import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { ClipEffect, ClipTransition, AudioEffect } from "../types";

/**
 * Returns a CSS transform scale value for the zoomInSlow effect.
 * Shotstack: slowly zooms from 1.0 to ~1.1 over the clip duration.
 */
export function useZoomInSlow(
  effect: ClipEffect | undefined,
  durationInFrames: number
): number {
  const frame = useCurrentFrame();
  if (effect !== "zoomInSlow") return 1;

  return interpolate(frame, [0, durationInFrames], [1, 1.1], {
    extrapolateRight: "clamp",
  });
}

/**
 * Returns CSS transform for transition-in animation.
 */
export function useTransitionIn(
  transition: ClipTransition | undefined,
  durationInFrames: number
): { transform?: string; opacity?: number } {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!transition?.in) return {};

  if (transition.in === "carouselRight") {
    const transitionDuration = Math.min(fps * 0.5, durationInFrames);
    const progress = spring({
      frame,
      fps,
      config: { damping: 20, stiffness: 100 },
      durationInFrames: transitionDuration,
    });
    const translateX = interpolate(progress, [0, 1], [100, 0]);
    return { transform: `translateX(${translateX}%)` };
  }

  if (transition.in === "fadeIn") {
    const transitionDuration = Math.min(fps * 0.5, durationInFrames);
    const opacity = interpolate(frame, [0, transitionDuration], [0, 1], {
      extrapolateRight: "clamp",
    });
    return { opacity };
  }

  return {};
}

/**
 * Returns CSS transform for transition-out animation.
 */
export function useTransitionOut(
  transition: ClipTransition | undefined,
  durationInFrames: number
): { transform?: string; opacity?: number } {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!transition?.out) return {};

  if (transition.out === "slideRightFast") {
    const outStart = durationInFrames - Math.min(fps * 0.3, durationInFrames);
    if (frame < outStart) return {};
    const progress = interpolate(frame, [outStart, durationInFrames], [0, 100], {
      extrapolateRight: "clamp",
    });
    return { transform: `translateX(${progress}%)` };
  }

  if (transition.out === "fadeOut") {
    const outStart = durationInFrames - Math.min(fps * 0.5, durationInFrames);
    if (frame < outStart) return {};
    const opacity = interpolate(frame, [outStart, durationInFrames], [1, 0], {
      extrapolateRight: "clamp",
    });
    return { opacity };
  }

  return {};
}

/**
 * Returns volume value for audio effects (fadeIn, fadeOut, fadeInFadeOut).
 */
export function useAudioEffect(
  audioEffect: AudioEffect | undefined,
  baseVolume: number,
  durationInFrames: number
): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!audioEffect || audioEffect === "none") return baseVolume;

  const fadeDuration = Math.min(fps * 1.0, durationInFrames / 2); // 1 second fade

  if (audioEffect === "fadeIn") {
    const multiplier = interpolate(frame, [0, fadeDuration], [0, 1], {
      extrapolateRight: "clamp",
    });
    return baseVolume * multiplier;
  }

  if (audioEffect === "fadeOut") {
    const outStart = durationInFrames - fadeDuration;
    const multiplier = interpolate(frame, [outStart, durationInFrames], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return baseVolume * multiplier;
  }

  if (audioEffect === "fadeInFadeOut") {
    const outStart = durationInFrames - fadeDuration;
    const fadeInMultiplier = interpolate(frame, [0, fadeDuration], [0, 1], {
      extrapolateRight: "clamp",
    });
    const fadeOutMultiplier = interpolate(
      frame,
      [outStart, durationInFrames],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    return baseVolume * Math.min(fadeInMultiplier, fadeOutMultiplier);
  }

  return baseVolume;
}
