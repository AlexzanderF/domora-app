import type { Metadata } from "next";
import { PlansConfigurator } from "@/features/plans/plans-configurator";
import { findTariffs } from "@/domain/pricing/tariffs";
import styles from "@/features/plans/plans.module.css";

export const metadata: Metadata = {
  title: "Абонаменти",
  description:
    "Едно посещение от майстор месечно за дома или редовно почистване на общите части.",
};

export default async function PlansPage() {
  const tariffs = await findTariffs();
  return (
    <main id="main" className={styles.page}>
      <header className={styles.intro}>
        <span>АБОНАМЕНТНА ГРИЖА</span>
        <h1>Грижа за дома. Спокойствие за вас.</h1>
        <p>
          Майстор за дома или поддържан вход — изберете абонамента, който
          отговаря на вашите нужди.
        </p>
      </header>
      <PlansConfigurator tariffs={tariffs} />
    </main>
  );
}
