import type React from "react";
import { TextReveal, type TextRevealProps } from "./TextReveal";

// ─── Template Registry ──────────────────────────────────
// Each template is a React component with typed props.
// The registry maps template IDs to their metadata + component.

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
  tags: string[];
}

export const TEMPLATES: Record<string, TemplateDefinition> = {
  "text-reveal": {
    id: "text-reveal",
    name: "Text Reveal",
    description: "Animación de texto con spring, línea decorativa y partículas flotantes. 4 segundos.",
    durationInFrames: 120, // 4s @ 30fps
    fps: 30,
    width: 1080,
    height: 1920,
    component: TextReveal,
    defaultProps: {
      title: "Tu Título Aquí",
      subtitle: "Subtítulo opcional",
      bgColor: "#0a0a0a",
      accentColor: "#3b82f6",
      textColor: "#ffffff",
    } satisfies TextRevealProps,
    tags: ["text", "motion", "intro", "hook"],
  },
};

export const templateList = Object.values(TEMPLATES);

export { TextReveal };
export type { TextRevealProps };
