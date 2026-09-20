import type { Metadata } from "next";
import { PlansConfigurator } from "@/features/plans/plans-configurator";
import styles from "@/features/plans/plans.module.css";

export const metadata: Metadata = {
  title: "Абонаменти",
  description:
    "Конфигурирайте абонаментна грижа за дома или общите части с ясен месечен график и цена.",
};

export default function PlansPage() {
  return (
    <main id="main" className={styles.page}>
      <header className={styles.intro}>
        <span>АБОНАМЕНТНА ГРИЖА</span>
        <h1>Ритъм за по-подреден дом.</h1>
        <p>
          Изберете пространство и честота. Виждате точната месечна цена, преди
          да изпратите заявката.
        </p>
      </header>
      <PlansConfigurator />
    </main>
  );
}
