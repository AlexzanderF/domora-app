import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section
      className="mb-12 md:mb-20 lg:mb-28 flex flex-col items-stretch justify-between gap-7 overflow-hidden rounded-[18px] bg-[#174c41] p-6 md:p-12 lg:p-16 text-white sm:flex-row sm:items-center sm:gap-12 sm:rounded-3xl"
      aria-labelledby="final-cta-title"
    >
      <div className="max-w-[760px]">
        <p className="mt-0 mb-3 text-xs font-[850] tracking-[0.15em] text-accent">
          ВАШИЯТ ДОМ. НАШАТА ГРИЖА.
        </p>
        <h2
          id="final-cta-title"
          className="text-3xl md:text-4xl lg:text-5xl tracking-[-0.04em]"
        >
          Готови ли сте за по-спокоен и чист дом?
        </h2>
        <span className="mt-4 block text-[#d8e6e1]">
          Създайте профил и организирайте първата си услуга за няколко минути.
        </span>
      </div>
      <Button
        asChild
        className="w-full shrink-0 rounded-[10px] bg-accent px-[1.3rem] py-[0.95rem] text-center font-extrabold text-[#17362f] hover:bg-[#e5f6a3] sm:w-auto sm:text-left"
      >
        <Link href="/signup">Регистрирай се безплатно</Link>
      </Button>
    </section>
  );
}
