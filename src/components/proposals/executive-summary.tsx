"use client";

import { Sparkles } from "lucide-react";
import { GlassCard } from "./glass-card";
import type { Analysis } from "./tab-meeting-brief";

interface ExecutiveSummaryProps {
  prospectName: string;
  companyName?: string;
  analysis?: Analysis;
}

export function ExecutiveSummary({
  prospectName,
  companyName,
  analysis,
}: ExecutiveSummaryProps) {
  const firstName = prospectName.split(" ")[0];

  let text: string;
  if (analysis?.summary) {
    const painRef =
      analysis.pain_points && analysis.pain_points.length > 0
        ? ` Entendemos los retos que enfrentas, especialmente en relación a ${analysis.pain_points[0].toLowerCase()}.`
        : "";
    const goalRef =
      analysis.kpi_goals && analysis.kpi_goals.length > 0
        ? ` Nuestro objetivo es ayudarte a alcanzar ${analysis.kpi_goals[0].toLowerCase()}.`
        : "";

    text = `${firstName}, hemos preparado esta propuesta basada en nuestra conversación.${painRef}${goalRef} A continuación encontrarás el plan que mejor se adapta a tus necesidades.`;
  } else {
    text = `${firstName}${companyName ? ` de ${companyName}` : ""}, hemos preparado esta propuesta personalizada para ti. Revisa los planes disponibles y selecciona el que mejor se adapte a tus objetivos de contenido digital.`;
  }

  return (
    <GlassCard highlight>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-[#2996d7]" />
        <h2 className="text-lg font-semibold text-zinc-100">
          Resumen Ejecutivo
        </h2>
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed">{text}</p>
    </GlassCard>
  );
}
