"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { UserStatus } from "@/domain/identity/types";
import type { User } from "@/domain/identity/types";
import { useToast } from "@/components/ui/toast-provider";
import { formatCompany, formatExperience } from "./specialist-format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CardHeaderRow,
  CategoryPill,
  DetailGrid,
  DetailItem,
  DetailLabel,
  DetailValue,
} from "./admin-ui";

type FilterTab = "ALL" | UserStatus;

interface TabDefinition {
  key: FilterTab;
  label: string;
}

const TABS: TabDefinition[] = [
  { key: "ALL", label: "Всички" },
  { key: UserStatus.Pending, label: "Чакащи одобрение" },
  { key: UserStatus.Active, label: "Одобрени" },
  { key: UserStatus.Rejected, label: "Отказани" },
];

const statusPill = "rounded-md border py-[3px]";

function getStatusBadge(status: UserStatus) {
  switch (status) {
    case UserStatus.Pending:
      return (
        <Badge
          variant="warning"
          className={cn(statusPill, "border-tone-fed7aa")}
        >
          Чака преглед
        </Badge>
      );
    case UserStatus.Active:
      return (
        <Badge className={cn(statusPill, "border-tone-bbf7d0")}>Одобрен</Badge>
      );
    case UserStatus.Rejected:
      return (
        <Badge
          className={cn(
            statusPill,
            "border-tone-fecaca bg-tone-fee2e2 text-tone-991b1b",
          )}
        >
          Отказан
        </Badge>
      );
    default:
      return null;
  }
}

export interface SpecialistsReviewProps {
  initialSpecialists?: User[] | null;
}

