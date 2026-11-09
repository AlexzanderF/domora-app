"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker, getDefaultClassNames } from "@daypicker/react";
import { bg } from "@daypicker/react/locale";
import { PickerTrigger } from "@/features/plans/picker-trigger";

// `@daypicker/react` v10 stays as the date picker (not the shadcn Calendar).
// It ships unstyled here, so its parts are styled through `classNames`, on top
// of the library's own default class names.
const defaults = getDefaultClassNames();
const dayPickerClassNames = {
  root: `${defaults.root} m-0 [--rdp-accent-color:#175246]`,
  months: `${defaults.months} w-full`,
  month: `${defaults.month} w-full`,
  month_caption: `${defaults.month_caption} flex min-h-[2.15rem] items-center px-[2.35rem] text-center font-extrabold text-[#17372f]`,
  caption_label: `${defaults.caption_label} w-full`,
  nav: `${defaults.nav} absolute inset-x-[0.65rem] top-[0.65rem] flex justify-between`,
  button_previous: `${defaults.button_previous} grid size-[1.9rem] place-items-center rounded-md border border-[#dce5df] bg-white p-0 text-[#175246]`,
  button_next: `${defaults.button_next} grid size-[1.9rem] place-items-center rounded-md border border-[#dce5df] bg-white p-0 text-[#175246]`,
  month_grid: `${defaults.month_grid} w-full border-collapse`,
  weekday: `${defaults.weekday} h-[1.7rem] text-[0.68rem] font-[750] text-[#71827c]`,
  day: `${defaults.day} p-px text-center`,
  day_button: `${defaults.day_button} size-[1.9rem] rounded-md border-0 bg-transparent p-0 text-[#29453e] hover:bg-[#edf3ef]`,
  selected: `${defaults.selected} [&>button]:bg-[#175246] [&>button]:font-extrabold [&>button]:text-white [&>button:hover]:bg-[#175246]`,
  today: `${defaults.today} [&:not(.rdp-selected)>button]:font-extrabold [&:not(.rdp-selected)>button]:text-[#175246] [&:not(.rdp-selected)>button]:shadow-[inset_0_0_0_1px_#7fa699]`,
  disabled: `${defaults.disabled} [&>button]:cursor-not-allowed [&>button]:text-[#b1bcb8]`,
};

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

export function DatePicker({
  min,
  invalid,
  describedBy,
}: {
  min: string;
  invalid: boolean;
  describedBy?: string;
}) {
  const [selected, setSelected] = useState<Date>();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const minimumDate = parseLocalDate(min);

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
      <input
        name="date"
        type="hidden"
        value={selected ? toLocalDate(selected) : ""}
      />
      <PickerTrigger
        invalid={invalid}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={describedBy}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected ? formatDisplayDate(selected) : "Изберете дата"}</span>
      </PickerTrigger>
      {open && (
        <div
          className="absolute top-[calc(100%+0.45rem)] right-0 z-20 w-[min(280px,calc(100vw-3rem))] rounded-[7px] border border-[#ccd9d1] bg-white p-[0.65rem] shadow-[0_18px_42px_rgb(26_57_49/18%)]"
          role="dialog"
          aria-label="Избор на дата"
        >
          <DayPicker
            mode="single"
            locale={bg}
            classNames={dayPickerClassNames}
            weekStartsOn={1}
            selected={selected}
            defaultMonth={selected ?? minimumDate}
            disabled={{ before: minimumDate }}
            onSelect={(date) => {
              if (!date) return;
              setSelected(date);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
