"use client";

import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";
import { Badge } from "@/components/ui/badge";
import { formatCredits } from "@/lib/proposals/calculator";
import type { ServiceGroup, CreditItem } from "@/lib/proposals/constants";

interface CreditCalculatorProps {
  serviceGroups: ServiceGroup[];
  items: CreditItem[];
  onItemsChange: (items: CreditItem[]) => void;
  disabled?: boolean;
}

export function CreditCalculator({
  serviceGroups,
  items,
  onItemsChange,
  disabled,
}: CreditCalculatorProps) {
  function getQuantity(serviceId: string): number {
    return items.find((it) => it.service_id === serviceId)?.quantity || 0;
  }

  function updateQuantity(
    serviceId: string,
    slug: string,
    name: string,
    creditCost: number,
    delta: number
  ) {
    if (disabled) return;

    const existing = items.find((it) => it.service_id === serviceId);
    if (existing) {
      const newQty = Math.max(0, existing.quantity + delta);
      if (newQty === 0) {
        onItemsChange(items.filter((it) => it.service_id !== serviceId));
      } else {
        onItemsChange(
          items.map((it) =>
            it.service_id === serviceId ? { ...it, quantity: newQty } : it
          )
        );
      }
    } else if (delta > 0) {
      onItemsChange([
        ...items,
        {
          service_id: serviceId,
          slug,
          name,
          credit_cost: creditCost,
          quantity: 1,
        },
      ]);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-100">
        Calculadora de Créditos
      </h2>
      <p className="text-sm text-zinc-400 -mt-4">
        Configura la cantidad de contenido que necesitas cada mes
      </p>

      {serviceGroups.map((group) => (
        <GlassCard key={group.id} className="p-5">
          <h3 className="text-sm font-semibold text-[#2996d7] mb-4">
            {group.name}
          </h3>

          <div className="space-y-3">
            {group.services.map((service) => {
              const qty = getQuantity(service.id);
              const subtotal = qty * service.creditCost;
              const isActive = qty > 0;

              return (
                <div
                  key={service.id}
                  className={cn(
                    "rounded-xl p-4 transition-colors",
                    isActive
                      ? "bg-[#2996d7]/5 border border-[#2996d7]/20"
                      : "bg-white/[0.02] border border-white/5"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Service info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-zinc-200">
                          {service.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-[#2996d7]/10 text-[#2996d7] border-[#2996d7]/20"
                        >
                          {formatCredits(service.creditCost)} créditos
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500 mb-2">
                        {service.description}
                      </p>
                      {/* Platform tags */}
                      <div className="flex flex-wrap gap-1">
                        {service.platforms.map((p) => (
                          <span
                            key={p}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-500"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Quantity controls + subtotal */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(
                              service.id,
                              service.slug,
                              service.name,
                              service.creditCost,
                              -1
                            )
                          }
                          disabled={disabled || qty === 0}
                          className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5 text-zinc-300" />
                        </button>

                        <span className="w-8 text-center text-sm font-semibold text-zinc-100">
                          {qty}
                        </span>

                        <button
                          onClick={() =>
                            updateQuantity(
                              service.id,
                              service.slug,
                              service.name,
                              service.creditCost,
                              1
                            )
                          }
                          disabled={disabled}
                          className="w-8 h-8 rounded-lg bg-[#2996d7]/20 hover:bg-[#2996d7]/30 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#2996d7]" />
                        </button>
                      </div>

                      {isActive && (
                        <span className="text-xs text-zinc-400 min-w-[80px] text-right">
                          {formatCredits(subtotal)} cred.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
