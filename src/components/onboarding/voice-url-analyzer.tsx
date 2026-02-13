"use client";

import { useState } from "react";
import { useAnalyzeVoice, type VoiceAnalysis } from "@/lib/hooks/use-onboarding";
import { inputClassName } from "./onboarding-field";
import { Sparkles, AlertCircle } from "lucide-react";

interface VoiceUrlAnalyzerProps {
  accountId: string;
  onAnalysisComplete: (analysis: VoiceAnalysis) => void;
}

export function VoiceUrlAnalyzer({ accountId, onAnalysisComplete }: VoiceUrlAnalyzerProps) {
  const [url, setUrl] = useState("");
  const analyze = useAnalyzeVoice();

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    try {
      const result = await analyze.mutateAsync({ url: url.trim(), accountId });
      onAnalysisComplete(result);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="mb-6 p-5 rounded-lg bg-muted/30 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          Analisis automatico con IA
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Pega una URL de YouTube o un articulo de blog y analizaremos tu estilo de comunicacion automaticamente.
      </p>

      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=... o https://tublog.com/articulo"
          className={inputClassName}
          disabled={analyze.isPending}
        />
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!url.trim() || analyze.isPending}
          className="px-4 py-2.5 bg-primary/20 hover:bg-primary/30 text-primary font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {analyze.isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analizando...
            </span>
          ) : (
            "Analizar"
          )}
        </button>
      </div>

      {analyze.isError && (
        <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{analyze.error.message}</span>
        </div>
      )}
    </div>
  );
}
