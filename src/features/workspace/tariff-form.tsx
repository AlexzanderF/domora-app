"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useToast } from "@/components/ui/toast-provider";
import type { Tariffs } from "@/features/requests/types";
import { categories } from "@/features/services/catalog";
import { updateTariffsAction } from "@/features/admin/server/actions";

export interface TariffFormProps {
  initialTariffs: Tariffs;
}

export function TariffForm({ initialTariffs: tariffs }: TariffFormProps) {
  const router = useRouter();
  const notify = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const data = new FormData(event.currentTarget);
    const next: Tariffs = {
      categories: { ...tariffs.categories },
      home: Number(data.get("home")),
      entry: Number(data.get("entry")),
    };
    for (const category of categories) {
      next.categories[category.id] = Number(data.get(`rate${category.id}`));
    }

    setIsSubmitting(true);
    try {
      const result = await updateTariffsAction(next);
      if (!result.success) {
        notify(result.error ?? "Тарифите не можаха да бъдат обновени.");
        return;
      }
      notify("Тарифите са обновени успешно.");
      router.refresh();
    } catch {
      notify("Тарифите не можаха да бъдат обновени. Опитайте отново.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="sectionhead">
        <h2>Тарифи за услуги</h2>
      </div>
      <div className="card">
        <p className="muted">
          Цените се прилагат за нови заявки. Съществуващите запазват одобрената
          цена.
        </p>
        <form onSubmit={submit}>
          <div className="priceinputs">
            {categories.map((category) => (
              <label key={category.id}>
                {category.name} · базова цена (€)
                <input
                  type="number"
                  min="1"
                  max="10000"
                  required
                  name={`rate${category.id}`}
                  defaultValue={tariffs.categories[category.id]}
                />
              </label>
            ))}
            <label>
              За дома · €/м² месечно
              <input
                name="home"
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                required
                defaultValue={tariffs.home}
              />
            </label>
            <label>
              За входа · €/етаж месечно
              <input
                name="entry"
                type="number"
                min="1"
                max="1000"
                required
                defaultValue={tariffs.entry}
              />
            </label>
          </div>
          <button
            className="primary"
            type="submit"
            disabled={isSubmitting}
            aria-label="Запази тарифите"
          >
            {isSubmitting ? "Запазване..." : "Запази тарифите"}
          </button>
        </form>
      </div>
    </>
  );
}
