import { cn } from "@/lib/utils";
import {
  specialistStepLabel,
  specialistStepProgress,
  specialistStepTitle,
  type SpecialistStep,
} from "./specialist-steps";

/** "Стъпка N от 2 · title" over a two-segment progress bar. */
export function SpecialistStepIndicator({ step }: { step: SpecialistStep }) {
  return (
    <nav aria-label="Стъпки на кандидатстване" className="mb-6">
      <h2
        className="m-0 mb-2.5 text-base font-bold text-foreground"
        aria-current="step"
      >
        {specialistStepLabel(step)}
        <span className="font-semibold text-muted-foreground">
          {" · "}
          {specialistStepTitle(step)}
        </span>
      </h2>
      <div className="flex gap-1.5" aria-hidden="true">
        {specialistStepProgress(step).map((reached, index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full bg-border",
              reached && "bg-primary",
            )}
          />
        ))}
      </div>
    </nav>
  );
}
