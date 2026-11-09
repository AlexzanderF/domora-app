import Link from "next/link";

export function PlansFooter() {
  return (
    <footer className="grid w-full grid-cols-[1fr_auto_1fr] border-t border-[#dce5df] bg-[#143b32] px-[max(1.5rem,calc((100%-1180px)/2))] py-6 text-[0.78rem] text-[#dce8e3] max-[820px]:grid-cols-1 max-[820px]:gap-2">
      <Link
        href="/"
        aria-label="DOMORA начало"
        className="font-[850] tracking-[0.1em] text-white no-underline"
      >
        DOMORA
      </Link>
      <span className="max-[700px]:mt-1.5">DOMORA © 2026</span>
      <span className="justify-self-end max-[820px]:justify-self-start max-[700px]:mt-1.5">
        Демонстрационен прототип · без реално плащане
      </span>
    </footer>
  );
}
