"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-provider";
import {
  MAX_PHOTOS_PER_REQUEST,
  MAX_PHOTO_BYTES,
  PHOTO_TYPES,
} from "@/domain/photos/limits";
import { downscaleImage } from "./downscale-image";
import { fieldClass } from "./field-styles";

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
  const [files, setFiles] = useState<File[]>([]);
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
    setFiles(accepted);
    onChange(accepted);
  }

  function remove(index: number) {
    const rest = files.filter((_, i) => i !== index);
    setFiles(rest);
    setPreviews(rest.map((file) => URL.createObjectURL(file)));
    onChange(rest);
  }

  return (
    <>
      <Label className={fieldClass}>
        Снимки{" "}
        <span className="font-medium text-muted-foreground">
          · по желание, до {MAX_PHOTOS_PER_REQUEST}
        </span>
        <Input
          type="file"
          accept={PHOTO_TYPES.join(",")}
          multiple
          disabled={busy}
          onChange={(event) => {
            void choose(Array.from(event.target.files ?? []));
          }}
        />
      </Label>
      <div
        id="previews"
        className="grid grid-cols-[repeat(auto-fill,72px)] gap-2"
      >
        {previews.map((url, index) => (
          <div key={url} className="relative size-[72px]">
            <Image
              className="mb-0 size-[72px] rounded-md object-cover"
              src={url}
              width={72}
              height={72}
              unoptimized
              alt={`Преглед на избрана снимка ${index + 1}`}
            />
            <button
              type="button"
              aria-label={`Премахни снимка ${index + 1}`}
              className="absolute -top-2 -right-2 grid size-11 cursor-pointer place-items-center rounded-full border-0 bg-transparent"
              onClick={() => remove(index)}
            >
              <span
                aria-hidden="true"
                className="grid size-6 place-items-center rounded-full bg-foreground text-base leading-none text-white"
              >
                ×
              </span>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
