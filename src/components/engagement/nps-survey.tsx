"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useNpsStore } from "@/lib/stores/nps-store";
import { cn } from "@/lib/utils";

const SCORE_COLORS: Record<number, string> = {
  0: "bg-destructive/20 text-destructive border-destructive/30",
  1: "bg-destructive/20 text-destructive border-destructive/30",
  2: "bg-destructive/20 text-destructive border-destructive/30",
  3: "bg-destructive/20 text-destructive border-destructive/30",
  4: "bg-destructive/20 text-destructive border-destructive/30",
  5: "bg-destructive/20 text-destructive border-destructive/30",
  6: "bg-destructive/20 text-destructive border-destructive/30",
  7: "bg-warning/20 text-warning border-warning/30",
  8: "bg-warning/20 text-warning border-warning/30",
  9: "bg-success/20 text-success border-success/30",
  10: "bg-success/20 text-success border-success/30",
};

export function NpsSurvey() {
  const pathname = usePathname();
  const { shouldShowSurvey, setLastSurveyAt, setLastDismissedAt } =
    useNpsStore();

  const [visible, setVisible] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Check if we should show the survey (after hydration)
  useEffect(() => {
    // Small delay to avoid showing immediately on page load
    const timer = setTimeout(() => {
      if (shouldShowSurvey()) {
        setVisible(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDismiss = useCallback(() => {
    setLastDismissedAt(new Date().toISOString());
    setVisible(false);
  }, [setLastDismissedAt]);

  const handleSubmit = useCallback(async () => {
    if (selectedScore === null) return;

    setSubmitting(true);
    try {
      await fetch("/api/nps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: selectedScore,
          feedback: feedback.trim() || undefined,
          pageContext: pathname,
        }),
      });

      setLastSurveyAt(new Date().toISOString());
      setSubmitted(true);

      // Auto-close after showing thank you
      setTimeout(() => setVisible(false), 2000);
    } catch {
      // Silently fail — don't block user
      setVisible(false);
    } finally {
      setSubmitting(false);
    }
  }, [selectedScore, feedback, pathname, setLastSurveyAt]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={handleDismiss}
      />

      {/* Card */}
      <div className="relative glass-card rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl tip-slide-up">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          /* Thank you state */
          <div className="text-center py-4">
            <p className="text-lg font-semibold text-foreground mb-1">
              Gracias por tu feedback
            </p>
            <p className="text-sm text-muted-foreground">
              Tu opinion nos ayuda a mejorar ContentFlow365
            </p>
          </div>
        ) : (
          <>
            {/* Title */}
            <h2 className="text-base font-semibold text-foreground mb-1 pr-6">
              ¿Cuanto recomendarias ContentFlow365?
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              Del 0 (nada probable) al 10 (muy probable)
            </p>

            {/* Score buttons */}
            <div className="flex gap-1.5 justify-center mb-5">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedScore(i)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-medium border transition-all",
                    selectedScore === i
                      ? SCORE_COLORS[i]
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {i}
                </button>
              ))}
            </div>

            {/* Labels under scores */}
            <div className="flex justify-between text-[10px] text-muted-foreground mb-5 px-1">
              <span>Nada probable</span>
              <span>Muy probable</span>
            </div>

            {/* Feedback textarea (appears after selecting score) */}
            {selectedScore !== null && (
              <div className="mb-4 tip-slide-up">
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Cuentanos mas (opcional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="¿Que podriamos mejorar?"
                  className="w-full bg-background/50 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
                  rows={3}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleDismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Ahora no
              </button>
              {selectedScore !== null && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Enviando..." : "Enviar feedback"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
