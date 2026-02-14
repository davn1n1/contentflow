"use client";

import { formatCurrency } from "@/lib/proposals/calculator";

interface PricingSummaryProps {
  subtotal: number;
  discountPercent: number;
  total: number;
  paymentTerms: string;
  onPaymentTermsChange: (terms: string) => void;
}

const PAYMENT_OPTIONS = [
  { value: "1 pago", label: "Pago único", discount: "Mejor precio" },
  { value: "3 cuotas", label: "3 cuotas", discount: "" },
  { value: "6 cuotas", label: "6 cuotas", discount: "" },
];

export function PricingSummary({
  subtotal,
  discountPercent,
  total,
  paymentTerms,
  onPaymentTermsChange,
}: PricingSummaryProps) {
  const discount = (subtotal * discountPercent) / 100;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0f0f19]/80 to-[#0a0a0f]/90 border border-[#2996d7]/10 p-6 mb-8">
      {/* Payment terms */}
      <h3 className="text-sm font-medium text-zinc-400 mb-3">Forma de pago</h3>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {PAYMENT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPaymentTermsChange(opt.value)}
            className={`px-3 py-2.5 rounded-xl text-center text-sm font-medium border transition-all ${
              paymentTerms === opt.value
                ? "border-[#2996d7]/40 bg-[#2996d7]/10 text-[#2996d7]"
                : "border-white/5 bg-white/[0.02] text-zinc-400 hover:border-white/10"
            }`}
          >
            {opt.label}
            {opt.discount && (
              <span className="block text-xs text-emerald-400 mt-0.5">
                {opt.discount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pricing breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-zinc-400">
          <span>Subtotal / mes</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discountPercent > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>Descuento ({discountPercent}%)</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="border-t border-white/5 pt-2 flex justify-between items-end">
          <span className="text-zinc-300 font-medium">Total / mes</span>
          <span className="text-2xl font-bold bg-gradient-to-r from-[#2996d7] to-[#5bbef0] bg-clip-text text-transparent">
            {formatCurrency(total)}
          </span>
        </div>
        {paymentTerms !== "1 pago" && total > 0 && (
          <p className="text-xs text-zinc-500 text-right">
            {paymentTerms === "3 cuotas"
              ? `3 pagos de ${formatCurrency(total / 3)}`
              : `6 pagos de ${formatCurrency(total / 6)}`}
          </p>
        )}
      </div>
    </div>
  );
}
