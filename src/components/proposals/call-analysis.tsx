"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Target,
  Lightbulb,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";

interface Analysis {
  summary?: string;
  pain_points?: string[];
  desires?: string[];
  objections?: string[];
  kpi_goals?: string[];
  interest_score?: number;
  sentiment_score?: string;
  urgency_score?: number;
  next_step?: string;
}

export function CallAnalysis({ analysis }: { analysis: Analysis }) {
  const [expanded, setExpanded] = useState(false);

  if (!analysis?.summary) return null;

  const sentimentColor =
    analysis.sentiment_score === "positive"
      ? "text-emerald-400"
      : analysis.sentiment_score === "negative"
        ? "text-red-400"
        : "text-amber-400";

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0f0f19]/80 to-[#0a0a0f]/90 border border-white/5 p-6 mb-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#2996d7]" />
          <h2 className="text-lg font-semibold">Análisis de tu consulta</h2>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-zinc-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-zinc-400" />
        )}
      </button>

      {/* Summary always visible */}
      <p className="mt-3 text-zinc-300 leading-relaxed">{analysis.summary}</p>

      {/* Scores */}
      <div className="mt-4 flex flex-wrap gap-3">
        {analysis.interest_score != null && (
          <ScoreBadge label="Interés" value={analysis.interest_score} max={10} />
        )}
        {analysis.urgency_score != null && (
          <ScoreBadge label="Urgencia" value={analysis.urgency_score} max={10} />
        )}
        {analysis.sentiment_score && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border border-white/10 ${sentimentColor}`}
          >
            {analysis.sentiment_score === "positive"
              ? "Sentimiento positivo"
              : analysis.sentiment_score === "negative"
                ? "Sentimiento negativo"
                : "Sentimiento neutral"}
          </span>
        )}
      </div>

      {/* Expandable details */}
      {expanded && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {analysis.pain_points && analysis.pain_points.length > 0 && (
            <InsightList
              icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
              title="Puntos de dolor"
              items={analysis.pain_points}
            />
          )}
          {analysis.desires && analysis.desires.length > 0 && (
            <InsightList
              icon={<Lightbulb className="w-4 h-4 text-amber-400" />}
              title="Deseos"
              items={analysis.desires}
            />
          )}
          {analysis.kpi_goals && analysis.kpi_goals.length > 0 && (
            <InsightList
              icon={<Target className="w-4 h-4 text-emerald-400" />}
              title="Objetivos"
              items={analysis.kpi_goals}
            />
          )}
          {analysis.objections && analysis.objections.length > 0 && (
            <InsightList
              icon={<TrendingUp className="w-4 h-4 text-[#2996d7]" />}
              title="Preocupaciones"
              items={analysis.objections}
            />
          )}
          {analysis.next_step && (
            <div className="sm:col-span-2 mt-2 px-4 py-3 rounded-lg bg-[#2996d7]/5 border border-[#2996d7]/10">
              <p className="text-sm text-zinc-400">Siguiente paso recomendado</p>
              <p className="text-zinc-200 mt-1">{analysis.next_step}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreBadge({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = (value / max) * 100;
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 text-xs">
      <span className="text-zinc-400">{label}</span>
      <div className="w-12 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-medium text-zinc-200">
        {value}/{max}
      </span>
    </div>
  );
}

function InsightList({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-medium text-zinc-300">{title}</h3>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-zinc-400 flex gap-2">
            <span className="text-zinc-600 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
