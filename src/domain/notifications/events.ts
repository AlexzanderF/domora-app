import type { Tariffs } from "@/domain/requests/types";

// Framework-free: every outbox event the domain can emit, with its payload.
// Adding an event here without deciding its notification (see
// notifications/handlers.ts) fails to compile.

// A `secrets` key is for values that must not outlive the email, such as a
// reset token: it is removed from the event at fan-out.
export interface EventPayloads {
  "request.created": { requestId: number };
  "request.accepted": { requestId: number };
  "request.assigned": { requestId: number };
  "request.recommendation_declined": { requestId: number };
  "request.started": { requestId: number };
  "request.recommended": { requestId: number; specialistId: number };
  "request.report_submitted": { requestId: number };
  "request.completed": { requestId: number };
  "request.rated": { requestId: number };
  "request.cancelled": { requestId: number };
  "request.released": { requestId: number };
  "request.dispute_raised": { requestId: number; disputeId: number };
  "request.dispute_resolved": { requestId: number; resolutionNote: string };
  "specialist.registered": { userId: number };
  "specialist.approved": { userId: number };
  "specialist.rejected": { userId: number };
  "password.reset_requested": { userId: number; secrets: { token: string } };
  "password.reset_completed": { userId: number };
  "tariffs.updated": { actorId: number; tariffs: Tariffs };
}

export type EventType = keyof EventPayloads;

export type OutboxEvent = {
  [K in EventType]: {
    type: K;
    // Bump when the payload shape changes so old events stay readable.
    version?: number;
    payload: EventPayloads[K];
  };
}[EventType];
