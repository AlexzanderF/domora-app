import { describe, expect, it } from "vitest";
import {
  SPECIALIST_STEP_COUNT,
  specialistStepLabel,
  specialistStepProgress,
  specialistStepTitle,
} from "./specialist-steps";

describe("specialist signup steps", () => {
  it("labels each step as Стъпка N от 2", () => {
    expect(SPECIALIST_STEP_COUNT).toBe(2);
    expect(specialistStepLabel(1)).toBe("Стъпка 1 от 2");
    expect(specialistStepLabel(2)).toBe("Стъпка 2 от 2");
  });

  it("titles each step", () => {
    expect(specialistStepTitle(1)).toBe("Данни за профила");
    expect(specialistStepTitle(2)).toBe("Професионална квалификация");
  });

  it("marks progress segments as filled up to the current step", () => {
    expect(specialistStepProgress(1)).toEqual([true, false]);
    expect(specialistStepProgress(2)).toEqual([true, true]);
  });
});
