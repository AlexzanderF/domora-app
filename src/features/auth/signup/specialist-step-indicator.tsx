import { cn } from "@/lib/utils";

function Step({
  number,
  title,
  isActive,
  isCompleted,
}: {
  number: 1 | 2;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
}) {
  return (
    <div className="flex flex-1 items-center gap-2">
      <span
        className={cn(
          "flex size-[26px] shrink-0 items-center justify-center rounded-full border border-border bg-background text-[13px] font-bold text-muted-foreground",
          isActive && "border-primary bg-primary text-primary-foreground",
          isCompleted && "border-[#31c48d] bg-[#def7ec] text-[#03543f]",
        )}
        aria-hidden="true"
      >
        {isCompleted ? "✓" : number}
      </span>
      <span
        className={cn(
          "text-[13px] leading-[1.3] font-semibold text-muted-foreground",
          isActive && "font-bold text-foreground",
        )}
        aria-current={isActive ? "step" : undefined}
      >
        {title}
      </span>
    </div>
  );
}

export function SpecialistStepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <nav
      aria-label="Стъпки на кандидатстване"
      className="mb-[22px] flex! items-center justify-between gap-3! border-b border-border pb-4"
    >
      <Step
        number={1}
        title="Стъпка 1: Данни за профила"
        isActive={step === 1}
        isCompleted={step > 1}
      />
      <Step
        number={2}
        title="Стъпка 2: Професионална квалификация"
        isActive={step === 2}
        isCompleted={false}
      />
    </nav>
  );
}
