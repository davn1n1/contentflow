"use client";

import { Brain, Wand2, Eye, Rocket, Zap, Clock, BarChart3 } from "lucide-react";
import { GlassCard } from "./glass-card";

const STEPS = [
  {
    icon: Brain,
    title: "Análisis IA",
    description:
      "Analizamos tu marca, audiencia y objetivos con inteligencia artificial. Creamos una estrategia de contenido personalizada basada en datos.",
  },
  {
    icon: Wand2,
    title: "Creación Automatizada",
    description:
      "La IA genera guiones optimizados, crea audio profesional con clonación de voz y produce videos con avatares hiper-realistas.",
  },
  {
    icon: Eye,
    title: "Revisión y Aprobación",
    description:
      "Accede al editor visual para previsualizar cada pieza. Ajusta, edita y aprueba antes de publicar. Nada sale sin tu OK.",
  },
  {
    icon: Rocket,
    title: "Publicación Multi-Plataforma",
    description:
      "Tu contenido se optimiza y publica automáticamente en Instagram, TikTok, YouTube, LinkedIn y más. Todo desde un solo lugar.",
  },
];

const STATS = [
  {
    icon: Zap,
    value: "10x",
    label: "más contenido",
    description: "que un equipo tradicional",
  },
  {
    icon: Clock,
    value: "80%",
    label: "menos tiempo",
    description: "de producción",
  },
  {
    icon: BarChart3,
    value: "100%",
    label: "personalizado",
    description: "a tu marca y voz",
  },
];

export function TabHowItWorks() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-3">
          Revoluciona tu Contenido Digital con IA
        </h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          ContentFlow365 combina inteligencia artificial avanzada con producción
          automatizada para crear contenido de video profesional a escala.
        </p>
      </div>

      {/* Process Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[23px] top-8 bottom-8 w-px bg-gradient-to-b from-[#2996d7] via-[#2996d7]/50 to-transparent hidden md:block" />

        <div className="space-y-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex gap-5 items-start">
                {/* Step number */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-[#2996d7]/10 border border-[#2996d7]/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#2996d7]" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#2996d7] text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>

                {/* Content */}
                <GlassCard className="flex-1 p-5">
                  <h3 className="text-base font-semibold text-zinc-100 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </GlassCard>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <GlassCard
              key={i}
              className={`text-center p-6 stat-gradient-${i + 1}`}
            >
              <Icon className="w-6 h-6 text-[#2996d7] mx-auto mb-3" />
              <p className="text-3xl font-bold gradient-text">{stat.value}</p>
              <p className="text-sm font-medium text-zinc-200 mt-1">
                {stat.label}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {stat.description}
              </p>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
