"use client";

import { ExecutiveSummary } from "./executive-summary";
import { PlanSelector } from "./plan-selector";
import { KeyBenefits } from "./key-benefits";
import { OfferTerms } from "./offer-terms";
import { CreditCalculator } from "./credit-calculator";
import { CreditSummary } from "./credit-summary";
import { AcceptButton } from "./accept-button";
import type { Analysis } from "./tab-meeting-brief";
import type { Plan, ServiceGroup, CreditItem } from "@/lib/proposals/constants";

interface TabProposalProps {
  shortId: string;
  prospectName: string;
  companyName?: string;
  analysis?: Analysis;
  plans: Plan[];
  serviceGroups: ServiceGroup[];
  selectedPlan: Plan;
  onPlanSelect: (plan: Plan) => void;
  recommendedPlanId?: string;
  creditItems: CreditItem[];
  onCreditItemsChange: (items: CreditItem[]) => void;
  paymentTerms: string;
  onPaymentTermsChange: (terms: string) => void;
  expiresAt?: string;
  isLocked: boolean;
}

export function TabProposal({
  shortId,
  prospectName,
  companyName,
  analysis,
  plans,
  serviceGroups,
  selectedPlan,
  onPlanSelect,
  recommendedPlanId,
  creditItems,
  onCreditItemsChange,
  paymentTerms,
  onPaymentTermsChange,
  expiresAt,
  isLocked,
}: TabProposalProps) {
  return (
    <div className="space-y-8">
      <ExecutiveSummary
        prospectName={prospectName}
        companyName={companyName}
        analysis={analysis}
      />

      <PlanSelector
        plans={plans}
        selectedPlan={selectedPlan}
        onPlanSelect={onPlanSelect}
        recommendedPlanId={recommendedPlanId}
        disabled={isLocked}
      />

      <KeyBenefits />

      <OfferTerms expiresAt={expiresAt} />

      <CreditCalculator
        serviceGroups={serviceGroups}
        items={creditItems}
        onItemsChange={onCreditItemsChange}
        disabled={isLocked}
      />

      <CreditSummary
        items={creditItems}
        selectedPlan={selectedPlan}
        paymentTerms={paymentTerms}
        onPaymentTermsChange={onPaymentTermsChange}
        disabled={isLocked}
      />

      {!isLocked && (
        <AcceptButton
          shortId={shortId}
          items={creditItems}
          paymentTerms={paymentTerms}
          selectedPlan={selectedPlan}
          disabled={
            creditItems.length === 0 ||
            creditItems.every((i) => i.quantity === 0)
          }
        />
      )}
    </div>
  );
}
