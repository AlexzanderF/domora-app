import type { Metadata } from "next";
import { FinalCta } from "@/features/landing/final-cta";
import { Hero } from "@/features/landing/hero";
import { HowItWorks } from "@/features/landing/how-it-works";
import { LandingFooter } from "@/features/landing/landing-footer";
import { LandingHeader } from "@/features/landing/landing-header";
import { ServiceShowcase } from "@/features/landing/service-showcase";
import { Faq, TrustAndTestimonials } from "@/features/landing/trust-sections";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "DOMORA — спокойствие за вашия дом",
  description:
    "Надеждни домашни услуги, проверени специалисти и абонаментна грижа с ясни цени.",
};

export default function HomePage() {
  return (
    <>
      <a href="#main" className="skip-link">
        Към съдържанието
      </a>
      <LandingHeader />
      <main id="main" className={styles.main}>
        <Hero />
        <HowItWorks />
        <ServiceShowcase />
        <TrustAndTestimonials />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </>
  );
}
