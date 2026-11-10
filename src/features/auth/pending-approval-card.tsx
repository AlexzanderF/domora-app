"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { UserRole, UserStatus } from "@/domain/identity/types";
import {
  AuthAlert,
  AuthSubtitle,
  AuthTitle,
  SecondaryButton,
  SubmitButton,
} from "./auth-ui";

const badgeTones = {
  pending: "border-tone-fde68a bg-tone-fef3c7 text-tone-92400e",
  active: "border-tone-a7f3d0 bg-tone-def7ec text-tone-03543f",
  rejected: "border-tone-fecaca bg-tone-fdf2f2 text-tone-991b1b",
};

function ApprovalBadge({
  tone,
  children,
}: {
  tone: keyof typeof badgeTones;
  children: string;
}) {
  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-bold tracking-[0.3px]",
        badgeTones[tone],
      )}
    >
      {children}
    </Badge>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-tone-eef2ef py-2 text-[14px] last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="font-semibold [word-break:break-word] text-foreground sm:max-w-[60%] sm:text-right">
        {children}
      </span>
    </div>
  );
}

export function PendingApprovalCard() {
  const router = useRouter();
  const { user, status, refreshUser, logout } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<"info" | "success" | "error">(
    "info",
  );

  // If user is already ACTIVE, redirect to specialist workspace
  useEffect(() => {
    if (status === "authenticated" && user) {
      if (
        user.role === UserRole.Specialist &&
        user.status === UserStatus.Active
      ) {
        router.replace("/specialist");
      }
    }
  }, [user, status, router]);

  const handleCheckStatus = async () => {
    setIsRefreshing(true);
    setNotice(null);
    try {
      const updated = await refreshUser();
      if (updated && updated.status === UserStatus.Active) {
        setNotice(
          "Поздравления! Профилът ви е одобрен. Пренасочване към работното пространство...",
        );
        setNoticeType("success");
        setTimeout(() => {
          router.push("/specialist");
        }, 1200);
      } else if (updated && updated.status === UserStatus.Rejected) {
        setNotice("Кандидатурата ви е отхвърлена.");
        setNoticeType("error");
      } else {
        setNotice("Кандидатурата все още се преглежда.");
        setNoticeType("info");
      }
    } catch {
      setNotice("Грешка при проверка на статуса. Моля, опитайте отново.");
      setNoticeType("info");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (status === "loading") {
    return (
      <div className="py-9 text-center">
        <p className="text-muted-foreground">
          Зареждане на данни за профила...
        </p>
      </div>
    );
  }

  if (status === "unauthenticated" || !user) {
    return (
      <div className="py-5 text-center">
        <AuthTitle>Няма активна сесия</AuthTitle>
        <AuthSubtitle>
          Моля, влезте в профила си, за да проверите статуса на вашата
          кандидатура.
        </AuthSubtitle>
        <Button
          asChild
          className="mt-1.5 inline-block w-full py-[13px] text-[16px] hover:bg-primary-hover"
        >
          <Link href="/login">Към вход</Link>
        </Button>
      </div>
    );
  }

  const profile = user.specialistProfile;
  const isRejected = user.status === UserStatus.Rejected;
  const isActive = user.status === UserStatus.Active;
  const tone = isActive ? "active" : isRejected ? "rejected" : "pending";

  return (
    <>
      <div className="mb-5 text-center">
        <div
          className={cn(
            "mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-tone-fef3c7 text-[28px] text-tone-d97706",
            isRejected && "bg-tone-fee2e2 text-tone-b91c1c",
          )}
          aria-hidden="true"
        >
          {isRejected ? "✕" : isActive ? "✓" : "⏳"}
        </div>
        <AuthTitle>
          {isRejected
            ? "Кандидатурата е отказана"
            : isActive
              ? "Кандидатурата е одобрена"
              : "Вашата кандидатура се обработва"}
        </AuthTitle>
        <div>
          <ApprovalBadge tone={tone}>
            {isActive
              ? "✓ Одобрен"
              : isRejected
                ? "✕ Отказан"
                : "● Чака одобрение"}
          </ApprovalBadge>
        </div>
      </div>

      <AuthSubtitle className="text-center mb-5">
        {isRejected
          ? "За съжаление вашата кандидатура като специалист в DOMORA не беше одобрена. За допълнителна информация или въпроси можете да се свържете с екипа ни."
          : isActive
            ? "Профилът ви е успешно одобрен! Можете да преминете към специализираното работно пространство."
            : "Благодарим ви за кандидатстването като специалист в DOMORA! Нашият екип разглежда вашите документи и професионална квалификация. След одобрение ще получите пълен достъп до специализирания панел за поръчки."}
      </AuthSubtitle>

      {notice && (
        <AuthAlert
          tone={noticeType}
          className={cn(
            noticeType !== "error" && "mb-4",
            noticeType === "info" && "flex items-center gap-2",
          )}
          role="status"
        >
          <span>{notice}</span>
        </AuthAlert>
      )}

      {/* Summary card of submitted details */}
      <Card className="my-5 rounded-xl bg-tone-fbfdfb px-5 py-[18px]">
        <h2 className="m-0 mb-3 text-[13px] font-bold tracking-[0.5px] text-foreground uppercase">
          Подадени данни за профила
        </h2>

        <SummaryRow label="Име и фамилия">{user.name}</SummaryRow>
        <SummaryRow label="Сфера на дейност">
          {profile?.category || "Не е посочена"}
        </SummaryRow>
        <SummaryRow label="Район на обслужване">
          {profile?.area || "Не е посочен"}
        </SummaryRow>
        <SummaryRow label="Професионален опит">
          {profile?.experienceYears !== undefined
            ? `${profile.experienceYears} ${profile.experienceYears === 1 ? "година" : "години"}`
            : "0 години"}
        </SummaryRow>
        {profile?.companyName && (
          <SummaryRow label="Фирма">{profile.companyName}</SummaryRow>
        )}
        {profile?.eik && (
          <SummaryRow label="ЕИК / БУЛСТАТ">{profile.eik}</SummaryRow>
        )}
        <SummaryRow label="Телефонен номер">{user.phone}</SummaryRow>
        <SummaryRow label="Имейл адрес">{user.email}</SummaryRow>
        <SummaryRow label="Статус">
          <ApprovalBadge tone={tone}>
            {isActive
              ? "✓ Одобрен"
              : isRejected
                ? "✕ Отказан"
                : "⏳ Чака одобрение"}
          </ApprovalBadge>
        </SummaryRow>
      </Card>

      {/* Action buttons */}
      <div className="mt-2 flex flex-col gap-2.5">
        {!isRejected && (
          <SubmitButton
            type="button"
            onClick={handleCheckStatus}
            disabled={isRefreshing}
            className="mt-0"
          >
            {isRefreshing ? "Проверка..." : "Провери статус"}
          </SubmitButton>
        )}

        <SecondaryButton type="button" onClick={handleLogout}>
          Изход
        </SecondaryButton>
      </div>
    </>
  );
}
