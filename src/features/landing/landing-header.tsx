import Link from "next/link";
import styles from "./landing-chrome.module.css";

export function LandingHeader() {
  return (
    <header className={styles.header}>
      <nav
        className={styles.navigation}
        aria-label="Навигация на началната страница"
      >
        <Link className={styles.brand} href="/" aria-label="DOMORA начало">
          <span aria-hidden="true">⌂</span>
          DOMORA
        </Link>
        <div className={styles.anchorLinks}>
          <Link href="#how-it-works">Как работи</Link>
          <Link href="#services">Услуги</Link>
          <Link href="#faq">ЧЗВ</Link>
        </div>
        <div className={styles.accountLinks}>
          <Link className={styles.login} href="/login">
            Вход
          </Link>
          <Link className={styles.signup} href="/signup">
            Регистрация
          </Link>
        </div>
      </nav>
    </header>
  );
}
