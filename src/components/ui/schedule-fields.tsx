import { Input } from "@/components/ui/input";
import { TIME_RANGES } from "@/lib/schedule";

// Native controls: the phone's own date wheel and select sheet are the picker.
export function DateField({
  min,
  invalid,
  describedBy,
  className,
}: {
  min: string;
  invalid: boolean;
  describedBy?: string;
  className?: string;
}) {
  return (
    <Input
      name="date"
      type="date"
      min={min}
      className={className}
      aria-invalid={invalid}
      aria-describedby={describedBy}
    />
  );
}

export function TimeRangeSelect({
  invalid,
  describedBy,
}: {
  invalid: boolean;
  describedBy?: string;
}) {
  return (
    <select
      name="time"
      defaultValue=""
      aria-label="Часови диапазон"
      aria-invalid={invalid}
      aria-describedby={describedBy}
    >
      <option value="" disabled>
        Изберете диапазон
      </option>
      {TIME_RANGES.map((range) => (
        <option key={range} value={range}>
          {range}
        </option>
      ))}
    </select>
  );
}
