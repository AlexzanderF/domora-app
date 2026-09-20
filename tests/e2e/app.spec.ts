import { expect, test, type Page } from "@playwright/test";

async function fillBooking(page: Page) {
  await page
    .getByLabel("Описание на проблема")
    .fill("Тестова заявка за ремонт.");
  await page.getByLabel("Адрес", { exact: true }).fill("София, ул. Тестова 42");
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const tomorrow = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  await page.getByLabel("Предпочитана дата").fill(tomorrow);
}

test("renders real routes, supports browser history and fits the viewport", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Спокойствие за вашия дом.",
  );
  await expect(
    page.getByRole("button", { name: "ВиК", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Абонаменти", exact: true }).click();
  await expect(page).toHaveURL(/\/plans\/?$/);
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Спокойствие за вашия дом.",
  );
  for (const route of ["/requests", "/plans", "/specialist", "/admin"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("creates a request, keeps it across navigation and allows cancellation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Електро", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".quote strong")).toContainText("35");
  await fillBooking(page);
  await page.getByRole("button", { name: "Изпрати демо заявка" }).click();
  await expect(page).toHaveURL(/\/requests\/?$/);
  const request = page.getByRole("article", {
    name: "Смяна на контакт",
    exact: true,
  });
  await expect(request).toContainText("София, ул. Тестова 42");
  await page.getByRole("link", { name: "Абонаменти", exact: true }).click();
  await page.getByRole("link", { name: "Моите заявки", exact: true }).click();
  await expect(request).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await request.getByRole("button", { name: "Откажи заявката" }).click();
  await expect(request).toContainText("Отказана");
  await expect(request.getByRole("button")).toHaveCount(0);
});

test("books both subscription types with their own quantities and prices", async ({
  page,
}) => {
  await page.goto("/plans");
  await page.getByRole("button", { name: "Избери „За дома“" }).click();
  await expect(
    page.getByRole("combobox", { name: "Категория", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Площ на дома (м²)").fill("100");
  await expect(page.locator(".quote strong")).toContainText("150");
  await fillBooking(page);
  await page.getByRole("button", { name: "Изпрати демо заявка" }).click();
  await expect(
    page.getByRole("article", { name: "Абонамент За дома", exact: true }),
  ).toContainText("150");
  await page.getByRole("link", { name: "Абонаменти", exact: true }).click();
  await page.getByRole("button", { name: "Избери „За входа“" }).click();
  await expect(page.getByLabel("Брой етажи")).toHaveValue("6");
  await expect(page.locator(".quote strong")).toContainText("108");
  await fillBooking(page);
  await page.getByRole("button", { name: "Изпрати демо заявка" }).click();
  await expect(
    page.getByRole("article", { name: "Абонамент За входа", exact: true }),
  ).toContainText("108");
});

test("staff complete work with a report and the client confirms and rates", async ({
  page,
}) => {
  await page.goto("/specialist");
  const request = page.getByRole("article", {
    name: "Смяна на смесител",
    exact: true,
  });
  await request.getByRole("button", { name: "Следващ статус" }).click();
  await expect(request).toContainText("Специалистът пътува");
  await request.getByRole("button", { name: "Следващ статус" }).click();
  page.once("dialog", (dialog) =>
    dialog.accept("Смесителят е сменен успешно."),
  );
  await request.getByRole("button", { name: "Добави отчет" }).click();
  await expect(request).toContainText("Очаква потвърждение");
  await page.getByRole("link", { name: "Моите заявки", exact: true }).click();
  await expect(request).toContainText("Смесителят е сменен успешно.");
  await request.getByRole("button", { name: "Потвърди приключването" }).click();
  await request.getByRole("button", { name: "5 звезди" }).click();
  await expect(request).toContainText("Оценка: 5/5");
});

test("tariff changes affect new bookings without rewriting existing prices", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.getByLabel("ВиК · базова цена (€)").fill("90");
  await page.getByRole("button", { name: "Запази демо тарифите" }).click();
  await page.getByRole("link", { name: "Моите заявки", exact: true }).click();
  await expect(
    page
      .getByRole("article", { name: "Смяна на смесител", exact: true })
      .locator(".amount"),
  ).toContainText("45");
  await page.getByRole("button", { name: "+ Нова заявка" }).click();
  await expect(page.locator(".quote strong")).toContainText("90");
  await page
    .getByRole("combobox", { name: "Услуга", exact: true })
    .selectOption("1");
  await expect(page.locator(".quote strong")).toContainText("25");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("invalid booking stays open and photo previews reset on close", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ Нова заявка" }).click();
  await page.getByRole("button", { name: "Изпрати демо заявка" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({
    name: "test.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO9sAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(
    page.getByRole("img", { name: "Преглед на избрана снимка 1" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Затвори" }).click();
  await page.getByRole("button", { name: "+ Нова заявка" }).click();
  await expect(page.locator("#previews img")).toHaveCount(0);
});
