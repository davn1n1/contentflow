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
export interface LowerThirdProps {
  // Content
  name: string;
  role?: string;

  // Colors
  bgColor?: string;
  barColor?: string;
  nameColor?: string;
  roleColor?: string;

  // Timing
  slideInAt?: number;
  slideOutAt?: number;

  // Audio
  swooshAt?: number;
  swooshVolume?: number;
}

export const LOWER_THIRD_DEFAULTS: Required<LowerThirdProps> = {
  name: "David Aranzabal",
  role: "CEO & Founder",
  bgColor: "transparent",
  barColor: "#6366f1",
  nameColor: "#ffffff",
  roleColor: "#a0a0b0",
  slideInAt: 0.3,
  slideOutAt: 3.0,
  swooshAt: 0.3,
  swooshVolume: 0.4,
};

// ─── Lower Third Template ───────────────────────────────
// 4-second animated name card that slides in from the left
// with a colored accent bar, perfect for speaker intros.

export const LowerThird: React.FC<LowerThirdProps> = (props) => {
  const p = { ...LOWER_THIRD_DEFAULTS, ...props };
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideInFrame = Math.round(fps * p.slideInAt);
  const slideOutFrame = Math.round(fps * p.slideOutAt);
  const swooshFrame = Math.round(fps * p.swooshAt);

  // ── Slide in spring ──
  const inSpring = spring({
    frame: Math.max(0, frame - slideInFrame),
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.7 },
  });
  const slideX = interpolate(inSpring, [0, 1], [-400, 0]);
  const cardOpacity = interpolate(inSpring, [0, 1], [0, 1]);

  // ── Bar extend ──
  const barWidth = interpolate(
    inSpring,
    [0, 1],
    [0, 6],
  );

  // ── Name stagger ──
  const nameOpacity = interpolate(
    frame,
    [slideInFrame + 4, slideInFrame + 4 + Math.round(fps * 0.3)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const nameX = interpolate(
    frame,
    [slideInFrame + 4, slideInFrame + 4 + Math.round(fps * 0.3)],
    [20, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // ── Role stagger ──
  const roleOpacity = interpolate(
    frame,
    [slideInFrame + 10, slideInFrame + 10 + Math.round(fps * 0.3)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const roleX = interpolate(
    frame,
    [slideInFrame + 10, slideInFrame + 10 + Math.round(fps * 0.3)],
    [20, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // ── Slide out ──
  const outProgress = interpolate(
    frame,
    [slideOutFrame, slideOutFrame + Math.round(fps * 0.4)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) }
  );
  const outX = interpolate(outProgress, [0, 1], [0, -400]);
  const outOpacity = 1 - outProgress;

  // ── Bottom glow line ──
  const glowWidth = interpolate(
    inSpring,
    [0, 1],
    [0, 200],
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: p.bgColor,
        justifyContent: "flex-end",
        alignItems: "flex-start",
        overflow: "hidden",
        padding: "0 0 180px 80px",
      }}
    >
      {/* Card container */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          opacity: cardOpacity * outOpacity,
          transform: `translateX(${slideX + outX}px)`,
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            width: barWidth,
            backgroundColor: p.barColor,
            borderRadius: 3,
            marginRight: 16,
          }}
        />

        {/* Text content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "8px 0",
          }}
        >
          {/* Name */}
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: p.nameColor,
              fontFamily: "Inter, system-ui, sans-serif",
              opacity: nameOpacity,
              transform: `translateX(${nameX}px)`,
            }}
          >
            {p.name}
          </div>

          {/* Role */}
          {p.role && (
            <div
              style={{
                fontSize: 24,
                fontWeight: 400,
                color: p.roleColor,
                fontFamily: "Inter, system-ui, sans-serif",
                textTransform: "uppercase",
                letterSpacing: 2,
                opacity: roleOpacity,
                transform: `translateX(${roleX}px)`,
              }}
            >
              {p.role}
            </div>
          )}

          {/* Glow line under text */}
          <div
            style={{
              width: glowWidth,
              height: 2,
              backgroundColor: p.barColor,
              opacity: 0.4,
              marginTop: 4,
              borderRadius: 1,
            }}
          />
        </div>
      </div>

      {/* Swoosh SFX */}
      <Sequence from={swooshFrame} durationInFrames={24} name="SFX: Swoosh">
        <Audio src={STATIC_ASSETS.WHOOSH_IN} volume={p.swooshVolume} />
      </Sequence>
    </AbsoluteFill>
  );
};
