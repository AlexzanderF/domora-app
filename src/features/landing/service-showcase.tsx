import Link from "next/link";
import { initialTariffs } from "@/features/requests/demo-data";
import type { CategoryId } from "@/features/requests/types";
import { categories } from "@/features/services/catalog";
import { ServiceIcon } from "@/features/services/service-icon";
import { money } from "@/lib/format";
import styles from "./service-showcase.module.css";

const highlights: {
  categoryId: CategoryId;
  title: string;
  description: string;
  price: string;
  href: "/requests" | "/plans";
  action: string;
}[] = [
  {
    categoryId: 4,
    title: "Основно почистване",
    description:
      "Цялостна грижа за подове, кухня и санитарни помещения от подбран екип.",
    price: `от ${money(initialTariffs.categories[4])}`,
    href: "/requests",
    action: "Заяви услуга",
  },
  {
    categoryId: 4,
    title: "Поддръжка на вход",
    description:
      "Редовен график за чисти и приветливи общи части през целия месец.",
    price: `от ${money(initialTariffs.entry)} / етаж`,
    href: "/plans",
    action: "Избери план",
  },
  {
    categoryId: 3,
    title: "Домашни ремонти",
    description:
      "Надеждна помощ за малки ремонти и подобрения с ясна оферта предварително.",
    price: `оглед от ${money(initialTariffs.categories[3])}`,
    href: "/requests",
    action: "Заяви услуга",
  },
];

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
        {highlights.map((highlight) => {
          const category = categories.find(
            ({ id }) => id === highlight.categoryId,
          );

          return (
            <li key={highlight.title} className={styles.card}>
              <div className={styles.icon} aria-hidden="true">
                <ServiceIcon category={highlight.categoryId} />
              </div>
              <span className={styles.category}>{category?.name}</span>
              <h3>{highlight.title}</h3>
              <p>{highlight.description}</p>
              <strong>{highlight.price}</strong>
              <Link href={highlight.href}>{highlight.action} →</Link>
            </li>
          );
        })}
      </ul>

      <div className={styles.comparison}>
        <div>
          <span>ПО-МАЛКО ЗАДАЧИ. ПОВЕЧЕ ВРЕМЕ.</span>
          <h3>Спестете до 20% с месечен абонамент</h3>
          <p>
            Един график, познат екип и предвидима месечна цена — без ново
            търсене при всяко посещение.
          </p>
        </div>
        <Link href="/plans">Разгледай абонаментите</Link>
      </div>
    </section>
  );
}
