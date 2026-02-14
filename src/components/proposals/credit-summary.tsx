"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";
import {
  formatCurrency,
  formatCredits,
  calculateCreditTotal,
} from "@/lib/proposals/calculator";
import type { CreditItem, Plan } from "@/lib/proposals/constants";

interface CreditSummaryProps {
  items: CreditItem[];
  selectedPlan: Plan;
  paymentTerms: string;
  onPaymentTermsChange: (terms: string) => void;
  disabled?: boolean;
}

const PAYMENT_OPTIONS = [
  { value: "1 pago", label: "1 pago", discount: 0 },
  { value: "3 cuotas", label: "3 cuotas", discount: 0 },
  { value: "6 cuotas", label: "6 cuotas", discount: 0 },
];

export function CreditSummary({
  items,
  selectedPlan,
  paymentTerms,
  onPaymentTermsChange,
  disabled,
}: CreditSummaryProps) {
  const totalCredits = calculateCreditTotal(items);
  const activeItems = items.filter((it) => it.quantity > 0);
  const usagePercent = Math.min(
    (totalCredits / selectedPlan.credits) * 100,
    100
  );
  const isOverLimit = totalCredits > selectedPlan.credits;

  const barColor = isOverLimit
    ? "bg-red-500"
    : usagePercent > 80
      ? "bg-amber-500"
      : "bg-[#2996d7]";

  const installments =
    paymentTerms === "3 cuotas" ? 3 : paymentTerms === "6 cuotas" ? 6 : 1;
  const pricePerInstallment = selectedPlan.price / installments;

  return (
    <div className="space-y-4">
      {/* Selected items */}
      {activeItems.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">
            Tu Selección
          </h3>
          <div className="space-y-2">
            {activeItems.map((item) => (
              <div
                key={item.service_id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-zinc-400">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-zinc-300 font-medium">
                  {formatCredits(item.credit_cost * item.quantity)} cred.
                </span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-2 mt-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-200">
                Total Créditos
              </span>
              <span className="text-sm font-bold gradient-text">
                {formatCredits(totalCredits)}
              </span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Credits progress */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">Uso de créditos</span>
          <span className="text-sm text-zinc-300">
            {formatCredits(totalCredits)} / {formatCredits(selectedPlan.credits)}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", barColor)}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>

        {isOverLimit && (
          <div className="mt-3 flex items-start gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="text-amber-400">
              Excedes los créditos del plan {selectedPlan.name}. Considera
              actualizar a un plan superior o reducir la cantidad de contenido.
            </span>
          </div>
        )}
      </GlassCard>

      {/* Payment terms */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">
          Forma de Pago
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => !disabled && onPaymentTermsChange(option.value)}
              disabled={disabled}
              className={cn(
                "rounded-lg py-2 px-3 text-xs font-medium transition-colors",
                paymentTerms === option.value
                  ? "bg-[#2996d7]/20 text-[#2996d7] border border-[#2996d7]/30"
                  : "bg-zinc-800/50 text-zinc-400 border border-white/5 hover:border-white/10",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Final total */}
      <GlassCard highlight className="p-6 text-center">
        <p className="text-sm text-zinc-400 mb-1">
          Plan {selectedPlan.name}
        </p>
        <p className="text-4xl font-bold gradient-text mb-1">
          {formatCurrency(selectedPlan.price)}
          <span className="text-lg text-zinc-500">/mes</span>
        </p>
        {installments > 1 && (
          <p className="text-sm text-zinc-500">
            {installments} cuotas de {formatCurrency(pricePerInstallment)}
          </p>
        )}
        <p className="text-xs text-zinc-500 mt-2">
          {formatCredits(selectedPlan.credits)} créditos incluidos
        </p>
      </GlassCard>
    </div>
  );
}
