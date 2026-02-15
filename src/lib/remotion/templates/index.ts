import type React from "react";
import { TextReveal, TEXT_REVEAL_DEFAULTS, type TextRevealProps } from "./TextReveal";
import { BoldStatement, BOLD_STATEMENT_DEFAULTS, type BoldStatementProps } from "./BoldStatement";
import { StatsCounter, STATS_COUNTER_DEFAULTS, type StatsCounterProps } from "./StatsCounter";
import { LowerThird, LOWER_THIRD_DEFAULTS, type LowerThirdProps } from "./LowerThird";

// ─── Template Registry ──────────────────────────────────
// Each template is a React component with typed props.
// The registry maps template IDs to their metadata + component.

// Prop metadata for the editor UI
export type PropType = "text" | "color" | "timing" | "volume";

export interface PropMeta {
  key: string;
  label: string;
  type: PropType;
  min?: number;
  max?: number;
  step?: number;
  group: "content" | "colors" | "timing" | "audio";
}

export interface TemplateDefinition<P = Record<string, unknown>> {
  id: string;
  name: string;
  description: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.FC<any>;
  defaultProps: P;
  propsMeta: PropMeta[];
  tags: string[];
}

export const TEMPLATES: Record<string, TemplateDefinition> = {
  "text-reveal": {
    id: "text-reveal",
    name: "Text Reveal",
    description: "Animación de texto con spring, línea decorativa, partículas flotantes y audio FX sincronizado.",
    durationInFrames: 120,
    fps: 30,
    width: 1080,
    height: 1920,
    component: TextReveal,
    defaultProps: TEXT_REVEAL_DEFAULTS,
    propsMeta: [
      // Content
      { key: "title", label: "Título", type: "text", group: "content" },
      { key: "subtitle", label: "Subtítulo", type: "text", group: "content" },
      // Colors
      { key: "bgColor", label: "Fondo", type: "color", group: "colors" },
      { key: "accentColor", label: "Acento", type: "color", group: "colors" },
      { key: "textColor", label: "Texto", type: "color", group: "colors" },
      // Timing
      { key: "titleEntryAt", label: "Entrada título", type: "timing", min: 0, max: 2, step: 0.05, group: "timing" },
      { key: "subtitleEntryAt", label: "Entrada subtítulo", type: "timing", min: 0, max: 2, step: 0.05, group: "timing" },
      { key: "lineDrawAt", label: "Línea decorativa", type: "timing", min: 0, max: 3, step: 0.05, group: "timing" },
      { key: "outroAt", label: "Inicio outro", type: "timing", min: 1, max: 3.8, step: 0.05, group: "timing" },
      // Audio
      { key: "whooshInAt", label: "Whoosh IN", type: "timing", min: 0, max: 2, step: 0.01, group: "audio" },
      { key: "whooshInVolume", label: "Vol. Whoosh IN", type: "volume", min: 0, max: 1, step: 0.05, group: "audio" },
      { key: "whooshOutAt", label: "Whoosh OUT", type: "timing", min: 1, max: 3.9, step: 0.01, group: "audio" },
      { key: "whooshOutVolume", label: "Vol. Whoosh OUT", type: "volume", min: 0, max: 1, step: 0.05, group: "audio" },
    ],
    tags: ["text", "motion", "intro", "hook"],
  },

  "bold-statement": {
    id: "bold-statement",
    name: "Bold Statement",
    description: "Texto dramático con efecto slam, glow pulsante y shake de cámara. Ideal para hooks y CTAs.",
    durationInFrames: 120,
    fps: 30,
    width: 1080,
    height: 1920,
    component: BoldStatement,
    defaultProps: BOLD_STATEMENT_DEFAULTS,
    propsMeta: [
      // Content
      { key: "statement", label: "Frase", type: "text", group: "content" },
      { key: "tagline", label: "Tagline", type: "text", group: "content" },
      // Colors
      { key: "bgColor", label: "Fondo", type: "color", group: "colors" },
      { key: "statementColor", label: "Color frase", type: "color", group: "colors" },
      { key: "taglineColor", label: "Color tagline", type: "color", group: "colors" },
      { key: "glowColor", label: "Color glow", type: "color", group: "colors" },
      // Timing
      { key: "slamAt", label: "Slam", type: "timing", min: 0, max: 1, step: 0.05, group: "timing" },
      { key: "taglineAt", label: "Tagline entrada", type: "timing", min: 0.5, max: 2, step: 0.05, group: "timing" },
      { key: "outroAt", label: "Inicio outro", type: "timing", min: 1, max: 3.8, step: 0.05, group: "timing" },
      // Audio
      { key: "impactAt", label: "Impact SFX", type: "timing", min: 0, max: 1, step: 0.01, group: "audio" },
      { key: "impactVolume", label: "Vol. Impact", type: "volume", min: 0, max: 1, step: 0.05, group: "audio" },
    ],
    tags: ["text", "motion", "hook", "cta"],
  },

  "stats-counter": {
    id: "stats-counter",
    name: "Stats Counter",
    description: "Contador animado con números scramble, barra de progreso y labels escalonados. Para datos y métricas.",
    durationInFrames: 120,
    fps: 30,
    width: 1080,
    height: 1920,
    component: StatsCounter,
    defaultProps: STATS_COUNTER_DEFAULTS,
    propsMeta: [
      // Content
      { key: "number", label: "Número", type: "text", group: "content" },
      { key: "suffix", label: "Sufijo", type: "text", group: "content" },
      { key: "label", label: "Label", type: "text", group: "content" },
      { key: "sublabel", label: "Sublabel", type: "text", group: "content" },
      // Colors
      { key: "bgColor", label: "Fondo", type: "color", group: "colors" },
      { key: "numberColor", label: "Color número", type: "color", group: "colors" },
      { key: "labelColor", label: "Color label", type: "color", group: "colors" },
      { key: "accentColor", label: "Color acento", type: "color", group: "colors" },
      // Timing
      { key: "countStartAt", label: "Inicio contador", type: "timing", min: 0, max: 1, step: 0.05, group: "timing" },
      { key: "labelAt", label: "Label entrada", type: "timing", min: 0.5, max: 2, step: 0.05, group: "timing" },
      { key: "outroAt", label: "Inicio outro", type: "timing", min: 1, max: 3.8, step: 0.05, group: "timing" },
      // Audio
      { key: "tickAt", label: "Tick SFX", type: "timing", min: 0, max: 1, step: 0.01, group: "audio" },
      { key: "tickVolume", label: "Vol. Tick", type: "volume", min: 0, max: 1, step: 0.05, group: "audio" },
    ],
    tags: ["data", "motion", "stats"],
  },

  "lower-third": {
    id: "lower-third",
    name: "Lower Third",
    description: "Tarjeta de nombre animada con barra de acento y slide lateral. Para intros de speaker.",
    durationInFrames: 120,
    fps: 30,
    width: 1080,
    height: 1920,
    component: LowerThird,
    defaultProps: LOWER_THIRD_DEFAULTS,
    propsMeta: [
      // Content
      { key: "name", label: "Nombre", type: "text", group: "content" },
      { key: "role", label: "Cargo", type: "text", group: "content" },
      // Colors
      { key: "bgColor", label: "Fondo", type: "color", group: "colors" },
      { key: "barColor", label: "Color barra", type: "color", group: "colors" },
      { key: "nameColor", label: "Color nombre", type: "color", group: "colors" },
      { key: "roleColor", label: "Color cargo", type: "color", group: "colors" },
      // Timing
      { key: "slideInAt", label: "Entrada", type: "timing", min: 0, max: 1, step: 0.05, group: "timing" },
      { key: "slideOutAt", label: "Salida", type: "timing", min: 1, max: 3.8, step: 0.05, group: "timing" },
      // Audio
      { key: "swooshAt", label: "Swoosh SFX", type: "timing", min: 0, max: 1, step: 0.01, group: "audio" },
      { key: "swooshVolume", label: "Vol. Swoosh", type: "volume", min: 0, max: 1, step: 0.05, group: "audio" },
    ],
    tags: ["text", "motion", "intro", "lower-third"],
  },
};

export const templateList = Object.values(TEMPLATES);

export { TextReveal, TEXT_REVEAL_DEFAULTS };
export type { TextRevealProps };
export { BoldStatement, BOLD_STATEMENT_DEFAULTS };
export type { BoldStatementProps };
export { StatsCounter, STATS_COUNTER_DEFAULTS };
export type { StatsCounterProps };
export { LowerThird, LOWER_THIRD_DEFAULTS };
export type { LowerThirdProps };
