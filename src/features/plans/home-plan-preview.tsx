"use client";

import { useState } from "react";
import styles from "./plans.module.css";
import preview from "./home-plan-preview.module.css";

const services = [
  "ВиК",
  "Електро",
  "Климатици",
  "Ключарски услуги",
  "Дребни ремонти",
];

export function HomePlanPreview({
  onChooseEntry,
}: {
  onChooseEntry: () => void;
}) {
  const [extraVisit, setExtraVisit] = useState(false);

  return (
    <div className={styles.configurator}>
      <section className={styles.controls} aria-labelledby="configure-title">
        <div>
          <span className={styles.step}>01 / ИЗБЕРЕТЕ ПЛАН</span>
          <h2 id="configure-title">За кое пространство?</h2>
          <div className={styles.segmented} aria-label="Изберете план">
            <button type="button" aria-pressed="true">
              За дома
            </button>
            <button type="button" aria-pressed="false" onClick={onChooseEntry}>
              За входа
            </button>
          </div>
          <p className={styles.hint}>
            Един абонамент за малките задачи и проблеми у дома.
          </p>
        </div>

        <div>
          <span className={styles.step}>02 / ВКЛЮЧЕНО В АБОНАМЕНТА</span>
          <h2>Вашият майстор. Всеки месец.</h2>
          <div className={preview.visit}>
            <strong>1</strong>
            <div>
              <h3>посещение от майстор месечно</h3>
              <p>Споделете от какво имате нужда и планирайте посещението.</p>
            </div>
          </div>
          <h3 className={preview.servicesTitle}>
            За какво можете да разчитате на нас
          </h3>
          <ul className={preview.services}>
            {services.map((service) => (
              <li key={service}>
                <span aria-hidden="true">✓</span>
                {service}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <span className={styles.step}>03 / ПРИ НУЖДА ОТ ОЩЕ ПОМОЩ</span>
          <h2>Още едно посещение? Няма проблем.</h2>
          <p className={styles.hint}>
            Всяко допълнително посещение се заплаща отделно от месечния
            абонамент.
          </p>
          <label className={preview.extra}>
            <input
              type="checkbox"
              checked={extraVisit}
              onChange={(event) => setExtraVisit(event.target.checked)}
            />
            <span>
              <strong>Добави още едно посещение</strong>
              <small>С доплащане към абонамента</small>
            </span>
          </label>
        </div>
      </section>

      <aside className={styles.summary} aria-labelledby="summary-title">
        <div className={styles.summaryTop}>
          <span>ВАШИЯТ ПЛАН</span>
          <strong>Майстор за дома</strong>
        </div>
        <h2 id="summary-title">За дома</h2>
        <p>Практична помощ за вашия апартамент или къща.</p>
        <div className={preview.summaryVisits} aria-live="polite">
          <strong>{extraVisit ? "2 посещения" : "1 посещение"}</strong>
          <span>
            {extraVisit ? "1 включено + 1 с доплащане" : "включено всеки месец"}
          </span>
        </div>
        <dl className={preview.prices}>
          <div>
            <dt>Месечен абонамент</dt>
            <dd>Предстои обявяване</dd>
          </div>
          <div>
            <dt>Допълнително посещение</dt>
            <dd>Предстои обявяване</dd>
          </div>
        </dl>
        <p className={styles.hint}>
          ВиК · Електро · Климатици · Ключарски услуги · Дребни ремонти
        </p>
        <button
          type="button"
          className={`${styles.submit} ${preview.unavailable}`}
          disabled
        >
          Абонирането предстои
        </button>
        <small className={styles.prototype}>
          Цените и подробните условия ще бъдат обявени преди старта на
          абонамента.
        </small>
      </aside>
    </div>
  );
}
