"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import {
  MAX_PHOTOS_PER_REQUEST,
  MAX_PHOTO_BYTES,
  PHOTO_TYPES,
} from "@/domain/photos/limits";
import { downscaleImage } from "./downscale-image";
import styles from "./photo-picker.module.css";

// Lets the client choose up to 5 photos. Each is downscaled in the browser;
// the processed files are handed to the form, which uploads them after the
// request is saved.
export function PhotoPicker({
  onChange,
  onBusyChange,
}: {
  onChange: (files: File[]) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const notify = useToast();
  useEffect(
    () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
    [previews],
  );

  async function choose(selected: File[]) {
    if (selected.length > MAX_PHOTOS_PER_REQUEST) {
      notify(`Можете да изберете до ${MAX_PHOTOS_PER_REQUEST} снимки.`);
    }
    const accepted: File[] = [];
    setBusy(true);
    onBusyChange(true);
    try {
      for (const file of selected.slice(0, MAX_PHOTOS_PER_REQUEST)) {
        if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) {
          notify("Поддържат се само снимки във формат JPEG, PNG или WebP.");
          continue;
        }
        try {
          const photo = await downscaleImage(file);
          if (photo.size > MAX_PHOTO_BYTES) {
            notify(
              `Всяка снимка трябва да е до ${MAX_PHOTO_BYTES / 1024 / 1024} MB.`,
            );
            continue;
          }
          accepted.push(photo);
        } catch {
          notify("Една от снимките не може да бъде прочетена.");
        }
      }
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
    setPreviews(accepted.map((file) => URL.createObjectURL(file)));
    onChange(accepted);
  }

  return (
    <>
      <label className={styles.field}>
        Снимки{" "}
        <span className={styles.hint}>
          · по желание, до {MAX_PHOTOS_PER_REQUEST}
        </span>
        <input
          className={styles.input}
          type="file"
          accept={PHOTO_TYPES.join(",")}
          multiple
          disabled={busy}
          onChange={(event) => {
            void choose(Array.from(event.target.files ?? []));
          }}
        />
      </label>
      <div className={styles.previews}>
        {previews.map((url, index) => (
          <Image
            className={styles.preview}
            key={url}
            src={url}
            width={70}
            height={70}
            unoptimized
            alt={`Преглед на избрана снимка ${index + 1}`}
          />
        ))}
      </div>
    </>
  );
}
