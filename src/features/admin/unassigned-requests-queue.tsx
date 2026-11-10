"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminAssignSpecialistAction,
  adminRecommendSpecialistAction,
} from "@/features/requests/server/actions";
import { UserStatus } from "@/domain/identity/types";
import type { User } from "@/domain/identity/types";
import { useToast } from "@/components/ui/toast-provider";
import { categories } from "@/features/services/catalog";
import { RequestPriority } from "@/domain/requests/types";
import { isUrgentPriority } from "@/features/requests/priority";
import { money } from "@/lib/format";
import type { ServiceRequest } from "@/domain/requests/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CardHeaderRow,
  CategoryPill,
  DetailGrid,
  DetailItem,
  DetailValue,
  QueueEmpty,
} from "./admin-ui";

export interface UnassignedRequestsQueueProps {
  initialRequests?: ServiceRequest[] | null;
  initialSpecialists?: User[] | null;
}

function priorityLabel(priority?: ServiceRequest["priority"]): string {
  switch (priority) {
    case RequestPriority.Emergency:
      return "Аварийна";
    case RequestPriority.Urgent:
      return "Спешна";
    case RequestPriority.Holiday:
      return "Празнична";
    default:
      return "Стандартна";
  }
}

function matchesArea(address: string, area?: string): boolean {
  const normalized = area?.trim().toLowerCase();
  if (!normalized) return false;
  return address.toLowerCase().includes(normalized);
}

