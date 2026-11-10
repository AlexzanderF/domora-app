"use server";

import { UserStatus } from "@/domain/identity/types";
import { setSpecialistStatus } from "@/domain/identity";
import { runAction } from "@/lib/server/action";
import type { ActionResult } from "@/lib/server/action";
import { saveTariffs } from "@/domain/pricing/tariffs";
import type { Tariffs } from "@/domain/requests/types";

export type UpdateSpecialistStatusResult = ActionResult;

export type UpdateTariffsResult = ActionResult;

export async function updateSpecialistStatusAction(
  userId: number,
  status: UserStatus,
): Promise<UpdateSpecialistStatusResult> {
  return runAction({
    messages: {
      UNAUTHENTICATED:
        "Неоторизиран достъп. Изискват се администраторски права.",
      FORBIDDEN: "Неоторизиран достъп. Изискват се администраторски права.",
      NOT_FOUND: "Специалистът не е намерен.",
      INVALID_INPUT: "Невалиден статус на специалист.",
    },
    revalidate: ["specialists"],
    run: async (actor) => {
      await setSpecialistStatus(actor, userId, status);
    },
  });
}

export async function updateTariffsAction(
  input: Tariffs,
): Promise<UpdateTariffsResult> {
  return runAction({
    messages: {
      UNAUTHENTICATED:
        "Неоторизиран достъп. Изискват се администраторски права.",
      FORBIDDEN: "Неоторизиран достъп. Изискват се администраторски права.",
      INVALID_INPUT: "Невалидни цени. Проверете въведените стойности.",
    },
    revalidate: ["tariffs"],
    run: async (actor) => {
      await saveTariffs(actor, input);
    },
  });
}
