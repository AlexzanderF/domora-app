import { eq } from "drizzle-orm";
import { requestEvents, requests, requireDb } from "@/db";
import type { DomoraDatabase, RequestSelect } from "@/db";
import { can } from "@/domain/authorization";
import type { Action, Actor } from "@/domain/authorization";
import { enqueueEvent } from "@/domain/notifications";
import type { OutboxEvent } from "@/domain/notifications/events";
import { RequestError, forbidden, requireActor } from "./errors";

// Framework-free (no next/*): the one internal step behind every Service
// Request change, shared by the requests, dispatch and disputes modules. It is
// not part of the requests module's public interface.

export type Tx = Parameters<Parameters<DomoraDatabase["transaction"]>[0]>[0];

export function resourceOf(row: RequestSelect) {
  return { clientId: row.clientId, specialistId: row.specialistId };
}

// What a caller decides about a change. The event is both the audit entry and
// the outbox event, so the two always carry the same type.
export interface Change {
  event: OutboxEvent;
  values?: Partial<typeof requests.$inferInsert>;
  // Extra writes that must commit or roll back with the change.
  afterWrite?: (tx: Tx) => Promise<void>;
}

interface TransitionOptions {
  // Checked against the locked request through can().
  action?: Action;
  // Further checks on the locked request, run after `action`.
  guard?: (row: RequestSelect, actor: Actor) => void;
}

// Loads the request under a row lock, authorizes the actor, lets `apply`
// validate and describe the change (or return null for no change), then
// writes the update, the audit entry and the outbox event in one transaction.
export async function transitionRequest(
  actorOrNull: Actor | null,
  requestId: number,
  options: TransitionOptions,
  apply: (
    row: RequestSelect,
    actor: Actor,
    tx: Tx,
  ) => Promise<Change | null> | Change | null,
): Promise<RequestSelect | null> {
  const actor = requireActor(actorOrNull);
  return requireDb().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(requests)
      .where(eq(requests.id, requestId))
      .for("update");
    if (!row) throw new RequestError("NOT_FOUND", "Request not found.");
    if (options.action && !can(actor, options.action, resourceOf(row))) {
      forbidden();
    }
    options.guard?.(row, actor);
    const change = await apply(row, actor, tx);
    if (!change) return null;

    const [updated] = await tx
      .update(requests)
      .set({ ...change.values, updatedAt: new Date() })
      .where(eq(requests.id, row.id))
      .returning();
    await change.afterWrite?.(tx);
    await tx.insert(requestEvents).values({
      requestId: row.id,
      actorId: actor.id,
      type: change.event.type,
      fromStatus: row.status,
      toStatus: updated.status,
    });
    await enqueueEvent(tx, change.event);
    return updated;
  });
}
