import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { isDbConfigured } from "@/db";
import { getServerSession } from "@/features/auth/server/session";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { ClientProfileForm } from "@/features/client-profile/client-profile-form";
import { findClientRequests } from "@/features/requests/server/queries";
import { findUserSubscription } from "@/features/subscriptions/server/queries";

export const metadata: Metadata = { title: "Моят профил" };
export const dynamic = "force-dynamic";

const cardClass = "rounded-xl p-6 max-[700px]:p-[1.15rem]";
const eyebrowClass =
  "mb-[0.3rem] block text-[0.75rem] font-bold tracking-[0.12em] text-muted-foreground";
const headingClass = "text-[1.15rem]";
const headerClass =
  "mb-5 flex items-start justify-between gap-4 max-[700px]:flex-col";
const labelClass =
  "mb-[0.35rem] block text-[0.78rem] font-bold tracking-[0.05em] text-muted-foreground uppercase";
const valueClass =
  "block text-[1rem] font-bold text-foreground [overflow-wrap:anywhere]";
const itemClass =
  "min-w-0 rounded-[10px] border border-border bg-background p-4";
const linkClass =
  "inline-flex min-h-[42px] items-center justify-center rounded-lg px-4 py-[0.65rem] font-bold";

function getRoleLabel(role: UserRole) {
  if (role === UserRole.Admin) return "Администратор";
  if (role === UserRole.Specialist) return "Специалист";
  return "Клиент";
}

function getStatusLabel(status: UserStatus) {
  if (status === UserStatus.Pending) return "Очаква одобрение";
  if (status === UserStatus.Rejected) return "Отказан";
  return "Активен";
}

export default async function ClientProfilePage() {
  const user = await getServerSession();
  if (isDbConfigured && !user) {
    redirect("/api/auth/logout?next=/login");
  }

  const [subscription, requests] = user
    ? await Promise.all([
        findUserSubscription(user),
        findClientRequests(user.id),
      ])
    : [null, null];

  const latestRequestAddress = requests?.find((request) =>
    request.address.trim(),
  )?.address;
  const propertyAddress =
    user?.propertyAddress ??
    subscription?.propertyAddress ??
    latestRequestAddress ??
    "";

  return (
    <>
      <PageHeading
        eyebrow="ПОТРЕБИТЕЛСКИ ПРОФИЛ"
        title="Лични данни и настройки"
        description="Преглеждайте контактните данни, имота и връзките към услугите си."
      />
      {!user ? (
        <Card className="rounded-xl border-tone-f0d6a7 bg-tone-fff8ea px-6 py-5 text-tone-634716 max-[700px]:p-[1.15rem]">
          <h2 className="mb-[0.35rem] text-[1rem]">
            Профилът е временно недостъпен
          </h2>
          <p className="m-0 text-[0.9rem]">
            Не успяхме да заредим клиентски профил. Опитайте отново, когато
            връзката с базата данни е активна.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)] items-start gap-5 max-[980px]:grid-cols-1">
          <div className="grid gap-5">
            <Card
              role="region"
              aria-labelledby="profile-summary"
              className={cardClass}
            >
              <div className={headerClass}>
                <div>
                  <span className={eyebrowClass}>ОБЩ ПРЕГЛЕД</span>
                  <h2 id="profile-summary" className={headingClass}>
                    Данни за клиента
                  </h2>
                </div>
                <Badge className="rounded-full border border-tone-c9e0d4 px-3 py-[0.35rem] text-[0.82rem] font-bold whitespace-nowrap">
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-[0.9rem] max-[700px]:grid-cols-1">
                {(
                  [
                    ["Име", user.name],
                    ["Имейл", user.email],
                    ["Телефон", user.phone],
                    ["Адрес на имота", propertyAddress],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className={itemClass}>
                    <span className={labelClass}>{label}</span>
                    <span className={valueClass}>{value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <ClientProfileForm
              name={user.name}
              email={user.email}
              phone={user.phone}
              propertyAddress={propertyAddress}
            />
          </div>

          <Card
            role="region"
            aria-labelledby="profile-links"
            className={`${cardClass} grid gap-4`}
          >
            <div>
              <span className={eyebrowClass}>БЪРЗИ ВРЪЗКИ</span>
              <h2 id="profile-links" className={headingClass}>
                Услуги към профила
              </h2>
            </div>
            <p className="m-0 text-[0.92rem] text-muted-foreground">
              Следете абонамента си и историята на заявките от профила си.
            </p>
            <div className="grid gap-[0.7rem]">
              <Button asChild className={linkClass}>
                <Link href="/client/plan">Моят абонамент</Link>
              </Button>
              <Button asChild variant="secondary" className={linkClass}>
                <Link href="/client/requests">История на заявките</Link>
              </Button>
            </div>
            <div className={itemClass}>
              <span className={labelClass}>Статус</span>
              <span className={valueClass}>{getStatusLabel(user.status)}</span>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
