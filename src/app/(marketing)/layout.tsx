import { SkipLink } from "@/components/skip-link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SkipLink />
      <SiteHeader variant="plans" size="plans" />
      {children}
      <SiteFooter
        size="plans"
        note="Демонстрационен прототип · без реално плащане"
      />
    </>
  );
}
