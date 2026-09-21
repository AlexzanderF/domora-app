"use client";

import { useState, type FormEvent } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { useDemo } from "@/features/requests/demo-provider";
import type { Tariffs } from "@/features/requests/types";
import { categories } from "@/features/services/catalog";
import { updateTariffsAction } from "@/features/admin/server/actions";

export interface TariffFormProps {
  initialTariffs?: Tariffs | null;
}

export function TariffForm({ initialTariffs }: TariffFormProps = {}) {
  const { tariffs: demoTariffs, updateTariffs } = useDemo();
  const tariffs = initialTariffs ?? demoTariffs;
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
      updateTariffs(next);
      if (result.mode === "db" && result.success) {
        notify("Тарифите са обновени успешно.");
      } else {
        notify("Демо тарифите са обновени.");
      }
    } catch {
      updateTariffs(next);
      notify("Демо тарифите са обновени.");
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
          <button className="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Запазване..." : "Запази тарифите"}
          </button>
        </form>
      </div>
    </>
  );
}
