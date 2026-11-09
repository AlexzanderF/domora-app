import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const rowText =
  "mt-[5px] mb-2.5 text-sm leading-[1.55] text-muted-foreground";

export function SpecialistSection({
  title,
  badge,
  action,
  children,
}: {
  title: string;
  badge: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="mb-6 p-6 max-[700px]:p-6">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3.5">
        <div>
          <h2 className="mb-1 text-[17px] font-bold">{title}</h2>
          <Badge className="rounded-md bg-tone-f1f5f9 px-2 py-[3px] text-[11px] text-tone-475569">
            {badge}
          </Badge>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function RequestRow({
  label,
  icon,
  amount,
  disputed = false,
  children,
}: {
  label: string;
  icon: ReactNode;
  amount: ReactNode;
  disputed?: boolean;
  children: ReactNode;
}) {
  return (
    <article
      aria-label={label}
      className={cn(
        "flex items-start gap-4 border-b border-border py-[19px] last:border-b-0 last:pb-0 max-[700px]:gap-2.5",
        disputed && "rounded-[10px] bg-tone-fdf3f2 px-3",
      )}
    >
      <div className="grid size-[42px] shrink-0 place-items-center rounded-[9px] bg-tone-f0f4ef [&_svg]:size-[22px] [&_svg]:stroke-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">{children}</div>
      <span className="text-lg font-[650] whitespace-nowrap max-[700px]:text-base">
        {amount}
      </span>
    </article>
  );
}

export function RequestActions({ children }: { children: ReactNode }) {
  return <div className="mt-[13px] flex flex-wrap gap-2">{children}</div>;
}

export const actionButton = "px-3 py-[7px] text-sm";
