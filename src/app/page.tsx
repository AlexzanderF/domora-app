import { Hero } from "@/features/landing/hero";
import { HowItWorks } from "@/features/landing/how-it-works";
import { ServiceShowcase } from "@/features/landing/service-showcase";
import { Faq, TrustAndTestimonials } from "@/features/landing/trust-sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <ServiceShowcase />
      <TrustAndTestimonials />
      <Faq />
    </>
  );
}
