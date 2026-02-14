"use client";

import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/proposals/calculator";
import { formatCredits } from "@/lib/proposals/calculator";
import type { Plan } from "@/lib/proposals/constants";

interface PlanSelectorProps {
  plans: Plan[];
  selectedPlan: Plan;
  onPlanSelect: (plan: Plan) => void;
  recommendedPlanId?: string;
  disabled?: boolean;
}

export function PlanSelector({
  plans,
  selectedPlan,
  onPlanSelect,
  recommendedPlanId,
  disabled,
}: PlanSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-100">Elige tu Plan</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isSelected = selectedPlan.id === plan.id;
          const isRecommended = plan.id === recommendedPlanId;

          return (
            <button
              key={plan.id}
              onClick={() => !disabled && onPlanSelect(plan)}
              disabled={disabled}
              className={cn(
                "relative text-left transition-all",
                disabled && "opacity-60 cursor-not-allowed"
              )}
            >
              {/* Recommended badge */}
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-amber-500/90 text-white border-amber-400/50 text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Recomendado
                  </Badge>
                </div>
              )}

              <GlassCard
                className={cn(
                  "h-full p-5 transition-all",
                  isSelected
                    ? "border-[#2996d7]/40 ring-1 ring-[#2996d7]/20"
                    : "hover:border-white/20",
                  isRecommended && !isSelected && "border-amber-500/20"
                )}
              >
                {/* Plan name */}
                <h3 className="text-lg font-bold text-zinc-100 mb-1">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-3">
                  <span className="text-2xl font-bold gradient-text">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-sm text-zinc-500">/mes</span>
                </div>

                {/* Credits */}
                <div className="mb-4 space-y-1">
                  <p className="text-sm text-zinc-300">
                    <span className="font-semibold text-zinc-100">
                      {formatCredits(plan.credits)}
                    </span>{" "}
                    créditos/mes
                  </p>
                  <p className="text-xs text-zinc-500">
                    {plan.creditsPerEuro.toFixed(1)} créditos/€
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-zinc-400"
                    >
                      <Check className="w-3.5 h-3.5 text-[#2996d7] mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="mt-4 flex items-center justify-center gap-1 text-xs text-[#2996d7] font-medium">
                    <Check className="w-4 h-4" />
                    Seleccionado
                  </div>
                )}
              </GlassCard>
            </button>
          );
        })}
      </div>
    </div>
  );
}
