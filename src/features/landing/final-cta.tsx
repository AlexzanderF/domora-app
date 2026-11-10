import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section
      className="mb-[clamp(4rem,8vw,7rem)] flex items-center justify-between gap-12 overflow-hidden rounded-3xl bg-[#174c41] p-[clamp(2rem,6vw,4.5rem)] text-white max-[560px]:flex-col max-[560px]:items-stretch max-[560px]:gap-7 max-[560px]:rounded-[18px]"
      aria-labelledby="final-cta-title"
    >
      <div className="max-w-[760px]">
        <p className="mt-0 mb-3 text-[0.72rem] font-[850] tracking-[0.15em] text-accent">
          ВАШИЯТ ДОМ. НАШАТА ГРИЖА.
        </p>
        <h2
          id="final-cta-title"
          className="text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.04em]"
        >
          Готови ли сте за по-спокоен и чист дом?
        </h2>
        <span className="mt-4 block text-[#d8e6e1]">
          Създайте профил и организирайте първата си услуга за няколко минути.
        </span>
      </div>
      <Button
        asChild
        className="shrink-0 rounded-[10px] bg-accent px-[1.3rem] py-[0.95rem] font-extrabold text-[#17362f] hover:bg-[#e5f6a3] max-[560px]:text-center"
      >
        <Link href="/signup">Регистрирай се безплатно</Link>
      </Button>
    </section>
  );
}
