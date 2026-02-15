import type React from "react";
import { TextReveal, TEXT_REVEAL_DEFAULTS, type TextRevealProps } from "./TextReveal";

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
};

export const templateList = Object.values(TEMPLATES);

export { TextReveal, TEXT_REVEAL_DEFAULTS };
export type { TextRevealProps };
