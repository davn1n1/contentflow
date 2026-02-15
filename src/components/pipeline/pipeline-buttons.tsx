"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTriggerPipeline } from "@/lib/hooks/use-pipeline";
import type { PipelineStep } from "@/types/database";
import {
  FileText,
  Headphones,
  Video as VideoIcon,
  Clapperboard,
  Loader2,
  Check,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

/** Minimal video shape needed by PipelineButtons */
interface PipelineVideo {
  status_copy: boolean;
  status_audio: boolean;
  status_avatares: boolean;
  status_rendering_video: boolean | string | null;
}

interface PipelineButtonsProps {
  video: PipelineVideo;
  recordId: string;
}

const steps: {
  key: PipelineStep;
  label: string;
  sublabel: string;
  icon: typeof FileText;
  action: string;
}[] = [
  {
    key: "copy",
    label: "Create Copy",
    sublabel: "AI Script Generation",
    icon: FileText,
    action: "GenerateCopy",
  },
  {
    key: "audio",
    label: "Create Audio",
    sublabel: "ElevenLabs + HeyGen",
    icon: Headphones,
    action: "GenerateAudio",
  },
  {
    key: "video",
    label: "Create Video",
    sublabel: "Full Video Generation",
    icon: VideoIcon,
    action: "GenerateFullVideo",
  },
  {
    key: "render",
    label: "Render Final",
    sublabel: "Shotstack + YouTube",
    icon: Clapperboard,
    action: "ProcesoFinalRender",
  },
];

function getStepStatus(video: PipelineVideo, step: PipelineStep): "completed" | "available" | "locked" {
  switch (step) {
    case "copy":
      return video.status_copy ? "completed" : "available";
    case "audio":
      return video.status_audio ? "completed" : video.status_copy ? "available" : "locked";
    case "video":
      return video.status_avatares ? "completed" : video.status_audio ? "available" : "locked";
    case "render":
      return video.status_rendering_video ? "completed" : video.status_avatares ? "available" : "locked";
    default:
      return "locked";
  }
}

export function PipelineButtons({ video, recordId }: PipelineButtonsProps) {
  const { mutate: trigger, isPending } = useTriggerPipeline();
  const [activeStep, setActiveStep] = useState<PipelineStep | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTrigger = (step: PipelineStep) => {
    setActiveStep(step);
    setError(null);
    trigger(
      { step, recordId },
      {
        onSuccess: () => {
          setActiveStep(null);
        },
        onError: (err) => {
          setError(err.message);
          setActiveStep(null);
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {steps.map((step, i) => {
          const status = getStepStatus(video, step.key);
          const isRunning = activeStep === step.key && isPending;

          return (
            <div key={step.key} className="flex items-center gap-3">
              <button
                onClick={() => handleTrigger(step.key)}
                disabled={status === "locked" || isRunning || (isPending && activeStep !== step.key)}
                className={cn(
                  "relative flex items-center gap-3 px-5 py-4 rounded-xl border transition-all min-w-[200px]",
                  status === "completed" &&
                    "bg-success/5 border-success/20 text-success",
                  status === "available" && !isRunning &&
                    "bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40 cursor-pointer",
                  status === "locked" &&
                    "bg-muted/50 border-border text-muted-foreground cursor-not-allowed opacity-50",
                  isRunning &&
                    "bg-primary/10 border-primary/40 text-primary pulse-glow"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    status === "completed" && "bg-success/10",
                    status === "available" && "bg-primary/10",
                    status === "locked" && "bg-muted"
                  )}
                >
                  {isRunning ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : status === "completed" ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">{step.label}</div>
                  <div className="text-xs opacity-70">{step.sublabel}</div>
                </div>

                {/* Step number */}
                <span
                  className={cn(
                    "absolute -top-2 -left-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center",
                    status === "completed" && "bg-success text-white",
                    status === "available" && "bg-primary text-white",
                    status === "locked" && "bg-muted text-muted-foreground border border-border"
                  )}
                >
                  {i + 1}
                </span>
              </button>

              {i < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-muted-foreground/30 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
