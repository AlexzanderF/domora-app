import Link from "next/link";
import styles from "./auth.module.css";

// Shown for an expired, used or unknown reset link.
export function ResetLinkInvalid() {
  return (
    <>
      <h1 className={styles.title}>Връзката не е валидна</h1>
      <div className={styles.alertError} role="alert">
        Тази връзка за смяна на паролата е невалидна, вече е използвана или е
        изтекла.
      </div>
      <p className={styles.switchPrompt}>
        <Link href="/forgot-password" className={styles.link}>
          Заявете нова връзка
        </Link>
      </p>
    </>
  );
}
