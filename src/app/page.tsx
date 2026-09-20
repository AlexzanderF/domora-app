import Link from "next/link";
import { Hero } from "@/features/landing/hero";
import { HowItWorks } from "@/features/landing/how-it-works";
import { RequestList } from "@/features/requests/request-list";
import { ServiceGrid } from "@/features/services/service-grid";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
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
      <section id="services" aria-labelledby="services-title">
        <div className="sectionhead">
          <h2 id="services-title">От какво се нуждаете?</h2>
          <span className="muted">6 категории</span>
        </div>
        <ServiceGrid />
      </section>
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
