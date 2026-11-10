"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import { UserStatus } from "@/domain/identity/types";
import type { User } from "@/domain/identity/types";
import { useToast } from "@/components/ui/toast-provider";
import { formatCompany, formatExperience } from "./specialist-format";
import { Button } from "@/components/ui/button";
import {
  CategoryPill,
  DetailGrid,
  DetailItem,
  DetailValue,
  QueueEmpty,
} from "./admin-ui";

export interface PendingSpecialistsQueueProps {
  initialSpecialists?: User[] | null;
}

export function PendingSpecialistsQueue({
  initialSpecialists,
}: PendingSpecialistsQueueProps = {}) {
  const [overrideStatuses, setOverrideStatuses] = useState<
    Record<number, UserStatus>
  >({});
  const { updateUserStatus } = useAuth();
  const notify = useToast();
  const router = useRouter();
  const [processingId, setProcessingId] = useState<number | null>(null);

  const pending = useMemo(() => {
    const baseList = initialSpecialists ?? [];
    return baseList
      .map((spec) => {
        const override = overrideStatuses[spec.id];
        return override ? { ...spec, status: override } : spec;
      })
      .filter((spec) => spec.status === UserStatus.Pending);
  }, [initialSpecialists, overrideStatuses]);

  const handleDecision = async (spec: User, status: UserStatus) => {
    try {
      setProcessingId(spec.id);
      await updateUserStatus(spec.id, status);
      setOverrideStatuses((prev) => ({ ...prev, [spec.id]: status }));
      notify(
        status === UserStatus.Active
          ? `Кандидатурата на ${spec.name} е одобрена успешно.`
          : `Кандидатурата на ${spec.name} е отказана.`,
      );
      router.refresh();
    } catch {
      notify(
        status === UserStatus.Active
          ? "Възникна грешка при одобряване на кандидатурата."
          : "Възникна грешка при отказване на кандидатурата.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (pending.length === 0) {
    return (
      <QueueEmpty
        icon="👥"
        title="Няма чакащи за одобрение специалисти"
        description="Всички подадени кандидатури вече са прегледани."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {pending.map((spec) => {
        const profile = spec.specialistProfile;
        const initial = spec.name.trim().charAt(0).toUpperCase() || "С";
        const isProcessing = processingId === spec.id;

        return (
          <article
            key={spec.id}
            className="rounded-[10px] border border-border bg-tone-fbfdfa px-5 py-[18px]"
            aria-label={`Кандидатура на ${spec.name}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3.5 max-md:flex-col max-md:items-stretch">
              <div className="flex items-center gap-3">
                <div
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-tone-e9efdc text-base font-bold text-primary"
                  aria-hidden="true"
                >
                  {initial}
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="m-0 text-base font-bold text-foreground">
                    {spec.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {profile?.category && (
                      <CategoryPill>{profile.category}</CategoryPill>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Подадена на{" "}
                      {new Date(spec.createdAt).toLocaleDateString("bg-BG", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={() => handleDecision(spec, UserStatus.Active)}
                  disabled={isProcessing}
                  className="px-4 py-[7px] text-[13px]"
                >
                  Одобри
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleDecision(spec, UserStatus.Rejected)}
                  disabled={isProcessing}
                  className="border-tone-fecaca px-4 py-[7px] text-[13px] text-tone-991b1b hover:bg-tone-fee2e2"
                >
                  Откажи
                </Button>
              </div>
            </div>

            <DetailGrid className="mt-4">
              <DetailItem label="Телефон">
                <a
                  href={`tel:${spec.phone}`}
                  className="text-[13px] font-medium break-words text-primary no-underline hover:underline"
                >
                  {spec.phone}
                </a>
              </DetailItem>
              <DetailItem label="Имейл">
                <a
                  href={`mailto:${spec.email}`}
                  className="text-[13px] font-medium break-words text-primary no-underline hover:underline"
                >
                  {spec.email}
                </a>
              </DetailItem>
              <DetailItem label="Район на обслужване">
                <DetailValue>{profile?.area || "—"}</DetailValue>
              </DetailItem>
              <DetailItem label="Професионален опит">
                <DetailValue>
                  {formatExperience(profile?.experienceYears)}
                </DetailValue>
              </DetailItem>
              <DetailItem label="Фирма / ЕИК">
                <DetailValue>
                  {formatCompany(profile?.companyName, profile?.eik)}
                </DetailValue>
              </DetailItem>
            </DetailGrid>

            {profile?.bio && (
              <div className="mt-3.5 border-t border-tone-edf2ed pt-3">
                <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.5px] text-muted-foreground uppercase">
                  Професионално представяне (Био)
                </span>
                <p className="text-[13px] leading-normal text-foreground">
                  {profile.bio}
                </p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
