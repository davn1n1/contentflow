"use client";

import { useEffect, useState } from "react";
import { Film, Check } from "lucide-react";
import { LOADING_STEPS } from "@/lib/proposals/constants";

interface ProposalLoadingProps {
  prospectName: string;
  shortId: string;
  onComplete: () => void;
}

export function ProposalLoading({
  prospectName,
  shortId,
  onComplete,
}: ProposalLoadingProps) {
  const [completedSteps, setCompletedSteps] = useState(0);

  useEffect(() => {
    // Skip loading on repeat visits
    const key = `proposal-loaded-${shortId}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(key)) {
      onComplete();
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    LOADING_STEPS.forEach((_, i) => {
      timers.push(
        setTimeout(() => setCompletedSteps(i + 1), (i + 1) * 700)
      );
    });

    timers.push(
      setTimeout(() => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(key, "1");
        }
        onComplete();
      }, 3800)
    );

    return () => timers.forEach(clearTimeout);
  }, [shortId, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-12">
        <Film className="w-8 h-8 text-[#2996d7]" />
        <span className="text-2xl font-bold gradient-text">ContentFlow365</span>
      </div>

      {/* Steps */}
      <div className="w-full max-w-md space-y-4 mb-12">
        {LOADING_STEPS.map((step, i) => (
          <div
            key={i}
            className="loading-step flex items-center gap-3"
            style={{ animationDelay: `${i * 0.6}s` }}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                completedSteps > i
                  ? "bg-[#2996d7]"
                  : "bg-zinc-800"
              }`}
            >
              {completedSteps > i ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-zinc-600" />
              )}
            </div>
            <span
              className={`text-sm transition-colors duration-300 ${
                completedSteps > i ? "text-zinc-300" : "text-zinc-500"
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md">
        <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#2996d7] to-[#5bbef0] loading-progress rounded-full" />
        </div>
        <p className="text-center text-sm text-zinc-500 mt-6">
          Preparando la mejor propuesta para{" "}
          <span className="text-zinc-300">{prospectName}</span>...
        </p>
      </div>
    </div>
  );
}
