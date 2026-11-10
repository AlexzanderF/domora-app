export type SpecialistStep = 1 | 2;

export const SPECIALIST_STEP_COUNT = 2;

const STEP_TITLES: Record<SpecialistStep, string> = {
  1: "Данни за профила",
  2: "Професионална квалификация",
};

export function specialistStepLabel(step: SpecialistStep): string {
  return `Стъпка ${step} от ${SPECIALIST_STEP_COUNT}`;
}

export function specialistStepTitle(step: SpecialistStep): string {
  return STEP_TITLES[step];
}

/** One flag per progress segment; true when the segment is reached. */
export function specialistStepProgress(step: SpecialistStep): boolean[] {
  return Array.from({ length: SPECIALIST_STEP_COUNT }, (_, i) => i < step);
}
