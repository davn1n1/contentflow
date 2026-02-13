"use client";

import { useState } from "react";
import { OnboardingField, inputClassName, textareaClassName, selectClassName } from "./onboarding-field";
import { ArrowLeft } from "lucide-react";

interface PersonaStepProps {
  initialData?: Record<string, unknown>;
  saving: boolean;
  onNext: (data: Record<string, unknown>) => void;
  onBack: () => void;
}

export function PersonaStep({ initialData, saving, onNext, onBack }: PersonaStepProps) {
  const [name, setName] = useState((initialData?.Name as string) || "");
  const [descripcion, setDescripcion] = useState(
    (initialData?.["Descripción Persona"] as string) || ""
  );
  const [sexo, setSexo] = useState((initialData?.Sexo as string) || "");

  const canProceed = name.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed) return;
    onNext({
      Name: name.trim(),
      "Descripción Persona": descripcion.trim(),
      ...(sexo && { Sexo: sexo }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-xl p-8">
      <h2 className="text-lg font-semibold text-foreground mb-1">Tu Persona</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Define quien sera la cara visible de tu contenido. Esta persona representara tu marca en los videos.
      </p>

      <div className="space-y-5">
        <OnboardingField
          label="Nombre de la persona"
          description="Puede ser tu nombre real o un nombre de marca."
          required
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: David Aranzabal"
            className={inputClassName}
          />
        </OnboardingField>

        <OnboardingField
          label="Descripcion"
          description="Describe brevemente a esta persona: su rol, experiencia, o estilo de comunicacion."
        >
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Experto en marketing digital con 10 anos de experiencia. Estilo cercano y practico..."
            rows={4}
            className={textareaClassName}
          />
        </OnboardingField>

        <OnboardingField label="Genero">
          <select
            value={sexo}
            onChange={(e) => setSexo(e.target.value)}
            className={selectClassName}
          >
            <option value="">Seleccionar</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="No binario">No binario</option>
          </select>
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
