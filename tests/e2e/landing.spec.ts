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

test("explains how DOMORA works in three responsive steps", async ({
  page,
}) => {
  await page.goto("/");

  const explainer = page.getByRole("region", { name: "Как работи DOMORA" });
  await expect(
    explainer.getByRole("heading", { level: 2, name: "Как работи DOMORA" }),
  ).toBeVisible();

  const steps = explainer.getByRole("listitem");
  await expect(steps).toHaveCount(3);
  await expect(steps.nth(0)).toContainText("Избор на услуга или абонамент");
  await expect(steps.nth(1)).toContainText("Проверен специалист на адрес");
  await expect(steps.nth(2)).toContainText("Лесно плащане и спокойствие");

  const positions = await steps.evaluateAll((items) =>
    items.map((item) => {
      const { x, y } = item.getBoundingClientRect();
      return { x, y };
    }),
  );

  if ((page.viewportSize()?.width ?? 0) <= 700) {
    expect(positions[1]?.y).toBeGreaterThan(positions[0]?.y ?? 0);
    expect(positions[2]?.y).toBeGreaterThan(positions[1]?.y ?? 0);
  } else {
    expect(positions[1]?.x).toBeGreaterThan(positions[0]?.x ?? 0);
    expect(positions[2]?.x).toBeGreaterThan(positions[1]?.x ?? 0);
  }
});
