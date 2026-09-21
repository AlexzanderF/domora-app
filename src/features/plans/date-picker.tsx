"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "@daypicker/react";
import { bg } from "@daypicker/react/locale";
import styles from "./plans.module.css";

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
    <div className={styles.datePicker} ref={containerRef}>
      <input
        name="date"
        type="hidden"
        value={selected ? toLocalDate(selected) : ""}
      />
      <button
        className={`${styles.dateTrigger} ${invalid ? styles.dateTriggerInvalid : ""}`}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={describedBy}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected ? styles.selectedDateValue : undefined}>
          {selected ? formatDisplayDate(selected) : "Изберете дата"}
        </span>
        <span className={styles.dateChevron} aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div
          className={styles.calendarPopover}
          role="dialog"
          aria-label="Избор на дата"
        >
          <DayPicker
            mode="single"
            locale={bg}
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
