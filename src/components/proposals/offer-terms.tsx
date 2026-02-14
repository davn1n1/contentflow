"use client";

import { Calendar, Shield, Check } from "lucide-react";
import { GlassCard } from "./glass-card";

interface OfferTermsProps {
  expiresAt?: string;
}

export function OfferTerms({ expiresAt }: OfferTermsProps) {
  const expiresDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const terms = [
    {
      icon: Calendar,
      text: expiresDate
        ? `Oferta válida hasta el ${expiresDate}`
        : "Oferta por tiempo limitado",
    },
    {
      icon: Shield,
      text: "Sin compromiso de permanencia — cancela cuando quieras",
    },
    {
      icon: Check,
      text: "Garantía de satisfacción 30 días — devolución completa",
    },
  ];

  return (
    <GlassCard className="p-5">
      <h3 className="text-sm font-semibold text-zinc-200 mb-4">
        Términos de la Oferta
      </h3>
      <div className="space-y-3">
        {terms.map((term, i) => {
          const Icon = term.icon;
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#2996d7]/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#2996d7]" />
              </div>
              <span className="text-sm text-zinc-400">{term.text}</span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
