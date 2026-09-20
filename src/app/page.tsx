import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";
import { BookingButton } from "@/features/bookings/booking-button";
import { RequestList } from "@/features/requests/request-list";
import { ServiceGrid } from "@/features/services/service-grid";

export default function HomePage() {
  return (
    <>
      <PageHeading
        eyebrow="ДОБРЕ ДОШЛИ В DOMORA"
        title="Спокойствие за вашия дом."
        description="Всичко за дома, подредено на едно място."
      >
        <BookingButton />
      </PageHeading>
      <div className="banner">
        <div>
          <span className="eyebrow">ПО-МАЛКО ЗАДАЧИ. ПОВЕЧЕ ВРЕМЕ.</span>
          <h2>
            Грижата за дома
            <br />
            може да бъде по-лесна.
          </h2>
          <p>
            Изберете абонамент за дома или входа и планирайте редовното
            почистване.
          </p>
        </div>
        <Link className="secondary" href="/plans">
          Разгледай абонаментите ↗
        </Link>
      </div>
      <div className="sectionhead">
        <h2>От какво се нуждаете?</h2>
        <span className="muted">6 категории</span>
      </div>
      <ServiceGrid />
      <div className="lower">
        <section>
          <div className="sectionhead">
            <h2>Последни заявки</h2>
            <Link className="textbutton" href="/requests">
              Всички →
            </Link>
          </div>
          <div className="card">
            <RequestList limit={2} />
          </div>
        </section>
        <section>
          <div className="sectionhead">
            <h2>Вашият абонамент</h2>
          </div>
          <div className="card">
            <span className="badge">Грижа по график</span>
            <h3 className="subscription-title">Повече време за вас.</h3>
            <p className="muted subscription-description">
              Две почиствания месечно за дома или седмична грижа за общите
              части.
            </p>
            <Link className="secondary full" href="/plans">
              Избери план
            </Link>
            <div className="planhint">
              Обхватът и цената са ясни преди потвърждение.
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
