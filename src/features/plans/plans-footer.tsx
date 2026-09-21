import Link from "next/link";
import styles from "./plans.module.css";

export function PlansFooter() {
  return (
    <footer className={styles.siteFooter}>
      <Link href="/" aria-label="DOMORA начало">
        DOMORA
      </Link>
      <span>DOMORA © 2026</span>
      <span>Демонстрационен прототип · без реално плащане</span>
    </footer>
  );
}
