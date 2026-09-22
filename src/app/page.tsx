import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FinalCta } from "@/features/landing/final-cta";
import { Hero } from "@/features/landing/hero";
import { HowItWorks } from "@/features/landing/how-it-works";
import { LandingFooter } from "@/features/landing/landing-footer";
import { LandingHeader } from "@/features/landing/landing-header";
import { ServiceShowcase } from "@/features/landing/service-showcase";
import { Faq, TrustAndTestimonials } from "@/features/landing/trust-sections";
import { UserRole, UserStatus } from "@/features/auth/types";
import { getServerSession } from "@/features/auth/server/session";
import { isDbConfigured } from "@/db";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "DOMORA — спокойствие за вашия дом",
  description:
    "Надеждни домашни услуги, проверени специалисти и абонаментна грижа с ясни цени.",
};

export default async function HomePage() {
  if (isDbConfigured) {
    const user = await getServerSession();
    if (user) {
      if (user.role === UserRole.Admin) {
        redirect("/admin");
      }
      if (user.role === UserRole.Specialist) {
        redirect(
          user.status === UserStatus.Pending
            ? "/pending-approval"
            : "/specialist",
        );
      }
      redirect("/client");
    }
  }
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
