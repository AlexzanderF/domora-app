"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-provider";
import type { Tariffs } from "@/domain/requests/types";
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
      <div className="mt-7 mb-[18px] flex items-center justify-between">
        <h2>Тарифи за услуги</h2>
      </div>
      <Card>
        <p className="text-[14px] text-muted-foreground">
          Цените се прилагат за нови заявки. Съществуващите запазват одобрената
          цена.
        </p>
        <form onSubmit={submit}>
          <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
            {categories.map((category) => (
              <Label key={category.id} className="mb-3.5">
                {category.name} · базова цена (€)
                <Input
                  type="number"
                  min="1"
                  max="10000"
                  required
                  name={`rate${category.id}`}
                  defaultValue={tariffs.categories[category.id]}
                />
              </Label>
            ))}
            <Label className="mb-3.5">
              За дома · €/м² месечно
              <Input
                name="home"
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                required
                defaultValue={tariffs.home}
              />
            </Label>
            <Label className="mb-3.5">
              За входа · €/етаж месечно
              <Input
                name="entry"
                type="number"
                min="1"
                max="1000"
                required
                defaultValue={tariffs.entry}
              />
            </Label>
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            aria-label="Запази тарифите"
          >
            {isSubmitting ? "Запазване..." : "Запази тарифите"}
          </Button>
        </form>
      </Card>
    </>
  );
}
