import type { Metadata } from "next";
import { LandingFooter } from "@/features/landing/landing-footer";
import { LandingHeader } from "@/features/landing/landing-header";
import styles from "./contact.module.css";

export const metadata: Metadata = {
  title: "Контакти | DOMORA",
  description:
    "Свържете се с DOMORA за домашни услуги, абонаменти и клиентска поддръжка.",
};

const phone = "+359 2 492 00 24";
const contactEmail = "hello@domora.bg";

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <a href="#main" className="skip-link">
        Към съдържанието
      </a>
      <LandingHeader />
      <main id="main" className={styles.main}>
        <section className={styles.hero} aria-labelledby="contact-title">
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Контакти</span>
            <h1 id="contact-title">Говорете с DOMORA.</h1>
            <p>
              За абонамент, активна заявка или въпрос към екипа, пишете ни с
              кратко описание и телефон за обратна връзка.
            </p>
          </div>

          <div className={styles.contactPanel}>
            <a className={styles.primaryContact} href={`tel:${phone}`}>
              <span>Телефон</span>
              <strong>{phone}</strong>
            </a>
            <a
              className={styles.primaryContact}
              href={`mailto:${contactEmail}`}
            >
              <span>Имейл</span>
              <strong>{contactEmail}</strong>
            </a>
            <div className={styles.contactMeta}>
              <span>Обслужване</span>
              <strong>Ежедневна клиентска поддръжка</strong>
            </div>
          </div>
        </section>

        <section className={styles.infoBand} aria-label="Информация за контакт">
          <div>
            <span className={styles.label}>Адрес</span>
            <p>София, бул. България 69, ет. 4</p>
          </div>
          <div>
            <span className={styles.label}>Поддръжка</span>
            <p>За активни заявки влезте в клиентския профил.</p>
          </div>
          <div>
            <span className={styles.label}>Отговор</span>
            <p>Обработваме клиентски запитвания целогодишно.</p>
          </div>
        </section>

        <section className={styles.messageSection} aria-labelledby="message">
          <div>
            <span className={styles.eyebrow}>Запитване</span>
            <h2 id="message">Изпратете ни детайлите.</h2>
          </div>
          <div className={styles.messageBox}>
            <p>
              Най-бързо ще ви насочим, ако включите услугата, адреса или района
              на имота и удобен часови диапазон за разговор.
            </p>
            <div className={styles.actions}>
              <a
                className={styles.primaryAction}
                href={`mailto:${contactEmail}?subject=Запитване към DOMORA`}
              >
                Напишете имейл
              </a>
              <a className={styles.secondaryAction} href="/login">
                Към клиентски профил
              </a>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
