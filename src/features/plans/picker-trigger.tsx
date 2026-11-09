import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Shared trigger of the date and time pickers: a full-width select-like button.
export function PickerTrigger({
  invalid,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "variant"> & {
  invalid: boolean;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      className={cn(
        "flex min-h-11 w-full items-center justify-between rounded-md border-[#ccd9d1] bg-white px-3 py-2.5 text-left text-[0.92rem] font-normal text-[#182e29] hover:border-[#7fa699] hover:bg-white aria-expanded:border-[#7fa699] focus-visible:outline-offset-2",
        invalid && "border-[#b14545]",
        className,
      )}
      {...props}
    >
      {children}
      <span className="text-[0.8rem] text-[#526b63]" aria-hidden="true">
        ▾
      </span>
    </Button>
  );
}
