"use client";

import type { FormEvent } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { useDemo } from "@/features/requests/demo-provider";
import { categories } from "@/features/services/catalog";

export function TariffForm() {
  const { tariffs, updateTariffs } = useDemo();
  const notify = useToast();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = {
      categories: { ...tariffs.categories },
      home: Number(data.get("home")),
      entry: Number(data.get("entry")),
    };
    for (const category of categories)
      next.categories[category.id] = Number(data.get(`rate${category.id}`));
    updateTariffs(next);
    notify("Демо тарифите са обновени.");
  }
  return (
    <>
      <div className="sectionhead">
        <h2>Демонстрационни тарифи</h2>
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
          <button className="primary" type="submit">
            Запази демо тарифите
          </button>
        </form>
      </div>
    </>
  );
}
