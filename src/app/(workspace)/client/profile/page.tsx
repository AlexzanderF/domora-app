import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "Моят профил" };

export default function ClientProfilePage() {
  return (
    <>
      <PageHeading
        eyebrow="ПОТРЕБИТЕЛСКИ ПРОФИЛ"
        title="Лични данни и настройки"
        description="Управлявайте информацията за контакт и регистрираните имоти."
      />
      <div className="card">
        <p>Управление на профила и личните данни.</p>
      </div>
    </>
  );
}
