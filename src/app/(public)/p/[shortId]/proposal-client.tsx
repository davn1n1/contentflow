"use client";

import { useState, useCallback } from "react";
import { ProposalHeader } from "@/components/proposals/proposal-header";
import { CallAnalysis } from "@/components/proposals/call-analysis";
import { ServiceCalculator, type CalculatorItem } from "@/components/proposals/service-calculator";
import { PricingSummary } from "@/components/proposals/pricing-summary";
import { AcceptButton } from "@/components/proposals/accept-button";
import { Clock, CheckCircle2 } from "lucide-react";

interface Service {
  id: string;
  slug: string;
  name: string;
  description: string;
  unit_price: number;
  unit_label: string;
  category: string;
}

interface Proposal {
  id: string;
  short_id: string;
  prospect_name: string;
  prospect_email?: string;
  company_name?: string;
  created_at: string;
  expires_at?: string;
  status: string;
  analysis?: Record<string, unknown>;
  services?: CalculatorItem[];
  subtotal?: number;
  discount_percent?: number;
  total?: number;
  payment_terms?: string;
}

interface ProposalPageClientProps {
  proposal: Proposal;
  services: Service[];
  isExpired: boolean;
  isAccepted: boolean;
}

export function ProposalPageClient({
  proposal,
  services,
  isExpired,
  isAccepted,
}: ProposalPageClientProps) {
  const [items, setItems] = useState<CalculatorItem[]>(
    (proposal.services as CalculatorItem[]) || []
  );
  const [paymentTerms, setPaymentTerms] = useState(
    proposal.payment_terms || "1 pago"
  );

  const subtotal = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
  const discountPercent = proposal.discount_percent || 0;
  const discount = (subtotal * discountPercent) / 100;
  const total = subtotal - discount;

  const handleItemsChange = useCallback(
    (newItems: CalculatorItem[]) => {
      setItems(newItems);
      // Persist to server in background
      fetch(`/api/proposals/${proposal.short_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: newItems,
          discount_percent: discountPercent,
        }),
      }).catch(() => {});
    },
    [proposal.short_id, discountPercent]
  );

  const locked = isExpired || isAccepted;

  return (
    <div>
      {/* Expiration banner */}
      {isExpired && (
        <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="text-red-400 font-medium">Esta propuesta ha expirado</p>
            <p className="text-sm text-zinc-400">
              Contacta con nosotros para generar una nueva propuesta actualizada.
            </p>
          </div>
        </div>
      )}

      {/* Already accepted banner */}
      {isAccepted && (
        <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-emerald-400 font-medium">Propuesta aceptada</p>
            <p className="text-sm text-zinc-400">
              Ya has aceptado esta propuesta. Nos pondremos en contacto contigo pronto.
            </p>
          </div>
        </div>
      )}

      <ProposalHeader
        prospectName={proposal.prospect_name}
        companyName={proposal.company_name}
        createdAt={proposal.created_at}
        expiresAt={proposal.expires_at}
      />

      {proposal.analysis && Object.keys(proposal.analysis).length > 0 && (
        <CallAnalysis
          analysis={
            proposal.analysis as {
              summary?: string;
              pain_points?: string[];
              desires?: string[];
              objections?: string[];
              kpi_goals?: string[];
              interest_score?: number;
              sentiment_score?: string;
              urgency_score?: number;
              next_step?: string;
            }
          }
        />
      )}

      <ServiceCalculator
        services={services}
        items={items}
        onItemsChange={locked ? () => {} : handleItemsChange}
      />

      <PricingSummary
        subtotal={subtotal}
        discountPercent={discountPercent}
        total={total}
        paymentTerms={paymentTerms}
        onPaymentTermsChange={locked ? () => {} : setPaymentTerms}
      />

      {!isExpired && !isAccepted && (
        <AcceptButton
          shortId={proposal.short_id}
          items={items}
          paymentTerms={paymentTerms}
          disabled={items.length === 0 || items.every((i) => i.quantity === 0)}
        />
      )}
    </div>
  );
}
