"use client";

import { Card } from "@/components/ui/card";
import { money } from "@/lib/format";
import type { AdminKpiMetrics } from "./server/metrics";

export interface AdminKpiCardsProps {
  initialMetrics: AdminKpiMetrics | null;
}

interface KpiCardProps {
  icon: string;
  tag: string;
  label: string;
  value: string | number;
  subtext: string;
  /** Tailwind classes for the accent bar, icon chip and tag pill. */
  tone: { bar: string; icon: string; tag: string };
}

const tones = {
  urgent: {
    bar: "bg-linear-to-r from-[#dc2626] to-[#f59e0b]",
    icon: "bg-[rgba(220,38,38,0.1)] text-[#dc2626]",
    tag: "bg-[rgba(220,38,38,0.12)] text-[#b91c1c]",
  },
  pending: {
    bar: "bg-linear-to-r from-[#2563eb] to-[#38bdf8]",
    icon: "bg-[rgba(37,99,235,0.1)] text-[#2563eb]",
    tag: "bg-[rgba(37,99,235,0.12)] text-[#1d4ed8]",
  },
  active: {
    bar: "bg-linear-to-r from-[#059669] to-[#34d399]",
    icon: "bg-[rgba(5,150,105,0.1)] text-[#059669]",
    tag: "bg-[rgba(5,150,105,0.12)] text-[#047857]",
  },
  revenue: {
    bar: "bg-linear-to-r from-[#7c3aed] to-[#a855f7]",
    icon: "bg-[rgba(124,58,237,0.1)] text-[#7c3aed]",
    tag: "bg-[rgba(124,58,237,0.12)] text-[#6d28d9]",
  },
};

function KpiCard({ icon, tag, label, value, subtext, tone }: KpiCardProps) {
  return (
    <Card className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-white px-[22px] py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] max-[700px]:flex-row max-[700px]:items-center max-[700px]:justify-between max-[700px]:px-5 max-[700px]:py-3.5">
      <div className={`absolute inset-x-0 top-0 h-1 ${tone.bar}`} />
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span
            className={`inline-flex size-8 items-center justify-center rounded-lg text-base ${tone.icon}`}
            aria-hidden="true"
          >
            {icon}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-[0.04em] uppercase ${tone.tag}`}
          >
            {tag}
          </span>
        </div>
        <div className="mb-1.5 text-[13px] leading-[1.35] font-medium text-[#64748b]">
          {label}
        </div>
      </div>
      <div>
        <strong className="mb-1.5 block text-[28px] leading-[1.1] font-bold tracking-[-0.02em] text-[#0f172a]">
          {value}
        </strong>
        <div className="text-xs leading-[1.3] text-[#64748b]">{subtext}</div>
      </div>
    </Card>
  );
}

export function AdminKpiCards({ initialMetrics }: AdminKpiCardsProps) {
  const unassignedUrgentCount = initialMetrics?.unassignedUrgentCount ?? 0;
  const pendingSpecialistsCount = initialMetrics?.pendingSpecialistsCount ?? 0;
  const activeRepairsCount = initialMetrics?.activeRepairsCount ?? 0;
  const monthlyRevenue = initialMetrics?.monthlyRevenue ?? 0;

  return (
    <div className="mb-7 grid grid-cols-4 gap-4 max-[1080px]:grid-cols-2 max-[600px]:grid-cols-1">
      <KpiCard
        tone={tones.urgent}
        icon="⚡"
        tag="Спешни"
        label="Неразпределени спешни заявки"
        value={unassignedUrgentCount}
        subtext={
          unassignedUrgentCount === 1
            ? "1 чакаща спешна заявка"
            : `${unassignedUrgentCount} чакащи спешни заявки`
        }
      />
      <KpiCard
        tone={tones.pending}
        icon="👥"
        tag="Кандидати"
        label="Чакащи одобрение специалисти"
        value={pendingSpecialistsCount}
        subtext={
          pendingSpecialistsCount === 1
            ? "1 нов профил за преглед"
            : `${pendingSpecialistsCount} нови профила за преглед`
        }
      />
      <KpiCard
        tone={tones.active}
        icon="🔧"
        tag="В процес"
        label="Активни ремонти днес"
        value={activeRepairsCount}
        subtext="Поети или в изпълнение"
      />
      <KpiCard
        tone={tones.revenue}
        icon="📈"
        tag="Оборот"
        label="Приходи за месеца"
        value={money(monthlyRevenue)}
        subtext="От приключени заявки"
      />
    </div>
  );
}
