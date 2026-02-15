import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { STATIC_ASSETS } from "../constants";

// ─── Input Props ────────────────────────────────────────
export interface TextRevealProps {
  // Content
  title: string;
  subtitle?: string;

  // Colors
  bgColor?: string;
  accentColor?: string;
  textColor?: string;

  // Timing (seconds) — all adjustable via sliders
  titleEntryAt?: number;
  subtitleEntryAt?: number;
  lineDrawAt?: number;
  outroAt?: number;

  // Audio FX timing (seconds) + volume
  whooshInAt?: number;
  whooshInVolume?: number;
  whooshOutAt?: number;
  whooshOutVolume?: number;
}

// Default timing values (exported for registry + editor)
export const TEXT_REVEAL_DEFAULTS: Required<TextRevealProps> = {
  title: "Tu Título Aquí",
  subtitle: "Subtítulo opcional",
  bgColor: "#0a0a0a",
  accentColor: "#3b82f6",
  textColor: "#ffffff",
  titleEntryAt: 0.3,
  subtitleEntryAt: 0.6,
  lineDrawAt: 1.0,
  outroAt: 3.2,
  whooshInAt: 0.3,
  whooshInVolume: 0.5,
  whooshOutAt: 3.2,
  whooshOutVolume: 0.4,
};

// ─── Text Reveal Template ───────────────────────────────
// 4-second animated text with spring physics, accent line,
// letter-spacing animation, floating particles, and synced audio FX.

export const TextReveal: React.FC<TextRevealProps> = (props) => {
  const p = { ...TEXT_REVEAL_DEFAULTS, ...props };
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Convert seconds → frames ──
  const bgSweepEnd = Math.round(fps * 0.8);
  const titleStart = Math.round(fps * p.titleEntryAt);
  const subtitleStart = Math.round(fps * p.subtitleEntryAt);
  const lineStart = Math.round(fps * p.lineDrawAt);
  const lineEnd = lineStart + Math.round(fps * 0.5);
  const outStart = Math.round(fps * p.outroAt);
  const totalFrames = Math.round(fps * 4);
  const whooshInFrame = Math.round(fps * p.whooshInAt);
  const whooshOutFrame = Math.round(fps * p.whooshOutAt);

  // ── Background gradient sweep ──
  const sweepProgress = interpolate(frame, [0, bgSweepEnd], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // ── Title spring animation ──
  const titleSpring = spring({
    frame: Math.max(0, frame - titleStart),
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
  });
  const titleY = interpolate(titleSpring, [0, 1], [60, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  // ── Subtitle fade + tracking ──
  const subOpacity = interpolate(
    frame,
    [subtitleStart, subtitleStart + Math.round(fps * 0.5)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const letterSpacing = interpolate(
    frame,
    [subtitleStart, subtitleStart + Math.round(fps * 0.7)],
    [12, 4],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // ── Accent line ──
  const lineWidth = interpolate(frame, [lineStart, lineEnd], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // ── Outro: fade + scale down ──
  const outProgress = interpolate(frame, [outStart, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const outOpacity = 1 - outProgress;
  const outScale = interpolate(outProgress, [0, 1], [1, 0.92]);

  // ── Floating particles ──
  const particles = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2;
    const radius = 280 + i * 40;
    const speed = 0.008 + i * 0.002;
    const x = Math.cos(angle + frame * speed) * radius;
    const y = Math.sin(angle + frame * speed) * radius;
    const size = 3 + i * 1.5;
    const particleOpacity = interpolate(
      frame,
      [Math.round(fps * 0.5) + i * 5, Math.round(fps * 1.2) + i * 5],
      [0, 0.4],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    ) * outOpacity;
    return { x, y, size, opacity: particleOpacity, key: i };
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: p.bgColor,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Background gradient sweep */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, ${p.accentColor}22 0%, transparent 70%)`,
          opacity: sweepProgress,
          transform: `scale(${1 + sweepProgress * 0.3})`,
        }}
      />

      {/* Floating particles */}
      {particles.map((pt) => (
        <div
          key={pt.key}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: pt.size,
            height: pt.size,
            borderRadius: "50%",
            backgroundColor: p.accentColor,
            opacity: pt.opacity,
            transform: `translate(${pt.x}px, ${pt.y}px)`,
          }}
        />
      ))}

      {/* Content container with outro animation */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          opacity: outOpacity,
          transform: `scale(${outScale})`,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: p.textColor,
            fontFamily: "Inter, system-ui, sans-serif",
            textAlign: "center",
            lineHeight: 1.1,
            maxWidth: "80%",
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          {p.title}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: `${lineWidth}px`,
            height: 3,
            backgroundColor: p.accentColor,
            borderRadius: 2,
          }}
        />

        {/* Subtitle */}
        {p.subtitle && (
          <div
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: p.textColor,
              fontFamily: "Inter, system-ui, sans-serif",
              textAlign: "center",
              textTransform: "uppercase",
              opacity: subOpacity,
              letterSpacing: `${letterSpacing}px`,
            }}
          >
            {p.subtitle}
          </div>
        )}
      </div>

      {/* ── Audio FX synced to animations ── */}

      <Sequence from={whooshInFrame} durationInFrames={30} name="SFX: Whoosh In">
        <Audio src={STATIC_ASSETS.WHOOSH_IN} volume={p.whooshInVolume} />
      </Sequence>

      <Sequence from={whooshOutFrame} durationInFrames={24} name="SFX: Whoosh Out">
        <Audio src={STATIC_ASSETS.WHOOSH_OUT} volume={p.whooshOutVolume} />
      </Sequence>
    </AbsoluteFill>
  );
};
