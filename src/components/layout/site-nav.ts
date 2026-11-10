export type SiteHeaderVariant = "public" | "plans" | "auth";

export interface SiteNavLink {
  readonly label: string;
  readonly href: string;
}

export interface SiteNav {
  readonly links: readonly SiteNavLink[];
  /** Secondary action (drawer + desktop), e.g. "Вход". */
  readonly secondary: SiteNavLink | null;
  /** Primary CTA, always visible in the bar. */
  readonly primary: SiteNavLink;
}

const PUBLIC_LINKS: readonly SiteNavLink[] = [
  { label: "Как работи", href: "/#how-it-works" },
  { label: "Услуги", href: "/#services" },
  { label: "ЧЗВ", href: "/#faq" },
  { label: "Контакти", href: "/contact" },
];

const PLANS_LINKS: readonly SiteNavLink[] = [
  { label: "Начало", href: "/" },
  { label: "Моите заявки", href: "/client/requests" },
];

export function getSiteNav(variant: SiteHeaderVariant): SiteNav {
  switch (variant) {
    case "plans":
      return {
        links: PLANS_LINKS,
        secondary: null,
        primary: { label: "Към таблото", href: "/client" },
      };
    case "auth":
      return {
        links: [],
        secondary: null,
        primary: { label: "← Към началото", href: "/" },
      };
    default:
      return {
        links: PUBLIC_LINKS,
        secondary: { label: "Вход", href: "/login" },
        primary: { label: "Регистрация", href: "/signup" },
      };
  }
}
