import type { Metadata } from "next";
import { LandingFooter } from "@/features/landing/landing-footer";
import { LandingHeader } from "@/features/landing/landing-header";
import styles from "./auth.module.css";

export const metadata: Metadata = {
  title: "Вход и регистрация | DOMORA",
  description: "Вход и регистрация в платформата за грижа за дома DOMORA.",
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a href="#main" className="skip-link">
        Към съдържанието
      </a>
      <LandingHeader />
      <div className={styles.container}>
        <main id="main" className={styles.main}>
          <div className={styles.card}>{children}</div>
        </main>
      </div>
      <LandingFooter />
    </>
  );
}
