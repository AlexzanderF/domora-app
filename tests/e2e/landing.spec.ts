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

test("shows service highlights and the value of a monthly plan", async ({
  page,
}) => {
  await page.goto("/");

  const showcase = page.getByRole("region", {
    name: "Услуги и абонаменти",
  });
  for (const category of [
    "Основно почистване",
    "Поддръжка на вход",
    "Домашни ремонти",
  ]) {
    await expect(
      showcase.getByRole("heading", { level: 3, name: category }),
    ).toBeVisible();
  }

  await expect(showcase.getByText(/Спестете до 20%/)).toBeVisible();
  await expect(
    showcase.getByRole("link", { name: "Разгледай абонаментите" }),
  ).toHaveAttribute("href", "/plans");
  await expect(
    showcase.getByRole("link", { name: "Заяви услуга" }).first(),
  ).toHaveAttribute("href", "/requests");
});

test("builds trust and answers common questions accessibly", async ({
  page,
}) => {
  await page.goto("/");

  const trust = page.getByRole("region", {
    name: "Защо да изберете DOMORA",
  });
  await expect(trust.getByRole("article")).toHaveCount(3);
  for (const benefit of [
    "Застраховка на имуществото",
    "Фиксирани прозрачни цени",
    "Проверени специалисти с рейтинг",
  ]) {
    await expect(
      trust.getByRole("heading", { level: 3, name: benefit }),
    ).toBeVisible();
  }

  const faq = page.getByRole("region", {
    name: "Често задавани въпроси",
  });
  const paymentQuestion = faq.getByText("Как се извършва плащането?", {
    exact: true,
  });
  const paymentAnswer = faq.getByText(/Плащате сигурно след потвърждение/);
  await expect(paymentAnswer).toBeHidden();
  await paymentQuestion.focus();
  await page.keyboard.press("Enter");
  await expect(paymentAnswer).toBeVisible();
});
