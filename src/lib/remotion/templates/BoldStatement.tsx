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
export interface BoldStatementProps {
  // Content
  statement: string;
  tagline?: string;

  // Colors
  bgColor?: string;
  statementColor?: string;
  taglineColor?: string;
  glowColor?: string;

  // Timing
  slamAt?: number;
  taglineAt?: number;
  outroAt?: number;

  // Audio
  impactAt?: number;
  impactVolume?: number;
}

export const BOLD_STATEMENT_DEFAULTS: Required<BoldStatementProps> = {
  statement: "ESTO LO CAMBIA TODO",
  tagline: "Y te explico por qué",
  bgColor: "#0f0f23",
  statementColor: "#ffffff",
  taglineColor: "#a0a0b0",
  glowColor: "#ff3366",
  slamAt: 0.2,
  taglineAt: 1.2,
  outroAt: 3.0,
  impactAt: 0.2,
  impactVolume: 0.6,
};

// ─── Bold Statement Template ────────────────────────────
// 4-second dramatic text slam with glow pulse, shake effect,
// and cinematic tagline fade. Perfect for hooks and CTAs.

export const BoldStatement: React.FC<BoldStatementProps> = (props) => {
  const p = { ...BOLD_STATEMENT_DEFAULTS, ...props };
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slamFrame = Math.round(fps * p.slamAt);
  const taglineFrame = Math.round(fps * p.taglineAt);
  const outStart = Math.round(fps * p.outroAt);
  const totalFrames = Math.round(fps * 4);
  const impactFrame = Math.round(fps * p.impactAt);

  // ── Slam spring (heavy, bouncy) ──
  const slamSpring = spring({
    frame: Math.max(0, frame - slamFrame),
    fps,
    config: { damping: 8, stiffness: 200, mass: 1.2 },
  });
  const slamScale = interpolate(slamSpring, [0, 1], [3, 1]);
  const slamOpacity = interpolate(slamSpring, [0, 1], [0, 1]);

  // ── Camera shake on impact ──
  const shakeIntensity = interpolate(
    frame,
    [slamFrame, slamFrame + 6, slamFrame + 12],
    [0, 12, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const shakeX = Math.sin(frame * 2.5) * shakeIntensity;
  const shakeY = Math.cos(frame * 3.1) * shakeIntensity;

  // ── Glow pulse ──
  const glowPulse = interpolate(
    frame,
    [slamFrame + 4, slamFrame + 20, slamFrame + 40],
    [0, 1, 0.3],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // ── Tagline fade ──
  const taglineOpacity = interpolate(
    frame,
    [taglineFrame, taglineFrame + Math.round(fps * 0.4)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const taglineY = interpolate(
    frame,
    [taglineFrame, taglineFrame + Math.round(fps * 0.5)],
    [20, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // ── Outro ──
  const outProgress = interpolate(frame, [outStart, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const outOpacity = 1 - outProgress;

  // ── Horizontal lines decoration ──
  const lineProgress = interpolate(
    frame,
    [slamFrame + 8, slamFrame + 25],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: p.bgColor,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* Glow behind text */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${p.glowColor}44 0%, transparent 70%)`,
          opacity: glowPulse * outOpacity,
          filter: "blur(40px)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
          opacity: outOpacity,
          padding: "0 60px",
        }}
      >
        {/* Decorative line top */}
        <div
          style={{
            width: `${lineProgress * 200}px`,
            height: 2,
            backgroundColor: p.glowColor,
            opacity: 0.6,
          }}
        />

        {/* Statement */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: p.statementColor,
            fontFamily: "Inter, system-ui, sans-serif",
            textAlign: "center",
            lineHeight: 1.05,
            textTransform: "uppercase",
            opacity: slamOpacity,
            transform: `scale(${slamScale})`,
            textShadow: `0 0 ${glowPulse * 30}px ${p.glowColor}88`,
          }}
        >
          {p.statement}
        </div>

        {/* Decorative line bottom */}
        <div
          style={{
            width: `${lineProgress * 200}px`,
            height: 2,
            backgroundColor: p.glowColor,
            opacity: 0.6,
          }}
        />

        {/* Tagline */}
        {p.tagline && (
          <div
            style={{
              fontSize: 32,
              fontWeight: 300,
              color: p.taglineColor,
              fontFamily: "Inter, system-ui, sans-serif",
              textAlign: "center",
              opacity: taglineOpacity,
              transform: `translateY(${taglineY}px)`,
              letterSpacing: 2,
            }}
          >
            {p.tagline}
          </div>
        )}
      </div>

      {/* Impact SFX */}
      <Sequence from={impactFrame} durationInFrames={30} name="SFX: Impact">
        <Audio src={STATIC_ASSETS.WHOOSH_IN} volume={p.impactVolume} />
      </Sequence>
    </AbsoluteFill>
  );
};
