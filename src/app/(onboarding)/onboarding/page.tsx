"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAccountStore } from "@/lib/stores/account-store";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import { useOnboardingStatus, useSaveOnboardingStep } from "@/lib/hooks/use-onboarding";
import { WizardProgress } from "@/components/onboarding/wizard-progress";
import { BrandStep } from "@/components/onboarding/brand-step";
import { PersonaStep } from "@/components/onboarding/persona-step";
import { VoiceDNAStep } from "@/components/onboarding/voicedna-step";
import { AudienciaStep } from "@/components/onboarding/audiencia-step";
import { ConfigStep } from "@/components/onboarding/config-step";

const STEPS = ["brand", "persona", "voicedna", "audiencia", "config"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { currentAccount } = useAccountStore();
  const accountId = currentAccount?.airtable_id || currentAccount?.id || "";

  const { data: status, isLoading } = useOnboardingStatus(accountId);
  const saveStep = useSaveOnboardingStep();
  const { currentStep, setStep, stepData, setStepData, stepRecordIds, setStepRecordId, reset } =
    useOnboardingStore();

  const [saving, setSaving] = useState(false);

  // On load, jump to first uncompleted step
  useEffect(() => {
    if (!status) return;
    const steps = status.completedSteps;
    const order: (keyof typeof steps)[] = ["brand", "persona", "voicedna", "audiencia", "config"];
    const firstIncomplete = order.findIndex((s) => !steps[s]);
    if (firstIncomplete >= 0) {
      setStep(firstIncomplete);
    }
  }, [status, setStep]);

  // If onboarding is complete, redirect to dashboard
  useEffect(() => {
    if (status && !status.needsOnboarding) {
      reset();
      router.replace("/dashboard");
    }
  }, [status, router, reset]);

  const handleNext = async (stepName: string, data: Record<string, unknown>) => {
    if (!accountId) return;
    setSaving(true);
    try {
      const result = await saveStep.mutateAsync({
        step: stepName,
        accountId,
        data,
        recordId: stepRecordIds[stepName],
      });
      if (result.recordId) {
        setStepRecordId(stepName, result.recordId);
      }
      setStepData(stepName, data);

      if (currentStep < STEPS.length - 1) {
        setStep(currentStep + 1);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (data: Record<string, unknown>) => {
    await handleNext("config", data);
    reset();
    router.replace("/dashboard");
  };

  if (isLoading || !currentAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Image src="/logo.png" alt="ContentFlow365" width={36} height={36} priority />
          <span className="text-lg font-semibold gradient-text">ContentFlow365</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Configura tu cuenta
          </h1>
          <p className="text-muted-foreground">
            Completa estos pasos para personalizar tu experiencia de produccion de video.
          </p>
        </div>

        <WizardProgress
          currentStep={currentStep}
          completedSteps={status?.completedSteps}
          onStepClick={setStep}
        />

        <div className="mt-8">
          {currentStep === 0 && (
            <BrandStep
              accountName={currentAccount.name || ""}
              initialData={stepData.brand}
              saving={saving}
              onNext={(data) => handleNext("brand", data)}
            />
          )}
          {currentStep === 1 && (
            <PersonaStep
              initialData={stepData.persona}
              saving={saving}
              onNext={(data) => handleNext("persona", data)}
              onBack={() => setStep(0)}
            />
          )}
          {currentStep === 2 && (
            <VoiceDNAStep
              accountId={accountId}
              initialData={stepData.voicedna}
              saving={saving}
              onNext={(data) => handleNext("voicedna", data)}
              onBack={() => setStep(1)}
            />
          )}
          {currentStep === 3 && (
            <AudienciaStep
              initialData={stepData.audiencia}
              saving={saving}
              onNext={(data) => handleNext("audiencia", data)}
              onBack={() => setStep(2)}
            />
          )}
          {currentStep === 4 && (
            <ConfigStep
              completedSteps={status?.completedSteps}
              saving={saving}
              onComplete={handleComplete}
              onBack={() => setStep(3)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
