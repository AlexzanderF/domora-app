import Link from "next/link";
import styles from "./hero.module.css";

const trustBadges = [
  "100% проверени специалисти",
  "Фиксирани цени",
  "Застраховани услуги",
];

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="landing-hero-title">
      <div className={styles.content}>
        <p className={styles.eyebrow}>ГРИЖА ЗА ДОМА БЕЗ ИЗЛИШНИ ГРИЖИ</p>
        <h1 id="landing-hero-title" className={styles.title}>
          Спокойствие за вашия дом — надеждни домашни услуги и абонаменти
        </h1>
        <p className={styles.description}>
          Планирайте почистване, ремонти и редовна поддръжка с ясни цени и
          проверени специалисти на едно място.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryAction} href="/signup">
            Регистрирай се
          </Link>
          <Link className={styles.secondaryAction} href="#services">
            Разгледай услугите
          </Link>
        </div>
        <ul className={styles.trustBadges} aria-label="Предимства на DOMORA">
          {trustBadges.map((badge) => (
            <li key={badge}>
              <span aria-hidden="true">✓</span>
              {badge}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.visual} aria-hidden="true">
        <div className={styles.sun} />
        <svg
          className={styles.home}
          viewBox="0 0 360 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M55 143 180 42l125 101v116a17 17 0 0 1-17 17H72a17 17 0 0 1-17-17V143Z"
            fill="currentColor"
          />
          <path
            d="m31 159 149-121 149 121M104 276V150h152v126"
            stroke="white"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M137 197h86M137 229h58"
            stroke="#1B594B"
            strokeWidth="12"
            strokeLinecap="round"
          />
        </svg>
        <div className={styles.visualLabel}>
          <span>DOMORA</span>
          <strong>Домът ви е в добри ръце.</strong>
        </div>
      </div>
    </section>
  );
}
