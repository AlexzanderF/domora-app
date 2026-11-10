import { PageContainer } from "@/components/layout/page-container";
import { SkipLink } from "@/components/skip-link";
import type { Metadata } from "next";
import { FinalCta } from "@/features/landing/final-cta";
import { Hero } from "@/features/landing/hero";
import { HowItWorks } from "@/features/landing/how-it-works";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ServiceShowcase } from "@/features/landing/service-showcase";
import { Faq, TrustAndTestimonials } from "@/features/landing/trust-sections";
import { redirectIfSignedIn } from "@/features/auth/server/actor";

export const metadata: Metadata = {
  title: "DOMORA — спокойствие за вашия дом",
  description:
    "Надеждни домашни услуги, проверени специалисти и абонаментна грижа с ясни цени.",
};

export default async function HomePage() {
  await redirectIfSignedIn();
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <PageContainer as="main" id="main" className="pt-4 pb-0 sm:pt-[1.35rem]">
        <Hero />
        <HowItWorks />
        <ServiceShowcase />
        <TrustAndTestimonials />
        <Faq />
        <FinalCta />
      </PageContainer>
      <SiteFooter />
    </>
  );
}
