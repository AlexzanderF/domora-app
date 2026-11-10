import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";

export function PlansFooter() {
  return (
    <footer className="w-full border-t border-tone-dce5df bg-tone-143b32 py-6 text-xs text-tone-dce8e3">
      <PageContainer
        size="plans"
        className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_auto_1fr]"
      >
        <Link
          href="/"
          aria-label="DOMORA начало"
          className="font-[850] tracking-[0.1em] text-white no-underline"
        >
          DOMORA
        </Link>
        <span>DOMORA © 2026</span>
        <span className="justify-self-start lg:justify-self-end">
          Демонстрационен прототип · без реално плащане
        </span>
      </PageContainer>
    </footer>
  );
}
