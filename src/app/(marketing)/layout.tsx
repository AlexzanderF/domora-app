import { SkipLink } from "@/components/skip-link";
import { PlansFooter } from "@/features/plans/plans-footer";
import { PlansHeader } from "@/features/plans/plans-header";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SkipLink />
      <PlansHeader />
      {children}
      <PlansFooter />
    </>
  );
}
