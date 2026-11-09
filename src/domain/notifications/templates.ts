// Plain Bulgarian templates: each is a function from data to subject, text
// and HTML. No template engine; add a function here for each new message.

export interface RenderedMessage {
  subject: string;
  text: string;
  html: string;
}

type TemplateFn = (data: Record<string, unknown>) => RenderedMessage;

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: "Спешна",
  EMERGENCY: "Аварийна",
  HOLIDAY: "В почивен ден",
};

function priorityLabel(priority: unknown): string {
  return PRIORITY_LABELS[String(priority)] ?? String(priority);
}

const templates: Record<string, TemplateFn> = {
  "request-completed": (data) => ({
    subject: "Заявката ви е изпълнена",
    text: `Заявката „${data.title}“ е изпълнена. Моля, потвърдете и оценете работата в DOMORA.`,
    html: `<p>Заявката „${escapeHtml(data.title)}“ е изпълнена.</p><p>Моля, потвърдете и оценете работата в DOMORA.</p>`,
  }),
  "request-accepted": (data) => ({
    subject: "Заявката ви е приета",
    text: `Заявката „${data.title}“ е приета от специалист. Подробности ще намерите в DOMORA.`,
    html: `<p>Заявката „${escapeHtml(data.title)}“ е приета от специалист.</p><p>Подробности ще намерите в DOMORA.</p>`,
  }),
  "report-submitted": (data) => ({
    subject: "Получихте отчет за извършената работа",
    text: `Специалистът подаде отчет за заявката „${data.title}“. Моля, прегледайте го и потвърдете изпълнението в DOMORA.`,
    html: `<p>Специалистът подаде отчет за заявката „${escapeHtml(data.title)}“.</p><p>Моля, прегледайте го и потвърдете изпълнението в DOMORA.</p>`,
  }),
  "new-opportunity": (data) => ({
    subject: "Нова заявка във вашия район",
    text: `Има нова заявка „${data.title}“ на адрес ${data.address}, която отговаря на вашия профил. Вижте я в DOMORA.`,
    html: `<p>Има нова заявка „${escapeHtml(data.title)}“ на адрес ${escapeHtml(data.address)}, която отговаря на вашия профил.</p><p>Вижте я в DOMORA.</p>`,
  }),
  "request-recommended": (data) => ({
    subject: "Препоръчана ви е заявка",
    text: `Администратор ви препоръча заявката „${data.title}“ на адрес ${data.address}. Приемете или откажете я в DOMORA.`,
    html: `<p>Администратор ви препоръча заявката „${escapeHtml(data.title)}“ на адрес ${escapeHtml(data.address)}.</p><p>Приемете или откажете я в DOMORA.</p>`,
  }),
  "urgent-unassigned": (data) => ({
    subject: `Неразпределена заявка: ${priorityLabel(data.priority)}`,
    text: `Заявката „${data.title}“ на адрес ${data.address} е с приоритет „${priorityLabel(data.priority)}“ и все още няма специалист. Разпределете я в DOMORA.`,
    html: `<p>Заявката „${escapeHtml(data.title)}“ на адрес ${escapeHtml(data.address)} е с приоритет „${escapeHtml(priorityLabel(data.priority))}“ и все още няма специалист.</p><p>Разпределете я в DOMORA.</p>`,
  }),
  "specialist-registered": (data) => ({
    subject: "Нов специалист чака одобрение",
    text: `${data.name} се регистрира като специалист и чака одобрение. Прегледайте профила в DOMORA.`,
    html: `<p>${escapeHtml(data.name)} се регистрира като специалист и чака одобрение.</p><p>Прегледайте профила в DOMORA.</p>`,
  }),
  "specialist-approved": (data) => ({
    subject: "Профилът ви е одобрен",
    text: `Здравейте, ${data.name}! Профилът ви в DOMORA е одобрен. Вече можете да приемате заявки.`,
    html: `<p>Здравейте, ${escapeHtml(data.name)}!</p><p>Профилът ви в DOMORA е одобрен. Вече можете да приемате заявки.</p>`,
  }),
  "specialist-rejected": (data) => ({
    subject: "Профилът ви не е одобрен",
    text: `Здравейте, ${data.name}! Профилът ви в DOMORA не беше одобрен. За повече информация се свържете с нас.`,
    html: `<p>Здравейте, ${escapeHtml(data.name)}!</p><p>Профилът ви в DOMORA не беше одобрен. За повече информация се свържете с нас.</p>`,
  }),
  "dispute-raised": (data) => ({
    subject: "Подаден е проблем по заявка",
    text: `Клиентът съобщи проблем по заявката „${data.title}“: ${data.note}`,
    html: `<p>Клиентът съобщи проблем по заявката „${escapeHtml(data.title)}“:</p><p>${escapeHtml(data.note)}</p>`,
  }),
  "dispute-resolved": (data) => ({
    subject: "Проблемът по заявката е разрешен",
    text: `Администратор разреши проблема по заявката „${data.title}“.${data.note ? ` Бележка: ${data.note}` : ""}`,
    html: `<p>Администратор разреши проблема по заявката „${escapeHtml(data.title)}“.</p>${data.note ? `<p>Бележка: ${escapeHtml(data.note)}</p>` : ""}`,
  }),
};

export function renderTemplate(
  name: string,
  data: Record<string, unknown>,
): RenderedMessage {
  const template = templates[name];
  if (!template) throw new Error(`Unknown notification template "${name}".`);
  return template(data);
}
