import { closeDbPool } from "@/db";
import { processOutbox } from "@/domain/notifications";
import { createNotifier } from "@/domain/notifications/notifier";
import { sweepOrphanUploads } from "@/domain/photos/sweep";
import { accountFlowHandlers } from "@/domain/notifications/account-flow";
import { requestFlowHandlers } from "@/domain/notifications/request-flow";

// Long-running worker: same image as the web app, own Compose service. Polls
// the outbox and delivers through the configured notifier.

const POLL_INTERVAL_MS = 5_000;
const SWEEP_INTERVAL_MS = 60 * 60 * 1000;

async function main(): Promise<void> {
  const notifier = createNotifier(process.env.NOTIFIER_DRIVER, {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.NOTIFIER_FROM,
  });
  let stopping = false;
  const stop = () => {
    stopping = true;
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);

  console.log("[worker] started");
  let lastSweep = 0;
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
    if (Date.now() - lastSweep >= SWEEP_INTERVAL_MS) {
      // Marked before running so a failing sweep retries next hour, not every tick.
      lastSweep = Date.now();
      try {
        const { deleted } = await sweepOrphanUploads();
        if (deleted > 0)
          console.log("[worker] orphan uploads removed", deleted);
      } catch (error) {
        console.error("[worker] orphan sweep failed:", error);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  await closeDbPool();
  console.log("[worker] stopped");
}

void main();
