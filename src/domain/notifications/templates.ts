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

const templates: Record<string, TemplateFn> = {
  "request-completed": (data) => ({
    subject: "Заявката ви е изпълнена",
    text: `Заявката „${data.title}“ е изпълнена. Моля, потвърдете и оценете работата в DOMORA.`,
    html: `<p>Заявката „${escapeHtml(data.title)}“ е изпълнена.</p><p>Моля, потвърдете и оценете работата в DOMORA.</p>`,
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
