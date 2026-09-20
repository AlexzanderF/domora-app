import Link from "next/link";
import { BookingCta } from "@/features/bookings/booking-cta";
import { landingServiceHighlights } from "@/features/services/landing-catalog";
import { ServiceIcon } from "@/features/services/service-icon";
import { money } from "@/lib/format";
import styles from "./service-showcase.module.css";

export function ServiceShowcase() {
  return (
    <section
      id="services"
      className={styles.section}
      aria-labelledby="services-title"
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>ЗА ВСЕКИ ДОМ</p>
          <h2 id="services-title">Услуги и абонаменти</h2>
        </div>
        <p>
          Изберете еднократна помощ или постоянна грижа с предвидим график и
          цена.
        </p>
      </div>

      <ul className={styles.cards}>
        {landingServiceHighlights.map((highlight) => (
          <li key={highlight.title} className={styles.card}>
            <div className={styles.icon} aria-hidden="true">
              <ServiceIcon category={highlight.category.id} />
            </div>
            <span className={styles.category}>{highlight.category.name}</span>
            <h3>{highlight.title}</h3>
            <p>{highlight.description}</p>
            <strong>
              {highlight.pricePrefix} {money(highlight.startingPrice)}{" "}
              {highlight.priceSuffix}
            </strong>
            {highlight.action.type === "booking" ? (
              <BookingCta
                category={highlight.category.id}
                className={styles.cardAction}
              >
                {highlight.action.label} →
              </BookingCta>
            ) : (
              <Link href={highlight.action.href} className={styles.cardAction}>
                {highlight.action.label} →
              </Link>
            )}
          </li>
        ))}
      </ul>

      <div className={styles.comparison}>
        <div>
          <span>ПО-МАЛКО ЗАДАЧИ. ПОВЕЧЕ ВРЕМЕ.</span>
          <h3>Спестете до 20% с месечен абонамент</h3>
          <p>
            Един график, познат екип и предвидима месечна цена — без ново
            търсене при всяко посещение.
          </p>
          <div className={styles.comparisonDetails}>
            <span>
              <small>Еднократни посещения</small>
              <strong>Стандартна цена при всяка заявка</strong>
            </span>
            <span>
              <small>Месечен абонамент</small>
              <strong>До 20% по-ниска обща цена</strong>
            </span>
          </div>
        </div>
        <Link href="/plans">Разгледай абонаментите</Link>
      </div>
    </section>
  );
}
