// ─── Template Metadata (server-safe) ─────────────────────
// This file contains ONLY data — no React imports.
// Safe to import from API routes and server-side code.
// The full TEMPLATES registry (with React components) is in index.ts.

import type { PropMeta, TemplateDefinition } from "./index";

// Re-export types for convenience
export type { PropMeta };

// Default props for text-reveal (duplicated here to avoid React import chain)
const TEXT_REVEAL_DEFAULTS = {
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

const TEXT_REVEAL_PROPS_META: PropMeta[] = [
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
];

/**
 * Server-safe template metadata — same shape as TemplateDefinition
 * but with `component: null` (no React import).
 */
export type TemplateMeta = Omit<TemplateDefinition, "component">;

// ── Bold Statement defaults ──
const BOLD_STATEMENT_DEFAULTS = {
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

const BOLD_STATEMENT_PROPS_META: PropMeta[] = [
  { key: "statement", label: "Frase", type: "text", group: "content" },
  { key: "tagline", label: "Tagline", type: "text", group: "content" },
  { key: "bgColor", label: "Fondo", type: "color", group: "colors" },
  { key: "statementColor", label: "Color frase", type: "color", group: "colors" },
  { key: "taglineColor", label: "Color tagline", type: "color", group: "colors" },
  { key: "glowColor", label: "Color glow", type: "color", group: "colors" },
  { key: "slamAt", label: "Slam", type: "timing", min: 0, max: 1, step: 0.05, group: "timing" },
  { key: "taglineAt", label: "Tagline entrada", type: "timing", min: 0.5, max: 2, step: 0.05, group: "timing" },
  { key: "outroAt", label: "Inicio outro", type: "timing", min: 1, max: 3.8, step: 0.05, group: "timing" },
  { key: "impactAt", label: "Impact SFX", type: "timing", min: 0, max: 1, step: 0.01, group: "audio" },
  { key: "impactVolume", label: "Vol. Impact", type: "volume", min: 0, max: 1, step: 0.05, group: "audio" },
];

// ── Stats Counter defaults ──
const STATS_COUNTER_DEFAULTS = {
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

const STATS_COUNTER_PROPS_META: PropMeta[] = [
  { key: "number", label: "Número", type: "text", group: "content" },
  { key: "suffix", label: "Sufijo", type: "text", group: "content" },
  { key: "label", label: "Label", type: "text", group: "content" },
  { key: "sublabel", label: "Sublabel", type: "text", group: "content" },
  { key: "bgColor", label: "Fondo", type: "color", group: "colors" },
  { key: "numberColor", label: "Color número", type: "color", group: "colors" },
  { key: "labelColor", label: "Color label", type: "color", group: "colors" },
  { key: "accentColor", label: "Color acento", type: "color", group: "colors" },
  { key: "countStartAt", label: "Inicio contador", type: "timing", min: 0, max: 1, step: 0.05, group: "timing" },
  { key: "labelAt", label: "Label entrada", type: "timing", min: 0.5, max: 2, step: 0.05, group: "timing" },
  { key: "outroAt", label: "Inicio outro", type: "timing", min: 1, max: 3.8, step: 0.05, group: "timing" },
  { key: "tickAt", label: "Tick SFX", type: "timing", min: 0, max: 1, step: 0.01, group: "audio" },
  { key: "tickVolume", label: "Vol. Tick", type: "volume", min: 0, max: 1, step: 0.05, group: "audio" },
];

// ── Lower Third defaults ──
const LOWER_THIRD_DEFAULTS = {
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

const LOWER_THIRD_PROPS_META: PropMeta[] = [
  { key: "name", label: "Nombre", type: "text", group: "content" },
  { key: "role", label: "Cargo", type: "text", group: "content" },
  { key: "bgColor", label: "Fondo", type: "color", group: "colors" },
  { key: "barColor", label: "Color barra", type: "color", group: "colors" },
  { key: "nameColor", label: "Color nombre", type: "color", group: "colors" },
  { key: "roleColor", label: "Color cargo", type: "color", group: "colors" },
  { key: "slideInAt", label: "Entrada", type: "timing", min: 0, max: 1, step: 0.05, group: "timing" },
  { key: "slideOutAt", label: "Salida", type: "timing", min: 1, max: 3.8, step: 0.05, group: "timing" },
  { key: "swooshAt", label: "Swoosh SFX", type: "timing", min: 0, max: 1, step: 0.01, group: "audio" },
  { key: "swooshVolume", label: "Vol. Swoosh", type: "volume", min: 0, max: 1, step: 0.05, group: "audio" },
];

export const TEMPLATE_META: Record<string, TemplateMeta> = {
  "text-reveal": {
    id: "text-reveal",
    name: "Text Reveal",
    description: "Animación de texto con spring, línea decorativa, partículas flotantes y audio FX sincronizado.",
    durationInFrames: 120,
    fps: 30,
    width: 1080,
    height: 1920,
    defaultProps: TEXT_REVEAL_DEFAULTS,
    propsMeta: TEXT_REVEAL_PROPS_META,
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
    defaultProps: BOLD_STATEMENT_DEFAULTS,
    propsMeta: BOLD_STATEMENT_PROPS_META,
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
    defaultProps: STATS_COUNTER_DEFAULTS,
    propsMeta: STATS_COUNTER_PROPS_META,
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
    defaultProps: LOWER_THIRD_DEFAULTS,
    propsMeta: LOWER_THIRD_PROPS_META,
    tags: ["text", "motion", "intro", "lower-third"],
  },
};
