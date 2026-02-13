"use client";

import { Building2, User, Mic, Users, Settings, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "brand", label: "Tu Marca", icon: Building2 },
  { key: "persona", label: "Tu Persona", icon: User },
  { key: "voicedna", label: "Tu Voz", icon: Mic },
  { key: "audiencia", label: "Tu Audiencia", icon: Users },
  { key: "config", label: "Finalizar", icon: Settings },
] as const;

interface WizardProgressProps {
  currentStep: number;
  completedSteps?: Record<string, boolean>;
  onStepClick: (step: number) => void;
}

export function WizardProgress({
  currentStep,
  completedSteps,
  onStepClick,
}: WizardProgressProps) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => {
        const isCompleted = completedSteps?.[step.key];
        const isCurrent = i === currentStep;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center flex-1">
            <button
              onClick={() => onStepClick(i)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all w-full",
                isCurrent && "bg-primary/10 border border-primary/30",
                isCompleted && !isCurrent && "bg-emerald-500/10",
                !isCurrent && !isCompleted && "hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  isCurrent && "bg-primary text-primary-foreground",
                  isCompleted && !isCurrent && "bg-emerald-500 text-white",
                  !isCurrent && !isCompleted && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block",
                  isCurrent && "text-primary",
                  isCompleted && !isCurrent && "text-emerald-400",
                  !isCurrent && !isCompleted && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "w-6 h-px mx-1 shrink-0",
                  isCompleted ? "bg-emerald-500/50" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