export function UnassignedRequestsQueue({
  initialRequests,
  initialSpecialists,
}: UnassignedRequestsQueueProps = {}) {
  const notify = useToast();
  const router = useRouter();
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
  const [recommendedOverrides, setRecommendedOverrides] = useState<
    Record<number, number>
  >({});
  const [selectedSpecialists, setSelectedSpecialists] = useState<
    Record<number, number>
  >({});
  const [processingId, setProcessingId] = useState<number | null>(null);

  const activeSpecialists = useMemo(() => {
    return (initialSpecialists ?? []).filter(
      (s) => s.status === UserStatus.Active,
    );
  }, [initialSpecialists]);

  const specialistNames = useMemo(() => {
    return new Map(activeSpecialists.map((s) => [s.id, s.name]));
  }, [activeSpecialists]);

  const queue = useMemo(() => {
    const source = initialRequests ?? [];
    return source.filter((r) => !r.cancelled && !assignedIds.has(r.id));
  }, [initialRequests, assignedIds]);

  const sortedSpecialistsFor = (request: ServiceRequest): User[] => {
    const trade = categories.find((c) => c.id === request.category)?.name;
    const rank = (spec: User): number => {
      const tradeMatch =
        trade && spec.specialistProfile?.category === trade ? 0 : 1;
      const areaMatch = matchesArea(
        request.address,
        spec.specialistProfile?.area,
      )
        ? 0
        : 1;
      return tradeMatch + areaMatch;
    };
    return [...activeSpecialists].sort((a, b) => {
      const rankDiff = rank(a) - rank(b);
      if (rankDiff !== 0) return rankDiff;
      return a.name.localeCompare(b.name, "bg");
    });
  };

  const isFullMatch = (request: ServiceRequest, spec: User): boolean => {
    const trade = categories.find((c) => c.id === request.category)?.name;
    if (!trade) return false;
    return (
      spec.specialistProfile?.category === trade &&
      matchesArea(request.address, spec.specialistProfile?.area)
    );
  };

  const getRecommendedId = (request: ServiceRequest): number | undefined => {
    return request.recommendedSpecialistId ?? recommendedOverrides[request.id];
  };

  const getSelectedId = (request: ServiceRequest): number | undefined => {
    return selectedSpecialists[request.id] ?? getRecommendedId(request);
  };

  const handleAssign = async (request: ServiceRequest) => {
    const specialistId = getSelectedId(request);
    if (!specialistId) {
      notify("Първо изберете специалист от падащия списък.");
      return;
    }
    try {
      setProcessingId(request.id);
      const res = await adminAssignSpecialistAction(request.id, specialistId);
      if (!res.success) {
        notify(res.error ?? "Възникна грешка при разпределяне на заявката.");
        return;
      }
      setAssignedIds((prev) => new Set(prev).add(request.id));
      notify("Заявката е разпределена към специалиста.");
      router.refresh();
    } catch {
      notify("Възникна грешка при разпределяне на заявката.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRecommend = async (request: ServiceRequest) => {
    const specialistId = getSelectedId(request);
    if (!specialistId) {
      notify("Първо изберете специалист от падащия списък.");
      return;
    }
    try {
      setProcessingId(request.id);
      const res = await adminRecommendSpecialistAction(
        request.id,
        specialistId,
      );
      if (!res.success) {
        notify(res.error ?? "Възникна грешка при препоръчване на заявката.");
        return;
      }
      setRecommendedOverrides((prev) => ({
        ...prev,
        [request.id]: specialistId,
      }));
      notify("Заявката е препоръчана на специалиста.");
      router.refresh();
    } catch {
      notify("Възникна грешка при препоръчване на заявката.");
    } finally {
      setProcessingId(null);
    }
  };

  if (queue.length === 0) {
    return (
      <QueueEmpty
        icon="⚡"
        title="Няма непоети спешни заявки"
        description="Всички заявки са разпределени към специалисти."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {queue.map((request) => {
        const categoryName =
          categories.find((c) => c.id === request.category)?.name ?? "Друго";
        const urgent = isUrgentPriority(request.priority);
        const recommendedId = getRecommendedId(request);
        const recommendedName = recommendedId
          ? specialistNames.get(recommendedId)
          : undefined;
        const isProcessing = processingId === request.id;
        const options = sortedSpecialistsFor(request);

        return (
          <article
            key={request.id}
            className={cn(
              "rounded-[10px] border px-5 py-[18px]",
              urgent
                ? "border-tone-f5c6a5 bg-tone-fffaf5"
                : "border-border bg-tone-fbfdfa",
            )}
            aria-label={request.service}
          >
            <CardHeaderRow className="flex-nowrap max-md:flex-col">
              <div>
                <h3 className="m-0 mb-1.5 text-base font-bold text-foreground">
                  {request.service}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryPill
                    className={
                      urgent
                        ? "border-tone-fecaca bg-tone-fee2e2 text-tone-991b1b"
                        : undefined
                    }
                  >
                    {priorityLabel(request.priority)}
                  </CategoryPill>
                  <CategoryPill className="border-tone-bbf7d0 bg-tone-eaf2ec text-primary">
                    {categoryName}
                  </CategoryPill>
                  <span className="text-xs text-muted-foreground">
                    {request.date} · {request.time}
                  </span>
                </div>
              </div>
              <span className="text-base font-bold whitespace-nowrap text-foreground">
                {money(request.price)}
              </span>
            </CardHeaderRow>

            <DetailGrid className="mt-3.5">
              <DetailItem label="Адрес на клиента">
                <DetailValue>{request.address}</DetailValue>
              </DetailItem>
              <DetailItem label="Клиент">
                <DetailValue>
                  {request.clientName || "—"}
                  {request.clientPhone ? ` · ${request.clientPhone}` : ""}
                </DetailValue>
              </DetailItem>
            </DetailGrid>

            {recommendedName && (
              <p className="m-0 mt-3 inline-block rounded-md border border-tone-fde7c7 bg-tone-fff7e6 px-2.5 py-1 text-xs font-semibold text-tone-8c6318">
                Препоръчана на {recommendedName}
              </p>
            )}

            <div className="mt-3.5 flex flex-wrap items-end justify-between gap-3 border-t border-tone-edf2ed pt-3.5 max-md:flex-col max-md:items-stretch">
              <label className="flex min-w-[220px] flex-1 flex-col gap-1.5 text-[11px] font-semibold tracking-[0.5px] text-muted-foreground uppercase">
                Специалист
                <select
                  className="cursor-pointer rounded-lg border-border px-3 py-2 text-sm font-medium tracking-normal text-foreground normal-case outline-none focus:border-primary"
                  value={getSelectedId(request) ?? ""}
                  onChange={(e) =>
                    setSelectedSpecialists((prev) => ({
                      ...prev,
                      [request.id]: Number(e.target.value),
                    }))
                  }
                  aria-label={`Избор на специалист за ${request.service}`}
                >
                  <option value="">Избери специалист…</option>
                  {options.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {isFullMatch(request, spec) ? "✓ " : ""}
                      {spec.name}
                      {spec.specialistProfile?.category
                        ? ` · ${spec.specialistProfile.category}`
                        : ""}
                      {spec.specialistProfile?.area
                        ? ` · ${spec.specialistProfile.area}`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={() => handleAssign(request)}
                  disabled={isProcessing}
                  className="px-[18px] py-2 text-[13px]"
                >
                  Разпредели
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleRecommend(request)}
                  disabled={isProcessing}
                  className="border-tone-bbf7d0 px-[18px] py-2 text-[13px] hover:bg-tone-eaf2ec"
                >
                  Препоръчай
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
