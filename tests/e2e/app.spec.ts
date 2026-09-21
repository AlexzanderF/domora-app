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
    "Спокойствие за вашия дом — надеждни домашни услуги и абонаменти",
  );
  await expect(
    page.getByRole("heading", { name: "Основно почистване" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Разгледай абонаментите", exact: true })
    .click();
  await expect(page).toHaveURL(/\/plans\/?$/);
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Спокойствие за вашия дом — надеждни домашни услуги и абонаменти",
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
  await page.goto("/requests");
  await page.getByRole("button", { name: "+ Нова заявка" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("combobox", { name: "Категория", exact: true })
    .selectOption("1");
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

test("configures and books a subscription from the standalone plans page", async ({
  page,
}) => {
  await page.goto("/plans");
  await expect(
    page.getByRole("navigation", { name: "Основна навигация" }),
  ).toHaveCount(0);
  const plansNavigation = page.getByRole("navigation", {
    name: "Навигация за абонаменти",
  });
  await expect(
    plansNavigation.getByRole("link", { name: "Начало", exact: true }),
  ).toBeVisible();
  await expect(
    plansNavigation.getByRole("link", { name: "Моите заявки" }),
  ).toBeVisible();
  await expect(
    plansNavigation.getByRole("link", { name: "Към таблото" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "За входа" }).click();
  await expect(page.getByLabel("Брой етажи")).toHaveValue("6");
  await expect(
    page.getByRole("complementary", { name: "За входа" }).getByText(/216\s*€/),
  ).toBeVisible();
  await page.getByRole("button", { name: "За дома" }).click();

  const summary = page.getByRole("complementary", { name: "За дома" });
  await page.getByLabel("Площ на дома").fill("100");
  await expect(summary.getByText(/300\s*€/)).toBeVisible();
  await page.getByRole("button", { name: "4 посещения" }).click();
  await expect(summary.getByText(/540\s*€/)).toBeVisible();
  await expect(page.getByText("10% отстъпка за редовна грижа")).toBeVisible();

  await page.getByRole("button", { name: "Изпрати заявка" }).click();
  await expect(page.getByText("Въведете адрес на имота.")).toBeVisible();
  await expect(
    page.getByText("Изберете предпочитана начална дата."),
  ).toBeVisible();
  await expect(page.getByText("Изберете часови диапазон.")).toBeVisible();

  await page.getByLabel("Адрес на имота").fill("София, ул. Тестова 42");
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const month = new Intl.DateTimeFormat("bg-BG", { month: "long" }).format(
    date,
  );
  await page.getByLabel("Предпочитана начална дата").click();
  await page
    .getByRole("dialog", { name: "Избор на дата" })
    .getByRole("button", {
      name: new RegExp(`${date.getDate()}.*${month}`, "i"),
    })
    .click();
  const formattedDate = [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    date.getFullYear(),
  ].join(".");
  const dateTrigger = page.getByLabel("Предпочитана начална дата");
  await expect(dateTrigger).toContainText(formattedDate);
  await expect(dateTrigger).not.toContainText("г.");
  await page.getByLabel("Часови диапазон").selectOption("09:00–12:00");
  await page.getByRole("button", { name: "Изпрати заявка" }).click();

  await expect(page).toHaveURL(/\/requests\/?$/);
  const request = page.getByRole("article", {
    name: "Абонамент За дома",
    exact: true,
  });
  await expect(request).toBeVisible();
  await expect(request).toContainText("4 посещения / месец · 100 м²");
  await expect(request.locator(".amount")).toContainText("540");
  await expect(page.getByRole("status")).toContainText(
    "Абонаментната заявка е създадена успешно.",
  );
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
  await page.goto("/requests");
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
