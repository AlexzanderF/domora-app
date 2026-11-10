import { cn } from "@/lib/utils";

/** Dashed placeholder shown when an admin queue has nothing to triage. */
export function QueueEmpty({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-[1.5px] border-dashed border-border bg-[rgba(248,250,252,0.6)] px-5 py-7 text-center">
      <span className="mb-2.5 text-2xl" aria-hidden="true">
        {icon}
      </span>
      <p className="m-0 mb-1 text-sm font-semibold text-foreground">{title}</p>
      <p className="m-0 max-w-[480px] text-[13px] leading-[1.45] text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/** Small uppercase caption used above a detail value. */
export function DetailLabel({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "text-[11px] font-semibold tracking-[0.5px] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function DetailGrid({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-4 gap-y-2.5 rounded-lg border border-tone-edf2ed bg-white p-3.5 max-md:grid-cols-1",
        className,
      )}
      {...props}
    />
  );
}

export function DetailItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <DetailLabel>{label}</DetailLabel>
      {children}
    </div>
  );
}

/** Card title row: wraps, and stacks on tablet/phone widths. */
export function CardHeaderRow({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3.5",
        className,
      )}
      {...props}
    />
  );
}

/** Rounded category pill used on specialist and request cards. */
export function CategoryPill({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-block rounded-md border border-tone-d8e4d9 bg-tone-f0f4ef px-2 py-[3px] text-xs font-semibold text-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Command-centre queue panel: title, tag badge, optional header action. */
export function QueueSection({
  title,
  tag,
  action,
  children,
}: {
  title: string;
  tag: string;
  action: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-white px-6 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(0,0,0,0.06)] pb-3.5">
        <div className="flex items-center gap-2.5">
          <h2 className="m-0 text-[17px] leading-[1.3] font-bold text-tone-0f172a">
            {title}
          </h2>
          <QueueTag>{tag}</QueueTag>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function QueueTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-tone-f1f5f9 px-2 py-[3px] text-[11px] font-semibold text-tone-475569">
      {children}
    </span>
  );
}

export function DetailValue({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "text-[13px] font-medium break-words text-foreground",
        className,
      )}
      {...props}
    />
  );
}
