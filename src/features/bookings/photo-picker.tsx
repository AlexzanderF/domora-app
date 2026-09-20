"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";

export function PhotoPicker() {
  const [previews, setPreviews] = useState<string[]>([]);
  const notify = useToast();
  useEffect(
    () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
    [previews],
  );
  return (
    <>
      <label>
        Снимки <span className="muted">· по желание, само локален преглед</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length > 5) notify("Можете да изберете до 5 снимки.");
            const validFiles = files.slice(0, 5).filter((file) => {
              if (
                file.type.startsWith("image/") &&
                file.size <= 10 * 1024 * 1024
              )
                return true;
              notify("Използвайте изображения до 10 MB.");
              return false;
            });
            setPreviews(validFiles.map((file) => URL.createObjectURL(file)));
          }}
        />
      </label>
      <div id="previews">
        {previews.map((url, index) => (
          <Image
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
