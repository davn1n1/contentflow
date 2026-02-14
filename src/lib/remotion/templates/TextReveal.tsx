import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

// ─── Input Props ────────────────────────────────────────
export interface TextRevealProps {
  /** Main title text (line 1) */
  title: string;
  /** Subtitle text (line 2, optional) */
  subtitle?: string;
  /** Background color */
  bgColor?: string;
  /** Accent color for decorative elements */
  accentColor?: string;
  /** Text color */
  textColor?: string;
}

// ─── Text Reveal Template ───────────────────────────────
// 4-second animated text template with:
//   0.0s-0.8s  → Background gradient sweep
//   0.3s-1.0s  → Title slides up + fades in with spring
//   0.6s-1.3s  → Subtitle fades in + tracking expands
//   1.0s-1.5s  → Accent line draws in from center
//   1.5s-3.2s  → Hold
//   3.2s-4.0s  → Everything fades out + scales down

export const TextReveal: React.FC<TextRevealProps> = ({
  title = "Tu Título Aquí",
  subtitle,
  bgColor = "#0a0a0a",
  accentColor = "#3b82f6",
  textColor = "#ffffff",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Phase timing (in frames) ──
  const bgSweepEnd = Math.round(fps * 0.8);
  const titleStart = Math.round(fps * 0.3);
  const subtitleStart = Math.round(fps * 0.6);
  const lineStart = Math.round(fps * 1.0);
  const lineEnd = Math.round(fps * 1.5);
  const outStart = Math.round(fps * 3.2);
  const totalFrames = Math.round(fps * 4);

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

  // ── Floating particles (decorative) ──
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
        backgroundColor: bgColor,
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
          background: `radial-gradient(ellipse at 50% 50%, ${accentColor}22 0%, transparent 70%)`,
          opacity: sweepProgress,
          transform: `scale(${1 + sweepProgress * 0.3})`,
        }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.key}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: accentColor,
            opacity: p.opacity,
            transform: `translate(${p.x}px, ${p.y}px)`,
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
            color: textColor,
            fontFamily: "Inter, system-ui, sans-serif",
            textAlign: "center",
            lineHeight: 1.1,
            maxWidth: "80%",
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          {title}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: `${lineWidth}px`,
            height: 3,
            backgroundColor: accentColor,
            borderRadius: 2,
          }}
        />

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: textColor,
              fontFamily: "Inter, system-ui, sans-serif",
              textAlign: "center",
              textTransform: "uppercase",
              opacity: subOpacity,
              letterSpacing: `${letterSpacing}px`,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
