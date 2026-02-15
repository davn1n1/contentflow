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
export interface StatsCounterProps {
  // Content
  number: string;
  suffix?: string;
  label: string;
  sublabel?: string;

  // Colors
  bgColor?: string;
  numberColor?: string;
  labelColor?: string;
  accentColor?: string;

  // Timing
  countStartAt?: number;
  labelAt?: number;
  outroAt?: number;

  // Audio
  tickAt?: number;
  tickVolume?: number;
}

export const STATS_COUNTER_DEFAULTS: Required<StatsCounterProps> = {
  number: "10M",
  suffix: "+",
  label: "Visualizaciones",
  sublabel: "en los últimos 30 días",
  bgColor: "#0a0a1a",
  numberColor: "#ffffff",
  labelColor: "#8888aa",
  accentColor: "#6366f1",
  countStartAt: 0.3,
  labelAt: 1.0,
  outroAt: 3.2,
  tickAt: 0.3,
  tickVolume: 0.3,
};

// ─── Stats Counter Template ─────────────────────────────
// 4-second animated counter with rolling numbers, progress bar,
// and staggered label reveal. Great for data and metrics.

export const StatsCounter: React.FC<StatsCounterProps> = (props) => {
  const p = { ...STATS_COUNTER_DEFAULTS, ...props };
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const countStart = Math.round(fps * p.countStartAt);
  const labelFrame = Math.round(fps * p.labelAt);
  const outStart = Math.round(fps * p.outroAt);
  const totalFrames = Math.round(fps * 4);
  const tickFrame = Math.round(fps * p.tickAt);

  // ── Number reveal spring ──
  const numberSpring = spring({
    frame: Math.max(0, frame - countStart),
    fps,
    config: { damping: 16, stiffness: 100, mass: 0.6 },
  });

  // ── Digit scramble effect ──
  const scrambleProgress = interpolate(
    frame,
    [countStart, countStart + Math.round(fps * 0.8)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Build display string with scramble
  const displayNumber = React.useMemo(() => {
    if (scrambleProgress >= 1) return p.number + (p.suffix || "");
    const chars = p.number.split("");
    return chars
      .map((char, i) => {
        const charProgress = interpolate(
          scrambleProgress,
          [i / chars.length, (i + 1) / chars.length],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        if (charProgress >= 1) return char;
        if (/\d/.test(char)) return String(Math.floor(Math.random() * 10));
        return char;
      })
      .join("") + (scrambleProgress > 0.8 ? (p.suffix || "") : "");
  }, [p.number, p.suffix, scrambleProgress]);

  const numberScale = interpolate(numberSpring, [0, 1], [0.5, 1]);
  const numberOpacity = interpolate(numberSpring, [0, 1], [0, 1]);

  // ── Label fade ──
  const labelOpacity = interpolate(
    frame,
    [labelFrame, labelFrame + Math.round(fps * 0.4)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const labelY = interpolate(
    frame,
    [labelFrame, labelFrame + Math.round(fps * 0.4)],
    [15, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // ── Sublabel fade (staggered) ──
  const sublabelOpacity = interpolate(
    frame,
    [labelFrame + 8, labelFrame + 8 + Math.round(fps * 0.4)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // ── Progress bar ──
  const barProgress = interpolate(
    frame,
    [countStart + 5, countStart + Math.round(fps * 1.2)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // ── Background glow ──
  const glowOpacity = interpolate(
    frame,
    [countStart, countStart + 20, countStart + 40],
    [0, 0.6, 0.25],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // ── Outro ──
  const outProgress = interpolate(frame, [outStart, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const outOpacity = 1 - outProgress;
  const outScale = interpolate(outProgress, [0, 1], [1, 0.95]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: p.bgColor,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${p.accentColor}33 0%, transparent 70%)`,
          opacity: glowOpacity * outOpacity,
          filter: "blur(60px)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          opacity: outOpacity,
          transform: `scale(${outScale})`,
        }}
      >
        {/* Number */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            color: p.numberColor,
            fontFamily: "Inter, system-ui, sans-serif",
            opacity: numberOpacity,
            transform: `scale(${numberScale})`,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {displayNumber}
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: 300,
            height: 4,
            backgroundColor: `${p.accentColor}22`,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${barProgress * 100}%`,
              height: "100%",
              backgroundColor: p.accentColor,
              borderRadius: 2,
            }}
          />
        </div>

        {/* Label */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 600,
            color: p.labelColor,
            fontFamily: "Inter, system-ui, sans-serif",
            textTransform: "uppercase",
            letterSpacing: 3,
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
          }}
        >
          {p.label}
        </div>

        {/* Sublabel */}
        {p.sublabel && (
          <div
            style={{
              fontSize: 22,
              fontWeight: 300,
              color: `${p.labelColor}99`,
              fontFamily: "Inter, system-ui, sans-serif",
              opacity: sublabelOpacity,
            }}
          >
            {p.sublabel}
          </div>
        )}
      </div>

      {/* Tick SFX */}
      <Sequence from={tickFrame} durationInFrames={30} name="SFX: Tick">
        <Audio src={STATIC_ASSETS.WHOOSH_IN} volume={p.tickVolume} />
      </Sequence>
    </AbsoluteFill>
  );
};
