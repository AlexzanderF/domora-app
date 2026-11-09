import type { FailedDelivery } from "./server/failed-deliveries";

export function FailedDeliveriesList({
  deliveries,
}: {
  deliveries: FailedDelivery[];
}) {
  if (deliveries.length === 0) {
    return (
      <p className="text-[14px] text-muted-foreground">
        Няма неуспешни известия.
      </p>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
      {deliveries.map((d) => (
        <li
          key={d.id}
          className="flex flex-col gap-1.5 rounded-[10px] border border-border bg-[#fbfdfa] px-5 py-[18px]"
        >
          <div className="flex flex-wrap justify-between gap-3.5">
            <strong>{d.eventType}</strong>
            <span className="text-[14px] text-muted-foreground">
              Опити: {d.attempts}
            </span>
          </div>
          <div>Получател: {d.recipient}</div>
          <div className="font-mono text-[13px] break-words">
            Последна грешка: {d.lastError ?? "—"}
          </div>
        </li>
      ))}
    </ul>
  );
}
