import Link from "next/link";
import styles from "./landing-chrome.module.css";

export function FinalCta() {
  return (
    <section className={styles.finalCta} aria-labelledby="final-cta-title">
      <div>
        <p>ВАШИЯТ ДОМ. НАШАТА ГРИЖА.</p>
        <h2 id="final-cta-title">Готови ли сте за по-спокоен и чист дом?</h2>
        <span>
          Създайте профил и организирайте първата си услуга за няколко минути.
        </span>
      </div>
      <Link href="/signup">Регистрирай се безплатно</Link>
    </section>
  );
}
