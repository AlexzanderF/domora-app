import type { Metadata } from "next";
import Link from "next/link";
import styles from "./auth.module.css";

export const metadata: Metadata = {
  title: "Вход и регистрация | DOMORA",
  description: "Вход и регистрация в платформата за грижа за дома DOMORA.",
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <Link href="/" className={styles.backLink}>
          <span aria-hidden="true">←</span>
          <span>Към началната страница</span>
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.brandHeader}>
          <Link href="/" className={styles.brand} aria-label="DOMORA начало">
            <span className={styles.mark} aria-hidden="true">
              ⌂
            </span>
            <span>DOMORA</span>
          </Link>
          <p className={styles.tagline}>Вашият дом. Нашата грижа.</p>
        </div>

        <div className={styles.card}>{children}</div>
      </main>

      <footer className={styles.footer}>
        <p>DOMORA © 2026 · Всички права запазени.</p>
      </footer>
    </div>
  );
}
