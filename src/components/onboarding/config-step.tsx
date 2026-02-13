"use client";

import { CheckCircle2, ArrowLeft } from "lucide-react";

interface ConfigStepProps {
  completedSteps?: Record<string, boolean>;
  saving: boolean;
  onComplete: (data: Record<string, unknown>) => void;
  onBack: () => void;
}

const STEP_LABELS: Record<string, string> = {
  brand: "Marca",
  persona: "Persona",
  voicedna: "VoiceDNA",
  audiencia: "Audiencia",
};

export function ConfigStep({ completedSteps, saving, onComplete, onBack }: ConfigStepProps) {
  const allDone = Object.keys(STEP_LABELS).every((key) => completedSteps?.[key]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ completed: true });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-xl p-8">
      <h2 className="text-lg font-semibold text-foreground mb-1">Resumen</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Revisa que todos los pasos estan completados antes de continuar.
      </p>

      <div className="space-y-3 mb-8">
        {Object.entries(STEP_LABELS).map(([key, label]) => {
          const done = completedSteps?.[key];
          return (
            <div
              key={key}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <CheckCircle2
                className={`w-5 h-5 flex-shrink-0 ${done ? "text-emerald-400" : "text-muted-foreground/30"}`}
              />
              <span className={`text-sm font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
              {done && (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-medium">
                  Completado
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!allDone && (
        <p className="text-sm text-amber-400 mb-6">
          Completa todos los pasos anteriores para finalizar la configuracion.
        </p>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Atras
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Finalizando..." : "Completar configuracion"}
        </button>
      </div>
    </form>
  );
}
