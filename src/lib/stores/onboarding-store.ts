import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  currentStep: number;
  stepData: Record<string, Record<string, unknown>>;
  stepRecordIds: Record<string, string>;
  setStep: (step: number) => void;
  setStepData: (step: string, data: Record<string, unknown>) => void;
  setStepRecordId: (step: string, recordId: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 0,
      stepData: {},
      stepRecordIds: {},
      setStep: (step) => set({ currentStep: step }),
      setStepData: (step, data) =>
        set((state) => ({
          stepData: { ...state.stepData, [step]: data },
        })),
      setStepRecordId: (step, recordId) =>
        set((state) => ({
          stepRecordIds: { ...state.stepRecordIds, [step]: recordId },
        })),
      reset: () => set({ currentStep: 0, stepData: {}, stepRecordIds: {} }),
    }),
    {
      name: "cf365-onboarding",
      version: 1,
    }
  )
);
