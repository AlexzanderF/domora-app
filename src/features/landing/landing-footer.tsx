import Link from "next/link";
import styles from "./landing-chrome.module.css";

export function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <Link href="/">DOMORA</Link>
          <p>Надеждна грижа за дома, когато имате нужда от нея.</p>
        </div>
        <div className={styles.footerColumn}>
          <strong>Разгледайте</strong>
          <Link href="#how-it-works">Как работи</Link>
          <Link href="#services">Услуги</Link>
          <Link href="/plans">Абонаменти</Link>
        </div>
        <div className={styles.footerColumn}>
          <strong>Контакти</strong>
          <a href="tel:+35924920024">+359 2 492 00 24</a>
          <a href="mailto:hello@domora.bg">hello@domora.bg</a>
        </div>
        <div className={styles.footerColumn}>
          <strong>Правна информация</strong>
          <Link href="/terms">Условия за ползване</Link>
          <Link href="/privacy">Поверителност</Link>
        </div>
      </div>
      <div className={styles.copyright}>
        <span>DOMORA © 2026</span>
        <span>Грижа за дома с ясен стандарт.</span>
      </div>
    </footer>
  );
}
