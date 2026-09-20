import { Hero } from "@/features/landing/hero";
import { HowItWorks } from "@/features/landing/how-it-works";
import { ServiceShowcase } from "@/features/landing/service-showcase";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <ServiceShowcase />
    </>
  );
}
