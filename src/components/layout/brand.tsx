import Link from "next/link";

export function Brand() {
  return (
    <Link
      href="/"
      aria-label="DOMORA начало"
      className="inline-flex min-h-11 items-center gap-2.5 text-[20px] font-extrabold tracking-[0.12em] whitespace-nowrap text-primary no-underline"
    >
      <span
        className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-primary text-[20px] tracking-normal text-white"
        aria-hidden="true"
      >
        ⌂
      </span>
      DOMORA
    </Link>
  );
}
