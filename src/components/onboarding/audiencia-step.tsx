"use client";

import { useState } from "react";
import { OnboardingField, inputClassName, textareaClassName } from "./onboarding-field";
import { ArrowLeft } from "lucide-react";

interface AudienciaStepProps {
  initialData?: Record<string, unknown>;
  saving: boolean;
  onNext: (data: Record<string, unknown>) => void;
  onBack: () => void;
}

export function AudienciaStep({ initialData, saving, onNext, onBack }: AudienciaStepProps) {
  const [audiencia, setAudiencia] = useState((initialData?.Audiencia as string) || "");
  const [problema, setProblema] = useState((initialData?.Problema as string) || "");

  const canProceed = audiencia.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed) return;
    onNext({
      Audiencia: audiencia.trim(),
      Problema: problema.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-xl p-8">
      <h2 className="text-lg font-semibold text-foreground mb-1">Tu Audiencia</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Define a quien van dirigidos tus videos para personalizar el contenido y el tono.
      </p>

      <div className="space-y-5">
        <OnboardingField
          label="Audiencia objetivo"
          description="Describe el perfil de tu espectador ideal."
          required
        >
          <input
            type="text"
            value={audiencia}
            onChange={(e) => setAudiencia(e.target.value)}
            placeholder="Ej: Emprendedores digitales de 25-45 anos"
            className={inputClassName}
          />
        </OnboardingField>

        <OnboardingField
          label="Problema principal que resuelves"
          description="Cual es el dolor o necesidad que tu contenido aborda."
        >
          <textarea
            value={problema}
            onChange={(e) => setProblema(e.target.value)}
            placeholder="Ej: No saben como crear contenido de video de forma consistente y profesional..."
            rows={4}
            className={textareaClassName}
          />
        </OnboardingField>
      </div>

      <div className="flex justify-between mt-8">
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
          disabled={!canProceed || saving}
          className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Guardando..." : "Siguiente"}
        </button>
      </div>
    </form>
  );
}
