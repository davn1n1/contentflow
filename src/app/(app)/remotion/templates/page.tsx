"use client";

import { useState, useCallback, useRef } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import {
  templateList,
  type TemplateDefinition,
  type PropMeta,
} from "@/lib/remotion/templates";
import {
  Play,
  Tag,
  Clock,
  Monitor,
  Type,
  Palette,
  Timer,
  Volume2,
  RotateCcw,
} from "lucide-react";

// Group labels + icons
const GROUP_CONFIG = {
  content: { label: "Contenido", icon: Type },
  colors: { label: "Colores", icon: Palette },
  timing: { label: "Timing", icon: Timer },
  audio: { label: "Audio FX", icon: Volume2 },
} as const;

type GroupKey = keyof typeof GROUP_CONFIG;

export default function TemplatesPage() {
  const [selected, setSelected] = useState<TemplateDefinition>(templateList[0]);
  const playerRef = useRef<PlayerRef>(null);

  // Props state — keyed by prop name, always number | string
  const [customProps, setCustomProps] = useState<Record<string, number | string>>(
    () => ({ ...selected.defaultProps } as Record<string, number | string>)
  );

  function selectTemplate(tpl: TemplateDefinition) {
    setSelected(tpl);
    setCustomProps({ ...tpl.defaultProps } as Record<string, number | string>);
  }

  function resetToDefaults() {
    setCustomProps({ ...selected.defaultProps } as Record<string, number | string>);
  }

  const updateProp = useCallback((key: string, value: number | string) => {
    setCustomProps((prev) => ({ ...prev, [key]: value }));
  }, []);

  const duration = (selected.durationInFrames / selected.fps).toFixed(1);

  // Group propsMeta by group
  const groups = selected.propsMeta.reduce<Record<GroupKey, PropMeta[]>>(
    (acc, meta) => {
      if (!acc[meta.group]) acc[meta.group] = [];
      acc[meta.group].push(meta);
      return acc;
    },
    { content: [], colors: [], timing: [], audio: [] }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Remotion Templates</h1>
        <p className="text-sm text-muted-foreground">
          Editor visual de plantillas — ajusta timing y audio frame a frame
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Template list */}
        <div className="lg:col-span-3 space-y-3">
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
              <div className="flex gap-1.5 mt-2 flex-wrap">
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
        <div className="lg:col-span-5 space-y-4">
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
          </div>

          {/* Player */}
          <div className="rounded-xl border border-border/50 bg-black overflow-hidden">
            <Player
              ref={playerRef}
              component={selected.component}
              inputProps={customProps}
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
        </div>

        {/* Right: Editable props grouped */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Parámetros</h2>
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>

          {(Object.keys(GROUP_CONFIG) as GroupKey[]).map((groupKey) => {
            const metas = groups[groupKey];
            if (!metas || metas.length === 0) return null;
            const cfg = GROUP_CONFIG[groupKey];
            const Icon = cfg.icon;

            return (
              <div key={groupKey} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {cfg.label}
                </h3>

                <div className="space-y-3">
                  {metas.map((meta) => (
                    <PropEditor
                      key={meta.key}
                      meta={meta}
                      value={customProps[meta.key]}
                      onChange={updateProp}
                      fps={selected.fps}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Prop Editor Component ──────────────────────────────
function PropEditor({
  meta,
  value,
  onChange,
  fps,
}: {
  meta: PropMeta;
  value: number | string;
  onChange: (key: string, value: number | string) => void;
  fps: number;
}) {
  if (meta.type === "color") {
    return (
      <div>
        <label className="text-xs text-muted-foreground block mb-1">{meta.label}</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={String(value)}
            onChange={(e) => onChange(meta.key, e.target.value)}
            className="h-8 w-8 rounded border border-border cursor-pointer flex-shrink-0"
          />
          <input
            type="text"
            value={String(value)}
            onChange={(e) => onChange(meta.key, e.target.value)}
            className="flex-1 text-xs px-2 py-1.5 rounded-md bg-muted border border-border/50 text-foreground font-mono"
          />
        </div>
      </div>
    );
  }

  if (meta.type === "text") {
    return (
      <div>
        <label className="text-xs text-muted-foreground block mb-1">{meta.label}</label>
        <input
          type="text"
          value={String(value)}
          onChange={(e) => onChange(meta.key, e.target.value)}
          className="w-full text-xs px-2 py-1.5 rounded-md bg-muted border border-border/50 text-foreground"
        />
      </div>
    );
  }

  if (meta.type === "timing") {
    const numVal = Number(value) || 0;
    const frameVal = Math.round(numVal * fps);
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-muted-foreground">{meta.label}</label>
          <span className="text-[10px] font-mono text-muted-foreground">
            {numVal.toFixed(2)}s · frame {frameVal}
          </span>
        </div>
        <input
          type="range"
          min={meta.min ?? 0}
          max={meta.max ?? 4}
          step={meta.step ?? 0.01}
          value={numVal}
          onChange={(e) => onChange(meta.key, Number(e.target.value))}
          className="w-full h-1.5 accent-primary cursor-pointer"
        />
      </div>
    );
  }

  if (meta.type === "volume") {
    const numVal = Number(value) || 0;
    const pct = Math.round(numVal * 100);
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-muted-foreground">{meta.label}</label>
          <span className="text-[10px] font-mono text-muted-foreground">{pct}%</span>
        </div>
        <input
          type="range"
          min={meta.min ?? 0}
          max={meta.max ?? 1}
          step={meta.step ?? 0.05}
          value={numVal}
          onChange={(e) => onChange(meta.key, Number(e.target.value))}
          className="w-full h-1.5 accent-amber-400 cursor-pointer"
        />
      </div>
    );
  }

  return null;
}
