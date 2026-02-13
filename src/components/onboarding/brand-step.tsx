"use client";

import { useState } from "react";
import { OnboardingField, inputClassName, textareaClassName, selectClassName } from "./onboarding-field";

const INDUSTRIAS = [
  "Marketing Digital",
  "Ecommerce",
  "SaaS / Tecnologia",
  "Coaching / Formacion",
  "Finanzas / Inversiones",
  "Salud / Bienestar",
  "Inmobiliario",
  "Agencia Creativa",
  "Consultoria",
  "Otro",
];

interface BrandStepProps {
  accountName: string;
  initialData?: Record<string, unknown>;
  saving: boolean;
  onNext: (data: Record<string, unknown>) => void;
}

export function BrandStep({ accountName, initialData, saving, onNext }: BrandStepProps) {
  const [name, setName] = useState((initialData?.Name as string) || accountName);
  const [industria, setIndustria] = useState((initialData?.Industria as string) || "");
  const [product, setProduct] = useState((initialData?.Product as string) || "");

  const canProceed = name.trim() && industria;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed) return;
    onNext({
      Name: name.trim(),
      Industria: [industria],
      Product: product.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-xl p-8">
      <h2 className="text-lg font-semibold text-foreground mb-1">Tu Marca</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Cuentanos sobre tu empresa para personalizar el contenido que crearemos.
      </p>

      <div className="space-y-5">
        <OnboardingField label="Nombre de empresa" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mi Empresa"
            className={inputClassName}
          />
        </OnboardingField>

        <OnboardingField label="Industria" required>
          <select
            value={industria}
            onChange={(e) => setIndustria(e.target.value)}
            className={selectClassName}
          >
            <option value="">Selecciona una industria</option>
            {INDUSTRIAS.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </OnboardingField>

        <OnboardingField
          label="Producto o servicio principal"
          description="Describe brevemente lo que ofreces a tus clientes."
        >
          <textarea
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Ej: Curso online de marketing digital para emprendedores..."
            rows={3}
            className={textareaClassName}
          />
        </OnboardingField>
      </div>

      <div className="flex justify-end mt-8">
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
