"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PickerTrigger } from "@/features/plans/picker-trigger";

const timeOptions = ["09:00–12:00", "12:00–15:00", "15:00–18:00"];

export function TimePicker({
  invalid,
  describedBy,
}: {
  invalid: boolean;
  describedBy?: string;
}) {
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <input name="time" type="hidden" value={selected} />
      <PickerTrigger
        invalid={invalid}
        aria-label="Часови диапазон"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={describedBy}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected || "Изберете диапазон"}</span>
      </PickerTrigger>
      {open && (
        <div
          className="absolute top-[calc(100%+0.45rem)] right-0 left-0 z-20 grid gap-0.5 rounded-[7px] border border-[#ccd9d1] bg-white p-[0.35rem] shadow-[0_14px_34px_rgb(26_57_49/16%)]"
          role="listbox"
          aria-label="Часови диапазон"
        >
          {timeOptions.map((option) => (
            <Button
              key={option}
              type="button"
              variant="ghost"
              className="flex min-h-[38px] items-center justify-between rounded-[5px] px-[0.7rem] py-[0.55rem] text-left text-[0.88rem] font-bold text-[#29453e] hover:bg-[#edf3ef] focus-visible:bg-[#edf3ef] focus-visible:outline-none aria-selected:bg-[#175246] aria-selected:hover:bg-[#175246] aria-selected:focus-visible:bg-[#175246] aria-selected:font-[750] aria-selected:text-white"
              role="option"
              aria-selected={selected === option}
              onClick={() => {
                setSelected(option);
                setOpen(false);
              }}
            >
              <span>{option}</span>
              {selected === option && <span aria-hidden="true">✓</span>}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
