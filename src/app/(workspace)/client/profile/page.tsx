import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeading } from "@/components/ui/page-heading";
import { isDbConfigured } from "@/db";
import { getServerSession } from "@/features/auth/server/session";
import { ClientProfileForm } from "@/features/client-profile/client-profile-form";
import styles from "@/features/client-profile/client-profile.module.css";
import { findClientRequests } from "@/features/requests/server/queries";
import { findUserSubscription } from "@/features/subscriptions/server/queries";

export const metadata: Metadata = { title: "Моят профил" };
export const dynamic = "force-dynamic";

function getRoleLabel(role: string) {
  if (role === "ADMIN") return "Администратор";
  if (role === "SPECIALIST") return "Специалист";
  return "Клиент";
}

function getStatusLabel(status: string) {
  if (status === "PENDING") return "Очаква одобрение";
  if (status === "REJECTED") return "Отказан";
  return "Активен";
}

export default async function ClientProfilePage() {
  const user = await getServerSession();
  if (isDbConfigured && !user) {
    redirect("/login");
  }

  const [subscription, requests] = user
    ? await Promise.all([
        findUserSubscription(user.id),
        findClientRequests(user.id),
      ])
    : [null, null];

  const latestRequestAddress = requests?.find((request) =>
    request.address.trim(),
  )?.address;
  const propertyAddress =
    subscription?.propertyAddress ?? latestRequestAddress ?? null;
  const propertySource = subscription
    ? "Адрес от активния абонамент"
    : latestRequestAddress
      ? "Адрес от последната заявка"
      : "Все още няма регистриран адрес";

  return (
    <>
      <PageHeading
        eyebrow="ПОТРЕБИТЕЛСКИ ПРОФИЛ"
        title="Лични данни и настройки"
        description="Преглеждайте контактните данни, имота и връзките към услугите си."
      />
      {!user ? (
        <div className={styles.unavailable}>
          <h2>Профилът е временно недостъпен</h2>
          <p>
            Не успяхме да заредим клиентски профил. Опитайте отново, когато
            връзката с базата данни е активна.
          </p>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.stack}>
            <section className={styles.panel} aria-labelledby="profile-summary">
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.eyebrow}>ОБЩ ПРЕГЛЕД</span>
                  <h2 id="profile-summary">Данни за клиента</h2>
                </div>
                <span className={styles.profileBadge}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Име</span>
                  <span className={styles.detailValue}>{user.name}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Имейл</span>
                  <span className={styles.detailValue}>{user.email}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Телефон</span>
                  <span className={styles.detailValue}>{user.phone}</span>
                </div>
              </div>
            </section>

            <ClientProfileForm
              name={user.name}
              email={user.email}
              phone={user.phone}
            />

            <section
              className={styles.panel}
              aria-labelledby="property-summary"
            >
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.eyebrow}>ИМОТ</span>
                  <h2 id="property-summary">Регистриран адрес</h2>
                </div>
              </div>
              {propertyAddress ? (
                <div className={styles.propertyGrid}>
                  <div className={styles.propertyItem}>
                    <span className={styles.propertyLabel}>Адрес</span>
                    <span className={styles.propertyValue}>
                      {propertyAddress}
                    </span>
                  </div>
                  <div className={styles.propertyItem}>
                    <span className={styles.propertyLabel}>Източник</span>
                    <span className={styles.propertyValue}>
                      {propertySource}
                    </span>
                  </div>
                </div>
              ) : (
                <p className={styles.emptyText}>
                  Добавете заявка или абонамент, за да се появи адресът на имота
                  тук.
                </p>
              )}
            </section>
          </div>

          <aside className={styles.quickLinks} aria-labelledby="profile-links">
            <div>
              <span className={styles.eyebrow}>БЪРЗИ ВРЪЗКИ</span>
              <h2 id="profile-links">Услуги към профила</h2>
            </div>
            <p>Следете абонамента си и историята на заявките от профила си.</p>
            <div className={styles.linkStack}>
              <Link className={styles.linkButton} href="/client/plan">
                Моят абонамент
              </Link>
              <Link className={styles.secondaryLink} href="/client/requests">
                История на заявките
              </Link>
            </div>
            <div className={styles.propertyItem}>
              <span className={styles.propertyLabel}>Статус</span>
              <span className={styles.propertyValue}>
                {getStatusLabel(user.status)}
              </span>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
