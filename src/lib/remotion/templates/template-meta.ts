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
};
