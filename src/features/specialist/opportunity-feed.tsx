"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { ServiceIcon } from "@/features/services/service-icon";
import { categories } from "@/features/services/catalog";
import { useToast } from "@/components/ui/toast-provider";
import { assignSpecialistAction } from "@/features/requests/server/actions";
import { money } from "@/lib/format";
import { RequestPriority } from "@/domain/requests/types";
import type { ServiceRequest } from "@/domain/requests/types";
import {
  RequestActions,
  RequestRow,
  SpecialistSection,
  actionButton,
  rowText,
} from "./section-parts";

function isUrgent(request: ServiceRequest): boolean {
  return (
    request.priority === RequestPriority.Urgent ||
    request.priority === RequestPriority.Emergency
  );
}

export function OpportunityFeed({
  initialOpportunities,
  limit,
  viewAllHref,
  specialistId,
}: {
  initialOpportunities: ServiceRequest[];
  limit?: number;
  viewAllHref?: string;
  specialistId?: number;
}) {
  const router = useRouter();
  const notify = useToast();
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const visible = initialOpportunities.filter(
    (request) => !dismissedIds.has(request.id),
  );
  const items = limit ? visible.slice(0, limit) : visible;

  async function accept(request: ServiceRequest) {
    setAcceptingId(request.id);
    try {
      const result = await assignSpecialistAction(request.id);
      if (!result.success) {
        notify(result.error ?? "Грешка при приемане на заявката.");
        return;
      }
      notify("Заявката е приета и добавена към дневния график.");
      router.refresh();
    } catch {
      notify("Грешка при приемане на заявката. Опитайте отново.");
    } finally {
      setAcceptingId(null);
    }
  }

  function dismiss(request: ServiceRequest) {
    setDismissedIds((current) => new Set(current).add(request.id));
    notify("Възможността е скрита от вашия списък.");
  }

  return (
    <SpecialistSection
      title="Нови възможности"
      badge="Достъпни заявки"
      action={
        viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-[13px] font-semibold text-primary no-underline hover:underline"
          >
            Към всички възможности →
          </Link>
        )
      }
    >
      {items.length === 0 ? (
        <EmptyState>Няма нови възможности в момента.</EmptyState>
      ) : (
        items.map((request) => (
          <RequestRow
            key={request.id}
            label={request.service}
            icon={<ServiceIcon category={request.category} />}
            amount={money(request.price)}
          >
            <h3>{request.service}</h3>
            <p className={rowText}>{request.address}</p>
            <StatusBadge tone={isUrgent(request) ? "pending" : "default"}>
              {isUrgent(request) ? "Спешна" : "Стандартна"}
            </StatusBadge>{" "}
            <StatusBadge>{categories[request.category].name}</StatusBadge>{" "}
            {(specialistId === undefined
              ? request.recommendedSpecialistId !== undefined
              : request.recommendedSpecialistId === specialistId) && (
              <StatusBadge tone="pending">
                Препоръчана от администратор
              </StatusBadge>
            )}
            <RequestActions>
              <Button
                size="compact"
                className={actionButton}
                disabled={acceptingId === request.id}
                onClick={() => void accept(request)}
              >
                {acceptingId === request.id ? "Приемане…" : "Приеми"}
              </Button>
              <Button
                size="compact"
                className={actionButton}
                variant="secondary"
                onClick={() => dismiss(request)}
              >
                Пропусни
              </Button>
            </RequestActions>
          </RequestRow>
        ))
      )}
    </SpecialistSection>
  );
}
