import { accountFlowHandlers } from "./account-flow";
import type { ExhaustiveEventHandlers } from "./index";
import { requestFlowHandlers } from "./request-flow";

// What the worker runs: one entry per event type, either a handler or an
// explicit null for "no notification". Adding an event type breaks this
// until it is decided.
export const eventHandlers: ExhaustiveEventHandlers = {
  "request.created": requestFlowHandlers["request.created"]!,
  "request.accepted": requestFlowHandlers["request.accepted"]!,
  "request.recommended": requestFlowHandlers["request.recommended"]!,
  "request.report_submitted": requestFlowHandlers["request.report_submitted"]!,
  "request.completed": null,
  "request.dispute_raised": requestFlowHandlers["request.dispute_raised"]!,
  "request.dispute_resolved": requestFlowHandlers["request.dispute_resolved"]!,
  "specialist.registered": accountFlowHandlers["specialist.registered"]!,
  "specialist.approved": accountFlowHandlers["specialist.approved"]!,
  "specialist.rejected": accountFlowHandlers["specialist.rejected"]!,
  "password.reset_requested": accountFlowHandlers["password.reset_requested"]!,
  "password.reset_completed": null,
  "account.client_registered": null,
  "account.profile_updated": null,
  "tariffs.updated": null,
};
