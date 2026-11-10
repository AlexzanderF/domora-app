import { PageContainer } from "@/components/layout/page-container";
import { SkipLink } from "@/components/skip-link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FinalCta } from "@/features/landing/final-cta";
import { Hero } from "@/features/landing/hero";
import { HowItWorks } from "@/features/landing/how-it-works";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ServiceShowcase } from "@/features/landing/service-showcase";
import { Faq, TrustAndTestimonials } from "@/features/landing/trust-sections";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { getServerSession } from "@/features/auth/server/session";
import { isDbConfigured } from "@/db";

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
