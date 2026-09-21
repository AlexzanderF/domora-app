import { PlansFooter } from "@/features/plans/plans-footer";
import { PlansHeader } from "@/features/plans/plans-header";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a href="#main" className="skip-link">
        Към съдържанието
      </a>
      <PlansHeader />
      {children}
      <PlansFooter />
    </>
  );
}
