import { closeDbPool } from "@/db";
import { processOutbox } from "@/domain/notifications";
import { createNotifier } from "@/domain/notifications/notifier";
import { accountFlowHandlers } from "@/domain/notifications/account-flow";
import { requestFlowHandlers } from "@/domain/notifications/request-flow";

// Long-running worker: same image as the web app, own Compose service. Polls
// the outbox and delivers through the configured notifier.

const POLL_INTERVAL_MS = 5_000;

async function main(): Promise<void> {
  const notifier = createNotifier(process.env.NOTIFIER_DRIVER);
  let stopping = false;
  const stop = () => {
    stopping = true;
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);

  console.log("[worker] started");
  while (!stopping) {
    try {
      const result = await processOutbox({
        notifier,
        handlers: { ...requestFlowHandlers, ...accountFlowHandlers },
      });
      if (result.events + result.sent + result.retried + result.failed > 0) {
        console.log("[worker] tick", result);
      }
    } catch (error) {
      console.error("[worker] tick failed:", error);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  await closeDbPool();
  console.log("[worker] stopped");
}

void main();
