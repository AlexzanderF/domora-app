import Link from "next/link";
import styles from "./plans.module.css";

export function PlansHeader() {
  return (
    <header className={styles.siteHeader}>
      <nav className={styles.navigation} aria-label="Навигация за абонаменти">
        <Link className={styles.brand} href="/" aria-label="DOMORA начало">
          <span aria-hidden="true">⌂</span>
          DOMORA
        </Link>
        <div className={styles.navLinks}>
          <Link href="/">Начало</Link>
          <Link href="/requests">Моите заявки</Link>
        </div>
        <Link className={styles.dashboardLink} href="/requests">
          Към таблото
        </Link>
      </nav>
    </header>
  );
}
