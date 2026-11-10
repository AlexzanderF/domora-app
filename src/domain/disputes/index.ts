import { and, desc, eq, isNull } from "drizzle-orm";
import { requestDisputes, requireDb, requests } from "@/db";
import type { RequestDisputeSelect } from "@/db";
import { can } from "@/domain/authorization";
import type { Actor } from "@/domain/authorization";
import {
  RequestError,
  invalidState,
  requireActor,
  resourceOf,
  forbidden,
} from "@/domain/requests";
import { transitionRequest } from "@/domain/requests/transition";
import { UserRole } from "@/domain/identity/types";
import {
  MAX_DISPUTE_NOTE_LENGTH,
  canRaiseDispute,
  canResolveDispute,
  isValidDisputeNote,
  normalizeDisputeNote,
} from "@/domain/requests/lifecycle";

// Framework-free (no next/*): raising and resolving disputes on reported work. The requests table still
// calls the open-dispute flag and note `issue` / `issueNote`.
// A dispute is never deleted: resolving stamps the row, so the history stays.

// Serializable view of one dispute: timestamps are ISO strings.
export interface DisputeDto {
  id: number;
  requestId: number;
  raisedById: number | null;
  note: string;
  raisedAt: string;
  resolvedById: number | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
}

function toDisputeDto(row: RequestDisputeSelect): DisputeDto {
  return {
    id: row.id,
    requestId: row.requestId,
    raisedById: row.raisedById,
    note: row.note,
    raisedAt: row.raisedAt.toISOString(),
    resolvedById: row.resolvedById,
    resolutionNote: row.resolutionNote,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
  };
}

function cleanResolutionNote(value: string | undefined): string {
  const note = normalizeDisputeNote(value);
  if (note.length > MAX_DISPUTE_NOTE_LENGTH) {
    throw new RequestError(
      "INVALID_INPUT",
      `The note must be at most ${MAX_DISPUTE_NOTE_LENGTH} characters.`,
    );
  }
  return note;
}

// The request's client flags a problem with the reported work. The note is
// stored, the request is flagged for the specialist and the admin triage queue.
export async function raiseDispute(
  actorOrNull: Actor | null,
  requestId: number,
  note: string,
): Promise<DisputeDto> {
  const actor = requireActor(actorOrNull);
  const text = normalizeDisputeNote(note);
  if (!isValidDisputeNote(text)) {
    throw new RequestError(
      "INVALID_INPUT",
      `A note of 1 to ${MAX_DISPUTE_NOTE_LENGTH} characters is required.`,
    );
  }

  let dispute: RequestDisputeSelect | undefined;
  await transitionRequest(
    actor,
    requestId,
    { action: "request.dispute" },
    async (row, _actor, tx) => {
      // Raising again while a dispute is open changes nothing: hand back the
      // open one instead of failing, so a repeated click is harmless.
      if (row.issue) {
        [dispute] = await tx
          .select()
          .from(requestDisputes)
          .where(
            and(
              eq(requestDisputes.requestId, row.id),
              isNull(requestDisputes.resolvedAt),
            ),
          );
        if (dispute) return null;
      }
      if (!canRaiseDispute(row)) {
        invalidState(
          "A dispute can only be raised on work awaiting confirmation.",
        );
      }
      const now = new Date();
      [dispute] = await tx
        .insert(requestDisputes)
        .values({
          requestId: row.id,
          raisedById: actor.id,
          note: text,
          raisedAt: now,
        })
        .returning();
      return {
        event: {
          type: "request.dispute_raised",
          payload: { requestId: row.id, disputeId: dispute.id },
        },
        values: { issue: true, issueNote: text, issueOpenedAt: now },
      };
    },
  );
  return toDisputeDto(dispute!);
}

// An admin closes the open dispute. The dispute row is kept, stamped with who
// resolved it, when and an optional resolution note.
export async function resolveDispute(
  actorOrNull: Actor | null,
  requestId: number,
  resolutionNote?: string,
): Promise<DisputeDto> {
  const actor = requireActor(actorOrNull);
  const text = cleanResolutionNote(resolutionNote);

  let dispute: RequestDisputeSelect | undefined;
  await transitionRequest(
    actor,
    requestId,
    { action: "request.resolve_dispute" },
    async (row, _actor, tx) => {
      if (!canResolveDispute(row)) {
        invalidState("There is no open dispute on this request.");
      }
      const now = new Date();
      [dispute] = await tx
        .update(requestDisputes)
        .set({
          resolvedById: actor.id,
          resolutionNote: text || null,
          resolvedAt: now,
        })
        .where(
          and(
            eq(requestDisputes.requestId, row.id),
            isNull(requestDisputes.resolvedAt),
          ),
        )
        .returning();
      // A flag set before disputes were stored has no row yet; record it
      // as resolved so the history still shows it.
      if (!dispute) {
        [dispute] = await tx
          .insert(requestDisputes)
          .values({
            requestId: row.id,
            note: row.issueNote ?? "—",
            raisedAt: row.issueOpenedAt ?? now,
            resolvedById: actor.id,
            resolutionNote: text || null,
            resolvedAt: now,
          })
          .returning();
      }
      return {
        event: {
          type: "request.dispute_resolved",
          payload: { requestId: row.id, resolutionNote: text },
        },
        values: { issue: false, issueNote: null },
      };
    },
  );
  return toDisputeDto(dispute!);
}

// Every dispute raised on one request, newest first. Visible to the request's
// client, its assigned specialist and admins.
export async function getDisputeHistory(
  actorOrNull: Actor | null,
  requestId: number,
): Promise<DisputeDto[]> {
  const actor = requireActor(actorOrNull);
  const db = requireDb();
  const [row] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId));
  if (!row) throw new RequestError("NOT_FOUND", "Request not found.");
  const mayRead =
    can(actor, "request.view", resourceOf(row)) &&
    (actor.role !== UserRole.Specialist || row.specialistId === actor.id);
  if (!mayRead) forbidden();

  const rows = await db
    .select()
    .from(requestDisputes)
    .where(eq(requestDisputes.requestId, requestId))
    .orderBy(desc(requestDisputes.raisedAt), desc(requestDisputes.id));
  return rows.map(toDisputeDto);
}
