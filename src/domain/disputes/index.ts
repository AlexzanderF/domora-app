import { and, desc, eq, isNull } from "drizzle-orm";
import { requestDisputes, requireDb, requests } from "@/db";
import type { RequestDisputeSelect } from "@/db";
import { can } from "@/domain/authorization";
import type { Actor } from "@/domain/authorization";
import {
  RequestError,
  forbidden,
  invalidState,
  recordEvent,
  requireActor,
  resourceOf,
} from "@/domain/requests";
import type { Tx } from "@/domain/requests";
import { UserRole } from "@/features/auth/types";
import {
  canFlagIssue,
  canResolveIssue,
} from "@/features/requests/request-rules";

// Framework-free (no next/*): raising and resolving issues on completed work.
// A dispute is never deleted: resolving stamps the row, so the history stays.

const MAX_NOTE_LENGTH = 2000;

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

function cleanNote(value: string | undefined, required: boolean): string {
  const note = value?.trim() ?? "";
  if (required && !note) {
    throw new RequestError("INVALID_INPUT", "A note is required.");
  }
  if (note.length > MAX_NOTE_LENGTH) {
    throw new RequestError(
      "INVALID_INPUT",
      `The note must be at most ${MAX_NOTE_LENGTH} characters.`,
    );
  }
  return note;
}

async function lockRequest(tx: Tx, requestId: number) {
  const [row] = await tx
    .select()
    .from(requests)
    .where(eq(requests.id, requestId))
    .for("update");
  if (!row) throw new RequestError("NOT_FOUND", "Request not found.");
  return row;
}

// The request's client flags a problem with the reported work. The note is
// stored, the request is flagged for the specialist and the admin triage queue.
export async function raiseIssue(
  actorOrNull: Actor | null,
  requestId: number,
  note: string,
): Promise<DisputeDto> {
  const actor = requireActor(actorOrNull);
  const text = cleanNote(note, true);

  return requireDb().transaction(async (tx) => {
    const row = await lockRequest(tx, requestId);
    if (!can(actor, "request.dispute", resourceOf(row))) forbidden();
    if (!canFlagIssue(row)) {
      invalidState(
        "An issue can only be raised on work awaiting confirmation.",
      );
    }
    const now = new Date();
    const [dispute] = await tx
      .insert(requestDisputes)
      .values({
        requestId: row.id,
        raisedById: actor.id,
        note: text,
        raisedAt: now,
      })
      .returning();
    await tx
      .update(requests)
      .set({ issue: true, issueNote: text, issueOpenedAt: now, updatedAt: now })
      .where(eq(requests.id, row.id));
    await recordEvent(tx, {
      requestId: row.id,
      actorId: actor.id,
      type: "request.issue_raised",
      fromStatus: row.status,
      toStatus: row.status,
    });
    return toDisputeDto(dispute);
  });
}

// An admin closes the open dispute. The dispute row is kept, stamped with who
// resolved it, when and an optional resolution note.
export async function resolveIssue(
  actorOrNull: Actor | null,
  requestId: number,
  resolutionNote?: string,
): Promise<DisputeDto> {
  const actor = requireActor(actorOrNull);
  const text = cleanNote(resolutionNote, false);

  return requireDb().transaction(async (tx) => {
    const row = await lockRequest(tx, requestId);
    if (!can(actor, "request.resolve_dispute", resourceOf(row))) forbidden();
    if (!canResolveIssue(row)) {
      invalidState("There is no open issue on this request.");
    }
    const now = new Date();
    let [dispute] = await tx
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
    // An issue flagged before disputes were stored has no row yet; record it
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
    await tx
      .update(requests)
      .set({ issue: false, issueNote: null, updatedAt: now })
      .where(eq(requests.id, row.id));
    await recordEvent(tx, {
      requestId: row.id,
      actorId: actor.id,
      type: "request.issue_resolved",
      fromStatus: row.status,
      toStatus: row.status,
    });
    return toDisputeDto(dispute);
  });
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
