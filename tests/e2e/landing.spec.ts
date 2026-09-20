import { expect, test } from "@playwright/test";

test("landing hero presents the value proposition and clear next steps", async ({
  page,
}) => {
  await page.goto("/");

  const hero = page.getByRole("region", { name: "Спокойствие за вашия дом" });
  await expect(
    hero.getByRole("heading", {
      level: 1,
      name: "Спокойствие за вашия дом — надеждни домашни услуги и абонаменти",
    }),
  ).toBeVisible();
  await expect(
    hero.getByRole("link", { name: "Регистрирай се" }),
  ).toHaveAttribute("href", "/signup");
  await expect(
    hero.getByRole("link", { name: "Разгледай услугите" }),
  ).toHaveAttribute("href", "#services");

  for (const trustBadge of [
    "100% проверени специалисти",
    "Фиксирани цени",
    "Застраховани услуги",
  ]) {
    await expect(
      hero.getByRole("listitem").filter({ hasText: trustBadge }),
    ).toBeVisible();
  }
});
