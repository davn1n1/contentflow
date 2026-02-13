"use client";

import { useState } from "react";
import { OnboardingField, inputClassName, textareaClassName, selectClassName } from "./onboarding-field";
import { VoiceUrlAnalyzer } from "./voice-url-analyzer";
import { ArrowLeft } from "lucide-react";
import type { VoiceAnalysis } from "@/lib/hooks/use-onboarding";

const TONES = ["Profesional", "Casual", "Inspiracional", "Educativo", "Motivacional", "Amigable", "Autoritario"];
const STYLES = ["Narrativo", "Conversacional", "Tecnico", "Divulgativo", "Persuasivo", "Storytelling"];
const VOCAB_LEVELS = ["Basico", "Intermedio", "Avanzado", "Tecnico"];
const PERSPECTIVES = ["Primera persona (yo)", "Segunda persona (tu)", "Tercera persona"];
const TYPES = ["Experto", "Mentor", "Amigo", "Reportero", "Influencer", "Profesor"];

interface VoiceDNAStepProps {
  accountId: string;
  initialData?: Record<string, unknown>;
  saving: boolean;
  onNext: (data: Record<string, unknown>) => void;
  onBack: () => void;
}

export function VoiceDNAStep({ accountId, initialData, saving, onNext, onBack }: VoiceDNAStepProps) {
  const [voicename, setVoicename] = useState((initialData?.VoiceName as string) || "");
  const [tone, setTone] = useState((initialData?.Tone as string) || "");
  const [style, setStyle] = useState((initialData?.Style as string) || "");
  const [vocabulary, setVocabulary] = useState((initialData?.VocabularyLevel as string) || "");
  const [perspective, setPerspective] = useState((initialData?.NarrativePerspective as string) || "");
  const [generalType, setGeneralType] = useState((initialData?.GeneralType as string) || "");
  const [instructions, setInstructions] = useState((initialData?.["Custom AI Instructions"] as string) || "");
  const [analyzed, setAnalyzed] = useState(false);

  const canProceed = voicename.trim() && tone;

  const handleAnalysisComplete = (analysis: VoiceAnalysis) => {
    const a = analysis.analysis;
    if (a.voicename) setVoicename(a.voicename);
    if (a.tone) setTone(a.tone);
    if (a.style) setStyle(a.style);
    if (a.vocabularylevel) setVocabulary(a.vocabularylevel);
    if (a.narrativeperspective) setPerspective(a.narrativeperspective);
    if (a.generaltype) setGeneralType(a.generaltype);
    if (a.custom_ai_instructions) setInstructions(a.custom_ai_instructions);
    setAnalyzed(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed) return;
    onNext({
      VoiceName: voicename.trim(),
      Tone: tone,
      Style: style,
      VocabularyLevel: vocabulary,
      NarrativePerspective: perspective,
      GeneralType: generalType,
      "Custom AI Instructions": instructions.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-xl p-8">
      <h2 className="text-lg font-semibold text-foreground mb-1">Tu Voz (VoiceDNA)</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Define el estilo de comunicacion de tu marca. Puedes analizar automaticamente tu estilo
        desde una URL o rellenar los campos manualmente.
      </p>

      {/* AI Analyzer */}
      <VoiceUrlAnalyzer
        accountId={accountId}
        onAnalysisComplete={handleAnalysisComplete}
      />

      {analyzed && (
        <div className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          Analisis completado. Revisa y ajusta los campos a continuacion.
        </div>
      )}

      <div className="space-y-5">
        <OnboardingField
          label="Nombre del estilo"
          description="Un nombre descriptivo para este perfil de voz."
          required
        >
          <input
            type="text"
            value={voicename}
            onChange={(e) => setVoicename(e.target.value)}
            placeholder="Ej: Estilo David - Profesional Cercano"
            className={inputClassName}
          />
        </OnboardingField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <OnboardingField label="Tono" required>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className={selectClassName}>
              <option value="">Seleccionar</option>
              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </OnboardingField>

          <OnboardingField label="Estilo">
            <select value={style} onChange={(e) => setStyle(e.target.value)} className={selectClassName}>
              <option value="">Seleccionar</option>
              {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </OnboardingField>

          <OnboardingField label="Nivel de vocabulario">
            <select value={vocabulary} onChange={(e) => setVocabulary(e.target.value)} className={selectClassName}>
              <option value="">Seleccionar</option>
              {VOCAB_LEVELS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </OnboardingField>

          <OnboardingField label="Perspectiva narrativa">
            <select value={perspective} onChange={(e) => setPerspective(e.target.value)} className={selectClassName}>
              <option value="">Seleccionar</option>
              {PERSPECTIVES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </OnboardingField>

          <OnboardingField label="Tipo general">
            <select value={generalType} onChange={(e) => setGeneralType(e.target.value)} className={selectClassName}>
              <option value="">Seleccionar</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </OnboardingField>
        </div>

        <OnboardingField
          label="Instrucciones IA personalizadas"
          description="Instrucciones especificas para que la IA replique tu estilo al generar contenido."
        >
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Ej: Usa frases cortas y directas. Incluye ejemplos practicos. Tutea al lector. Evita jerga excesiva..."
            rows={4}
            className={textareaClassName}
          />
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
