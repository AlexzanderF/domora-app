import { PageHeading } from "@/components/ui/page-heading";

export default function ClientPlanLoading() {
  return (
    <>
      <PageHeading
        eyebrow="АБОНАМЕНТЕН ПЛАН"
        title="Моят абонамент"
        description="Зареждаме актуалните данни за вашия абонамент."
      />
      <div role="status">Зареждаме абонамента...</div>
    </>
  );
}
