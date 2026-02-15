import React from "react";
import { AbsoluteFill } from "remotion";
import type { RemotionClip } from "../types";
import { TEMPLATES } from "../templates";

/**
 * TemplateClip — Renders a template composition inline.
 * Looks up the template by `clip.templateId` in the registry
 * and renders it with `clip.templateProps`.
 *
 * Audio FX are NOT rendered here — they live as separate audio clips
 * on the timeline, so the editor can drag/adjust them independently.
 */
export const TemplateClip: React.FC<{ clip: RemotionClip }> = ({ clip }) => {
  const templateId = clip.templateId;
  if (!templateId) return null;

  const template = TEMPLATES[templateId];
  if (!template) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#1a1a2e",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p style={{ color: "#ef4444", fontSize: 24, fontFamily: "monospace" }}>
          Template &quot;{templateId}&quot; not found
        </p>
      </AbsoluteFill>
    );
  }

  const Component = template.component;

  // Merge default props with clip's templateProps
  // Exclude timing/audio props — those come from audio clip positions on the timeline
  const props = {
    ...template.defaultProps,
    ...clip.templateProps,
  };

  return <Component {...props} />;
};
