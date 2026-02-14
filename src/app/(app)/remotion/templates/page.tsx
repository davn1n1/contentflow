"use client";

import { useState } from "react";
import { Player } from "@remotion/player";
import { templateList, type TemplateDefinition } from "@/lib/remotion/templates";
import { Play, Tag, Clock, Monitor } from "lucide-react";

export default function TemplatesPage() {
  const [selected, setSelected] = useState<TemplateDefinition>(templateList[0]);
  const [customProps, setCustomProps] = useState<Record<string, string>>(
    () => Object.fromEntries(
      Object.entries(templateList[0].defaultProps).map(([k, v]) => [k, String(v)])
    )
  );

  function selectTemplate(tpl: TemplateDefinition) {
    setSelected(tpl);
    setCustomProps(
      Object.fromEntries(
        Object.entries(tpl.defaultProps).map(([k, v]) => [k, String(v)])
      )
    );
  }

  const duration = (selected.durationInFrames / selected.fps).toFixed(1);

  // Build props for the player (convert string values back to original types)
  const playerProps: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(customProps)) {
    const defaultVal = selected.defaultProps[key];
    if (typeof defaultVal === "number") {
      playerProps[key] = Number(val) || 0;
    } else {
      playerProps[key] = val;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Remotion Templates</h1>
        <p className="text-sm text-muted-foreground">
          Plantillas de efectos programadas en React — preview en tiempo real
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Template list */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Templates ({templateList.length})
          </h2>
          {templateList.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => selectTemplate(tpl)}
              className={`w-full text-left rounded-lg border p-4 transition-colors ${
                selected.id === tpl.id
                  ? "border-primary bg-primary/5"
                  : "border-border/50 bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Play className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{tpl.name}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {tpl.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Center: Player preview */}
        <div className="lg:col-span-2 space-y-4">
          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              {selected.width}×{selected.height}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {duration}s
            </span>
            <span>{selected.fps} fps</span>
            <span className="font-mono text-primary/70">Template-{selected.id}</span>
          </div>

          {/* Player */}
          <div className="rounded-xl border border-border/50 bg-black overflow-hidden">
            <Player
              component={selected.component}
              inputProps={playerProps}
              durationInFrames={selected.durationInFrames}
              fps={selected.fps}
              compositionWidth={selected.width}
              compositionHeight={selected.height}
              style={{
                width: "100%",
                aspectRatio: `${selected.width} / ${selected.height}`,
                maxHeight: "70vh",
              }}
              controls
              loop
              autoPlay
            />
          </div>

          {/* Editable props */}
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <h3 className="text-sm font-medium">Parámetros</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(customProps).map(([key, value]) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground block mb-1">{key}</label>
                  {key.toLowerCase().includes("color") ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) =>
                          setCustomProps((p) => ({ ...p, [key]: e.target.value }))
                        }
                        className="h-8 w-8 rounded border border-border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          setCustomProps((p) => ({ ...p, [key]: e.target.value }))
                        }
                        className="flex-1 text-xs px-2 py-1.5 rounded-md bg-muted border border-border/50 text-foreground font-mono"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        setCustomProps((p) => ({ ...p, [key]: e.target.value }))
                      }
                      className="w-full text-xs px-2 py-1.5 rounded-md bg-muted border border-border/50 text-foreground"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
