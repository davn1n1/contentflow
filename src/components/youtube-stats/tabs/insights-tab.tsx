"use client";

import { useMemo } from "react";
import type { YouTubeVideoStats } from "@/types/youtube";
import { formatNumber, formatDate, formatDuration } from "../utils";

interface InsightsTabProps {
  videos: YouTubeVideoStats[];
}

interface InsightCard {
  title: string;
  value: string;
  description: string;
  color: string;
}

export function InsightsTab({ videos }: InsightsTabProps) {
  const insights = useMemo(() => {
    if (videos.length === 0) return null;

    const sorted = [...videos].sort(
      (a, b) =>
        new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
    );

    // Best video
    const bestVideo = [...videos].sort((a, b) => b.views - a.views)[0];

    // Most engaged
    const mostEngaged = [...videos].sort(
      (a, b) => b.engagement - a.engagement
    )[0];

    // Recent performance (last 10 vs previous 10)
    const recent10 = sorted.slice(-10);
    const previous10 = sorted.slice(-20, -10);
    const recentAvgViews =
      recent10.length > 0
        ? recent10.reduce((a, v) => a + v.views, 0) / recent10.length
        : 0;
    const previousAvgViews =
      previous10.length > 0
        ? previous10.reduce((a, v) => a + v.views, 0) / previous10.length
        : 0;
    const viewsTrend =
      previousAvgViews > 0
        ? ((recentAvgViews - previousAvgViews) / previousAvgViews) * 100
        : 0;

    // Publish frequency
    const firstDate = new Date(sorted[0].publishedAt);
    const lastDate = new Date(sorted[sorted.length - 1].publishedAt);
    const monthsSpan =
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const videosPerMonth = monthsSpan > 0 ? videos.length / monthsSpan : 0;

    // Best day of week
    const dayStats: Record<number, { views: number; count: number }> = {};
    for (const v of videos) {
      const day = new Date(v.publishedAt).getDay();
      if (!dayStats[day]) dayStats[day] = { views: 0, count: 0 };
      dayStats[day].views += v.views;
      dayStats[day].count++;
    }
    const dayNames = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miercoles",
      "Jueves",
      "Viernes",
      "Sabado",
    ];
    let bestDay = 0;
    let bestDayAvg = 0;
    for (const [day, stat] of Object.entries(dayStats)) {
      const avg = stat.views / stat.count;
      if (avg > bestDayAvg) {
        bestDayAvg = avg;
        bestDay = Number(day);
      }
    }

    // Best duration range
    const durationRanges = [
      { label: "< 5 min", min: 0, max: 300 },
      { label: "5-10 min", min: 300, max: 600 },
      { label: "10-20 min", min: 600, max: 1200 },
      { label: "20-30 min", min: 1200, max: 1800 },
      { label: "30+ min", min: 1800, max: Infinity },
    ];
    let bestRange = durationRanges[0];
    let bestRangeAvg = 0;
    for (const r of durationRanges) {
      const inRange = videos.filter(
        (v) => v.duration >= r.min && v.duration < r.max
      );
      if (inRange.length >= 3) {
        const avg = inRange.reduce((a, v) => a + v.views, 0) / inRange.length;
        if (avg > bestRangeAvg) {
          bestRangeAvg = avg;
          bestRange = r;
        }
      }
    }

    // Avg title length of top performers
    const topPerformers = [...videos]
      .sort((a, b) => b.views - a.views)
      .slice(0, Math.ceil(videos.length * 0.2));
    const avgTitleLengthTop =
      topPerformers.length > 0
        ? Math.round(
            topPerformers.reduce((a, v) => a + v.title.length, 0) /
              topPerformers.length
          )
        : 0;

    // Engagement trend
    const recentEngagement =
      recent10.length > 0
        ? recent10.reduce((a, v) => a + v.engagement, 0) / recent10.length
        : 0;
    const previousEngagement =
      previous10.length > 0
        ? previous10.reduce((a, v) => a + v.engagement, 0) / previous10.length
        : 0;

    return {
      bestVideo,
      mostEngaged,
      recentAvgViews,
      viewsTrend,
      videosPerMonth,
      bestDay,
      bestDayAvg,
      bestRange,
      bestRangeAvg,
      avgTitleLengthTop,
      recentEngagement,
      previousEngagement,
    };
  }, [videos]);

  const cards = useMemo<InsightCard[]>(() => {
    if (!insights) return [];
    return [
      {
        title: "Video Estrella",
        value: formatNumber(insights.bestVideo.views) + " views",
        description: insights.bestVideo.title,
        color: "#ff2d55",
      },
      {
        title: "Mayor Engagement",
        value: insights.mostEngaged.engagement.toFixed(2) + "%",
        description: insights.mostEngaged.title,
        color: "#30d158",
      },
      {
        title: "Tendencia Views",
        value:
          (insights.viewsTrend >= 0 ? "+" : "") +
          insights.viewsTrend.toFixed(1) +
          "%",
        description: `Ultimos 10 videos vs anteriores 10 (${formatNumber(Math.round(insights.recentAvgViews))} avg)`,
        color: insights.viewsTrend >= 0 ? "#30d158" : "#ff2d55",
      },
      {
        title: "Frecuencia Publicacion",
        value: insights.videosPerMonth.toFixed(1) + " / mes",
        description: `${videos.length} videos analizados`,
        color: "#0a84ff",
      },
      {
        title: "Mejor Dia para Publicar",
        value:
          ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"][insights.bestDay],
        description: `Promedio ${formatNumber(Math.round(insights.bestDayAvg))} views`,
        color: "#bf5af2",
      },
      {
        title: "Duracion Optima",
        value: insights.bestRange.label,
        description: `Promedio ${formatNumber(Math.round(insights.bestRangeAvg))} views (min 3 videos)`,
        color: "#ff9f0a",
      },
      {
        title: "Titulo Optimo",
        value: insights.avgTitleLengthTop + " caracteres",
        description: "Longitud promedio del top 20% de videos",
        color: "#64d2ff",
      },
      {
        title: "Engagement Reciente",
        value: insights.recentEngagement.toFixed(2) + "%",
        description:
          insights.recentEngagement > insights.previousEngagement
            ? "Mejorando vs periodo anterior"
            : "Bajando vs periodo anterior",
        color:
          insights.recentEngagement >= insights.previousEngagement
            ? "#30d158"
            : "#ff9f0a",
      },
    ];
  }, [insights, videos.length]);

  // Executive summary
  const summary = useMemo(() => {
    if (!insights) return [];

    const lines: string[] = [];

    // Channel size context
    const totalViews = videos.reduce((a, v) => a + v.views, 0);
    const avgViews = totalViews / videos.length;
    lines.push(
      `Canal con ${videos.length} videos analizados y ${formatNumber(totalViews)} views totales (promedio ${formatNumber(Math.round(avgViews))} por video).`
    );

    // Trend
    if (insights.viewsTrend > 10) {
      lines.push(
        `Tendencia positiva: los ultimos 10 videos tienen un ${insights.viewsTrend.toFixed(0)}% mas views que los anteriores.`
      );
    } else if (insights.viewsTrend < -10) {
      lines.push(
        `Atencion: los ultimos 10 videos tienen un ${Math.abs(insights.viewsTrend).toFixed(0)}% menos views. Considera experimentar con nuevos formatos.`
      );
    } else {
      lines.push(
        "Las views se mantienen estables en los ultimos videos."
      );
    }

    // Best day
    lines.push(
      `El mejor dia para publicar es ${["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"][insights.bestDay]} con promedio de ${formatNumber(Math.round(insights.bestDayAvg))} views.`
    );

    // Duration
    lines.push(
      `Los videos de ${insights.bestRange.label} son los que mejor rinden con ${formatNumber(Math.round(insights.bestRangeAvg))} views promedio.`
    );

    // Title
    lines.push(
      `Los titulos del top 20% tienen una media de ${insights.avgTitleLengthTop} caracteres.`
    );

    // Frequency
    if (insights.videosPerMonth < 2) {
      lines.push(
        `Frecuencia de publicacion baja (${insights.videosPerMonth.toFixed(1)}/mes). Publicar mas frecuentemente puede mejorar el algoritmo.`
      );
    } else if (insights.videosPerMonth > 8) {
      lines.push(
        `Alta frecuencia de publicacion (${insights.videosPerMonth.toFixed(1)}/mes). Asegurate de mantener calidad.`
      );
    } else {
      lines.push(
        `Buena frecuencia de publicacion: ${insights.videosPerMonth.toFixed(1)} videos al mes.`
      );
    }

    return lines;
  }, [insights, videos]);

  if (!insights || videos.length === 0) {
    return (
      <div className="glass-card rounded-xl border border-border p-8 text-center text-muted-foreground">
        No hay suficientes datos para generar insights.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Insight cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="glass-card rounded-xl border border-border p-4 relative overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 w-full h-1"
              style={{ backgroundColor: card.color }}
            />
            <p className="text-xs text-muted-foreground font-medium mt-1">
              {card.title}
            </p>
            <p
              className="text-2xl font-bold mt-1"
              style={{ color: card.color }}
            >
              {card.value}
            </p>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* Executive summary */}
      <div className="glass-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Resumen Ejecutivo
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Analisis automatico basado en los datos del canal
        </p>
        <div className="space-y-3">
          {summary.map((line, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-xs text-muted-foreground/50 font-mono mt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {line}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top performer details */}
      <div className="glass-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Video Destacado
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          El video con mas visualizaciones del canal
        </p>
        <div className="flex items-start gap-4">
          <img
            src={insights.bestVideo.thumbnail}
            alt={insights.bestVideo.title}
            className="w-40 h-24 rounded-lg object-cover flex-shrink-0"
          />
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">
              {insights.bestVideo.title}
            </h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{formatNumber(insights.bestVideo.views)} views</span>
              <span>{formatNumber(insights.bestVideo.likes)} likes</span>
              <span>
                {formatNumber(insights.bestVideo.comments)} comentarios
              </span>
              <span>{formatDuration(insights.bestVideo.duration)}</span>
              <span>{formatDate(insights.bestVideo.publishedAt)}</span>
              <span>
                Engagement: {insights.bestVideo.engagement.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
