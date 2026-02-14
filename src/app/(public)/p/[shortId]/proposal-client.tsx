"use client";

import { useState, useCallback } from "react";
import { Clock, CheckCircle2 } from "lucide-react";
import { ProposalHeader } from "@/components/proposals/proposal-header";
import { ProposalLoading } from "@/components/proposals/proposal-loading";
import { ProposalTabs, type TabKey } from "@/components/proposals/proposal-tabs";
import { TabMeetingBrief, type Analysis } from "@/components/proposals/tab-meeting-brief";
import { TabHowItWorks } from "@/components/proposals/tab-how-it-works";
import { TabProposal } from "@/components/proposals/tab-proposal";
import { TabFAQs } from "@/components/proposals/tab-faqs";
import type { Plan, ServiceGroup, CreditItem, FAQCategory } from "@/lib/proposals/constants";

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
  services?: CreditItem[];
  selected_plan?: string;
  payment_terms?: string;
}

interface ProposalPageClientProps {
  proposal: Proposal;
  plans: Plan[];
  serviceGroups: ServiceGroup[];
  faqs: FAQCategory[];
  recommendedPlanId: string;
  isExpired: boolean;
  isAccepted: boolean;
}

export function ProposalPageClient({
  proposal,
  plans,
  serviceGroups,
  faqs,
  recommendedPlanId,
  isExpired,
  isAccepted,
}: ProposalPageClientProps) {
  const [showLoading, setShowLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("propuesta");

  const defaultPlan =
    plans.find((p) => p.id === (proposal.selected_plan || recommendedPlanId)) ||
    plans.find((p) => p.id === "growth") ||
    plans[0];

  const [selectedPlan, setSelectedPlan] = useState<Plan>(defaultPlan);
  const [creditItems, setCreditItems] = useState<CreditItem[]>(
    (proposal.services as CreditItem[]) || []
  );
  const [paymentTerms, setPaymentTerms] = useState(
    proposal.payment_terms || "1 pago"
  );

  const locked = isExpired || isAccepted;

  const handleCreditItemsChange = useCallback(
    (newItems: CreditItem[]) => {
      setCreditItems(newItems);
      fetch(`/api/proposals/${proposal.short_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: newItems,
          plan_id: selectedPlan.id,
        }),
      }).catch(() => {});
    },
    [proposal.short_id, selectedPlan.id]
  );

  if (showLoading) {
    return (
      <ProposalLoading
        prospectName={proposal.prospect_name}
        shortId={proposal.short_id}
        onComplete={() => setShowLoading(false)}
      />
    );
  }

  const analysis = proposal.analysis as Analysis | undefined;

  return (
    <div>
      {/* Expiration banner */}
      {isExpired && (
        <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="text-red-400 font-medium">
              Esta propuesta ha expirado
            </p>
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
              Ya has aceptado esta propuesta. Nos pondremos en contacto contigo
              pronto.
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

      <ProposalTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "brief" && analysis && Object.keys(analysis).length > 0 && (
        <TabMeetingBrief analysis={analysis} />
      )}
      {activeTab === "brief" &&
        (!analysis || Object.keys(analysis).length === 0) && (
          <div className="text-center py-12 text-zinc-500">
            <p>No hay análisis de reunión disponible para esta propuesta.</p>
          </div>
        )}

      {activeTab === "como-funciona" && <TabHowItWorks />}

      {activeTab === "propuesta" && (
        <TabProposal
          shortId={proposal.short_id}
          prospectName={proposal.prospect_name}
          companyName={proposal.company_name}
          analysis={analysis}
          plans={plans}
          serviceGroups={serviceGroups}
          selectedPlan={selectedPlan}
          onPlanSelect={locked ? () => {} : setSelectedPlan}
          recommendedPlanId={recommendedPlanId}
          creditItems={creditItems}
          onCreditItemsChange={locked ? () => {} : handleCreditItemsChange}
          paymentTerms={paymentTerms}
          onPaymentTermsChange={locked ? () => {} : setPaymentTerms}
          expiresAt={proposal.expires_at}
          isLocked={locked}
        />
      )}

      {activeTab === "faqs" && <TabFAQs categories={faqs} />}
    </div>
  );
}
