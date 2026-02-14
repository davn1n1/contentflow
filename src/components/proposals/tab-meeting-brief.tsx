"use client";

import {
  AlertTriangle,
  Heart,
  Target,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Gauge,
  Smile,
} from "lucide-react";
import { GlassCard } from "./glass-card";
import { Badge } from "@/components/ui/badge";

export interface Analysis {
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

interface TabMeetingBriefProps {
  analysis: Analysis;
}

function ScoreBadge({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-4 py-2"
      style={{ backgroundColor: `${color}15`, border: `1px solid ${color}20` }}
    >
      <Icon className="w-4 h-4" style={{ color }} />
      <span className="text-xs text-zinc-400">{label}</span>
      <span className="text-sm font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function InsightList({
  title,
  items,
  icon: Icon,
  emptyText,
}: {
  title: string;
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
  emptyText: string;
}) {
  if (!items.length) return null;
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-[#2996d7]" />
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          {items.length}
        </Badge>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
            <span className="text-[#2996d7] mt-0.5 shrink-0">•</span>
            {item}
          </li>
        ))}
      </ul>
      {!items.length && (
        <p className="text-sm text-zinc-500 italic">{emptyText}</p>
      )}
    </GlassCard>
  );
}

export function TabMeetingBrief({ analysis }: TabMeetingBriefProps) {
  const sentimentLabel =
    analysis.sentiment_score === "positive"
      ? "Positivo"
      : analysis.sentiment_score === "negative"
        ? "Negativo"
        : "Neutral";

  const sentimentColor =
    analysis.sentiment_score === "positive"
      ? "#22c55e"
      : analysis.sentiment_score === "negative"
        ? "#ef4444"
        : "#f59e0b";

  return (
    <div className="space-y-6">
      {/* Summary */}
      {analysis.summary && (
        <GlassCard>
          <h2 className="text-lg font-semibold text-zinc-100 mb-3">Resumen</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {analysis.summary}
          </p>
        </GlassCard>
      )}

      {/* Scores */}
      <div className="flex flex-wrap gap-3">
        {analysis.interest_score != null && (
          <ScoreBadge
            label="Interés"
            value={`${analysis.interest_score}/10`}
            icon={TrendingUp}
            color="#2996d7"
          />
        )}
        {analysis.urgency_score != null && (
          <ScoreBadge
            label="Urgencia"
            value={`${analysis.urgency_score}/10`}
            icon={Gauge}
            color="#f59e0b"
          />
        )}
        {analysis.sentiment_score && (
          <ScoreBadge
            label="Sentimiento"
            value={sentimentLabel}
            icon={Smile}
            color={sentimentColor}
          />
        )}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InsightList
          title="Pain Points"
          items={analysis.pain_points || []}
          icon={AlertTriangle}
          emptyText="No se identificaron pain points"
        />
        <InsightList
          title="Objeciones"
          items={analysis.objections || []}
          icon={MessageSquare}
          emptyText="Sin objeciones registradas"
        />
        <InsightList
          title="Deseos"
          items={analysis.desires || []}
          icon={Heart}
          emptyText="No se identificaron deseos"
        />
        <InsightList
          title="KPIs y Objetivos"
          items={analysis.kpi_goals || []}
          icon={Target}
          emptyText="Sin KPIs identificados"
        />
      </div>

      {/* Next Steps */}
      {analysis.next_step && (
        <GlassCard
          className="border-[#2996d7]/20"
          highlight
        >
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="w-4 h-4 text-[#2996d7]" />
            <h3 className="text-sm font-semibold text-zinc-200">
              Próximos Pasos
            </h3>
          </div>
          <p className="text-sm text-zinc-300">{analysis.next_step}</p>
        </GlassCard>
      )}
    </div>
  );
}
