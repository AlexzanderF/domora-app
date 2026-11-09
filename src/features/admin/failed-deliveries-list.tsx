import type { FailedDelivery } from "./server/failed-deliveries";
import styles from "./failed-deliveries-list.module.css";

export function FailedDeliveriesList({
  deliveries,
}: {
  deliveries: FailedDelivery[];
}) {
  if (deliveries.length === 0) {
    return <p className="muted">Няма неуспешни известия.</p>;
  }

  return (
    <ul className={styles.list}>
      {deliveries.map((d) => (
        <li key={d.id} className={styles.card}>
          <div className={styles.header}>
            <strong>{d.eventType}</strong>
            <span className="muted">Опити: {d.attempts}</span>
          </div>
          <div>Получател: {d.recipient}</div>
          <div className={styles.error}>
            Последна грешка: {d.lastError ?? "—"}
          </div>
        </li>
      ))}
    </ul>
  );
}