export function SpecialistsReview({
  initialSpecialists,
}: SpecialistsReviewProps = {}) {
  const [overrideStatuses, setOverrideStatuses] = useState<
    Record<number, UserStatus>
  >({});
  const { updateUserStatus } = useAuth();
  const notify = useToast();

  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const specialists = useMemo(() => {
    const baseList = initialSpecialists ?? [];
    return baseList.map((s) => {
      const override = overrideStatuses[s.id];
      return override ? { ...s, status: override } : s;
    });
  }, [initialSpecialists, overrideStatuses]);

  const counts = useMemo(() => {
    return {
      ALL: specialists.length,
      PENDING: specialists.filter((s) => s.status === UserStatus.Pending)
        .length,
      ACTIVE: specialists.filter((s) => s.status === UserStatus.Active).length,
      REJECTED: specialists.filter((s) => s.status === UserStatus.Rejected)
        .length,
    };
  }, [specialists]);

  const filteredSpecialists = useMemo(() => {
    return specialists.filter((spec) => {
      if (activeTab !== "ALL" && spec.status !== activeTab) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const query = searchQuery.trim().toLowerCase();
      const profile = spec.specialistProfile;
      const matchName = spec.name.toLowerCase().includes(query);
      const matchEmail = spec.email.toLowerCase().includes(query);
      const matchPhone = spec.phone.includes(query);
      const matchCategory = profile?.category?.toLowerCase().includes(query);
      const matchArea = profile?.area?.toLowerCase().includes(query);
      const matchCompany = profile?.companyName?.toLowerCase().includes(query);
      const matchEik = profile?.eik?.includes(query);

      return Boolean(
        matchName ||
        matchEmail ||
        matchPhone ||
        matchCategory ||
        matchArea ||
        matchCompany ||
        matchEik,
      );
    });
  }, [specialists, activeTab, searchQuery]);

  const handleApprove = async (spec: User) => {
    try {
      setProcessingId(spec.id);
      await updateUserStatus(spec.id, UserStatus.Active);
      setOverrideStatuses((prev) => ({
        ...prev,
        [spec.id]: UserStatus.Active,
      }));
      notify(`Кандидатурата на ${spec.name} е одобрена успешно.`);
    } catch {
      notify("Възникна грешка при одобряване на кандидатурата.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (spec: User) => {
    try {
      setProcessingId(spec.id);
      await updateUserStatus(spec.id, UserStatus.Rejected);
      setOverrideStatuses((prev) => ({
        ...prev,
        [spec.id]: UserStatus.Rejected,
      }));
      notify(`Кандидатурата на ${spec.name} е отказана.`);
    } catch {
      notify("Възникна грешка при отказване на кандидатурата.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Quick stats cards */}
      <div className="mb-2 grid grid-cols-3 gap-4 max-md:grid-cols-1">
        <StatCard label="Общо кандидатури" value={counts.ALL} />
        <StatCard
          label="Чакащи одобрение"
          value={counts.PENDING}
          valueClassName="text-tone-b45309"
        />
        <StatCard
          label="Одобрени специалисти"
          value={counts.ACTIVE}
          valueClassName="text-primary"
        />
      </div>

      {/* Toolbar: tabs and search */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2">
        <div
          className="flex flex-wrap gap-1.5 rounded-[10px] bg-tone-ebf0ec p-1"
          role="tablist"
          aria-label="Филтър по статус на специалист"
        >
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={tab.label}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-[7px] border-0 px-3.5 py-2 text-sm",
                  isSelected
                    ? "bg-white font-[650] text-primary shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                    : "bg-transparent font-semibold text-muted-foreground transition-all duration-150 hover:text-foreground",
                )}
                onClick={() => setActiveTab(tab.key)}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "rounded-xl px-[7px] py-0.5 text-xs font-bold text-primary",
                    isSelected ? "bg-tone-eaf2ec" : "bg-tone-e1e9e2",
                  )}
                >
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative max-w-[380px] min-w-[260px] flex-1">
          <span
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground"
            aria-hidden="true"
          >
            🔍
          </span>
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Търсене по име, сфера, район..."
            className="rounded-lg border-border py-[9px] pr-3.5 pl-9 text-sm text-foreground outline-none focus:border-primary"
            aria-label="Търсене на специалисти"
          />
        </div>
      </div>

      {/* Specialist application cards list */}
      <div className="flex flex-col gap-4">
        {filteredSpecialists.length === 0 ? (
          <div className="rounded-xl border border-border bg-white px-6 py-12 text-center text-muted-foreground">
            <div className="mb-3 text-[32px]" aria-hidden="true">
              📋
            </div>
            <div className="mb-1 text-base font-semibold text-foreground">
              Няма намерени кандидатури на специалисти
            </div>
            <p>
              {searchQuery
                ? "Няма резултати, отговарящи на въведените критерии за търсене."
                : activeTab === UserStatus.Pending
                  ? "В момента няма чакащи одобрение кандидатури."
                  : activeTab === UserStatus.Active
                    ? "Все още няма одобрени специалисти."
                    : activeTab === UserStatus.Rejected
                      ? "Няма отказани кандидатури."
                      : "Все още няма регистрирани специалисти."}
            </p>
          </div>
        ) : (
          filteredSpecialists.map((spec) => {
            const profile = spec.specialistProfile;
            const initial = spec.name.trim().charAt(0).toUpperCase() || "С";
            const isProcessing = processingId === spec.id;

            return (
              <article
                key={spec.id}
                className="rounded-xl border border-border bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[border-color] duration-200 hover:border-tone-cbd7cf"
                aria-label={`Кандидатура на ${spec.name}`}
              >
                <CardHeaderRow className="gap-4 max-md:flex-col max-md:items-stretch">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="grid size-12 shrink-0 place-items-center rounded-full bg-tone-e9efdc text-xl font-bold text-primary"
                      aria-hidden="true"
                    >
                      {initial}
                    </div>
                    <div className="flex flex-col gap-1">
                      <h2 className="m-0 text-lg font-bold text-foreground">
                        {spec.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2">
                        {profile?.category && (
                          <CategoryPill>{profile.category}</CategoryPill>
                        )}
                        {getStatusBadge(spec.status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => handleApprove(spec)}
                      disabled={
                        isProcessing || spec.status === UserStatus.Active
                      }
                      className="px-[18px] py-2 text-sm"
                    >
                      {spec.status === UserStatus.Active
                        ? "Одобрен ✓"
                        : "Одобри"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleReject(spec)}
                      disabled={
                        isProcessing || spec.status === UserStatus.Rejected
                      }
                      className="border-tone-fecaca px-[18px] py-2 text-sm text-tone-991b1b hover:bg-tone-fee2e2"
                    >
                      {spec.status === UserStatus.Rejected
                        ? "Отказан ✕"
                        : "Откажи"}
                    </Button>
                  </div>
                </CardHeaderRow>

                <DetailGrid className="mt-[18px] grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-[18px] gap-y-3 bg-tone-fbfdfa p-4 max-md:grid-cols-1">
                  <DetailItem label="Имейл адрес">
                    <a
                      href={`mailto:${spec.email}`}
                      className="text-sm font-medium break-words text-primary no-underline hover:underline"
                    >
                      {spec.email}
                    </a>
                  </DetailItem>

                  <DetailItem label="Телефонен номер">
                    <a
                      href={`tel:${spec.phone}`}
                      className="text-sm font-medium break-words text-primary no-underline hover:underline"
                    >
                      {spec.phone}
                    </a>
                  </DetailItem>

                  <DetailItem label="Сфера на дейност">
                    <DetailValue className="text-sm">
                      {profile?.category || "—"}
                    </DetailValue>
                  </DetailItem>

                  <DetailItem label="Район на обслужване">
                    <DetailValue className="text-sm">
                      {profile?.area || "—"}
                    </DetailValue>
                  </DetailItem>

                  <DetailItem label="Професионален опит">
                    <DetailValue className="text-sm">
                      {formatExperience(profile?.experienceYears)}
                    </DetailValue>
                  </DetailItem>

                  <DetailItem label="Фирма / ЕИК">
                    <DetailValue className="text-sm">
                      {formatCompany(profile?.companyName, profile?.eik)}
                    </DetailValue>
                  </DetailItem>
                </DetailGrid>

                {profile?.bio && (
                  <div className="mt-4 border-t border-tone-edf2ed pt-3.5">
                    <DetailLabel className="mb-1.5 block">
                      Професионално представяне (Био)
                    </DetailLabel>
                    <p className="m-0 text-sm leading-[1.55] text-foreground">
                      {profile.bio}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-tone-edf2ed pt-3 text-xs text-muted-foreground">
                  <span>
                    Подадена на:{" "}
                    {new Date(spec.createdAt).toLocaleDateString("bg-BG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span>ID: {spec.id}</span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-white px-[22px] py-[18px] text-[13px] font-medium text-muted-foreground">
      <span>{label}</span>
      <span
        className={cn("text-[28px] font-bold text-foreground", valueClassName)}
      >
        {value}
      </span>
    </div>
  );
}
