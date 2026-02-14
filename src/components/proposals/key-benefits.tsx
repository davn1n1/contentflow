"use client";

import { Zap, Brain, Globe, ShieldCheck } from "lucide-react";
import { GlassCard } from "./glass-card";

const BENEFITS = [
  {
    icon: Zap,
    title: "Producción 10x",
    description:
      "Produce 10 veces más contenido en el mismo tiempo que un equipo de producción tradicional.",
    gradient: "stat-gradient-1",
  },
  {
    icon: Brain,
    title: "IA Personalizada",
    description:
      "Inteligencia artificial entrenada en tu marca, tono y estilo visual para contenido auténtico.",
    gradient: "stat-gradient-2",
  },
  {
    icon: Globe,
    title: "Multi-Plataforma",
    description:
      "Contenido optimizado automáticamente para cada red social: Instagram, TikTok, YouTube y más.",
    gradient: "stat-gradient-3",
  },
  {
    icon: ShieldCheck,
    title: "ROI Garantizado",
    description:
      "Garantía de satisfacción de 30 días. Si no estás satisfecho, te devolvemos el 100%.",
    gradient: "stat-gradient-4",
  },
];

export function KeyBenefits() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-100">Beneficios Clave</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BENEFITS.map((benefit, i) => {
          const Icon = benefit.icon;
          return (
            <GlassCard key={i} className={`p-5 ${benefit.gradient}`}>
              <Icon className="w-6 h-6 text-[#2996d7] mb-3" />
              <h3 className="text-sm font-semibold text-zinc-100 mb-1">
                {benefit.title}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {benefit.description}
              </p>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
