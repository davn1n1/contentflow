"use client";

import { useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import type { CreditItem, Plan } from "@/lib/proposals/constants";

interface AcceptButtonProps {
  shortId: string;
  items: CreditItem[];
  paymentTerms: string;
  selectedPlan: Plan;
  disabled?: boolean;
}

export function AcceptButton({
  shortId,
  items,
  paymentTerms,
  selectedPlan,
  disabled,
}: AcceptButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleAccept() {
    if (items.length === 0) {
      setMessage("Selecciona al menos un servicio.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(`/api/proposals/${shortId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_items: items,
          payment_terms: paymentTerms,
          selected_plan: selectedPlan.id,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message || "Propuesta aceptada.");
      } else {
        setStatus("error");
        setMessage(data.error || "Error al aceptar la propuesta.");
      }
    } catch {
      setStatus("error");
      setMessage("Error de conexión. Inténtalo de nuevo.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-emerald-400 mb-1">
          Propuesta aceptada
        </h3>
        <p className="text-sm text-zinc-400">{message}</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <button
        onClick={handleAccept}
        disabled={disabled || status === "loading"}
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#2996d7] to-[#3ba8e8] text-white font-semibold text-base hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Aceptar Propuesta
          </>
        )}
      </button>

      {status === "error" && (
        <p className="mt-3 text-sm text-red-400">{message}</p>
      )}
    </div>
  );
}
