"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./plans.module.css";

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
    <div className={styles.timePicker} ref={containerRef}>
      <input name="time" type="hidden" value={selected} />
      <button
        className={`${styles.dateTrigger} ${invalid ? styles.dateTriggerInvalid : ""}`}
        type="button"
        aria-label="Часови диапазон"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={describedBy}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected || "Изберете диапазон"}</span>
        <span className={styles.dateChevron} aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div
          className={styles.timeMenu}
          role="listbox"
          aria-label="Часови диапазон"
        >
          {timeOptions.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={selected === option}
              onClick={() => {
                setSelected(option);
                setOpen(false);
              }}
            >
              <span>{option}</span>
              {selected === option && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
