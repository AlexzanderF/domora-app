import { describe, expect, it } from "vitest";
import {
  canAdvance,
  canCancelAsClient,
  canClaim,
  canConfirmCompletion,
  canHandBack,
  canRaiseDispute,
  canRate,
  canResolveDispute,
  canStartWork,
  isActiveStage,
  isValidDisputeNote,
  isValidRating,
  normalizeDisputeNote,
  requiresCompletionReport,
} from "./lifecycle";
import { RequestStatus } from "./types";

const S = RequestStatus;

describe("lifecycle predicates", () => {
  it("isActiveStage covers accepted, in progress, awaiting confirmation", () => {
    expect(isActiveStage(S.Created)).toBe(false);
    expect(isActiveStage(S.Accepted)).toBe(true);
    expect(isActiveStage(S.InProgress)).toBe(true);
    expect(isActiveStage(S.AwaitingConfirmation)).toBe(true);
    expect(isActiveStage(S.Completed)).toBe(false);
  });

  it("canClaim needs an unassigned, uncancelled created request", () => {
    expect(canClaim({ status: S.Created })).toBe(true);
    expect(canClaim({ status: S.Created, specialistId: 3 })).toBe(false);
    expect(canClaim({ status: S.Created, cancelled: true })).toBe(false);
    expect(canClaim({ status: S.Accepted })).toBe(false);
  });

  it("canAdvance and canCancelAsClient hold before confirmation only", () => {
    for (const fn of [canAdvance, canCancelAsClient]) {
      expect(fn({ status: S.Created })).toBe(true);
      expect(fn({ status: S.Accepted })).toBe(true);
      expect(fn({ status: S.InProgress })).toBe(true);
      expect(fn({ status: S.AwaitingConfirmation })).toBe(false);
      expect(fn({ status: S.Completed })).toBe(false);
      expect(fn({ status: S.Created, cancelled: true })).toBe(false);
    }
  });

  it("canStartWork and canHandBack need accepted, uncancelled work", () => {
    for (const fn of [canStartWork, canHandBack]) {
      expect(fn({ status: S.Accepted })).toBe(true);
      expect(fn({ status: S.Created })).toBe(false);
      expect(fn({ status: S.InProgress })).toBe(false);
      expect(fn({ status: S.Accepted, cancelled: true })).toBe(false);
    }
  });

  it("requiresCompletionReport only while in progress", () => {
    expect(requiresCompletionReport(S.InProgress)).toBe(true);
    expect(requiresCompletionReport(S.Accepted)).toBe(false);
  });

  it("canConfirmCompletion needs awaiting confirmation, uncancelled", () => {
    expect(canConfirmCompletion({ status: S.AwaitingConfirmation })).toBe(true);
    expect(canConfirmCompletion({ status: S.InProgress })).toBe(false);
    expect(
      canConfirmCompletion({ status: S.AwaitingConfirmation, cancelled: true }),
    ).toBe(false);
  });

  it("canRaiseDispute only once, while awaiting confirmation", () => {
    expect(canRaiseDispute({ status: S.AwaitingConfirmation })).toBe(true);
    expect(
      canRaiseDispute({ status: S.AwaitingConfirmation, issue: true }),
    ).toBe(false);
    expect(canRaiseDispute({ status: S.Completed })).toBe(false);
    expect(
      canRaiseDispute({ status: S.AwaitingConfirmation, cancelled: true }),
    ).toBe(false);
  });

  it("canResolveDispute needs an open issue", () => {
    expect(canResolveDispute({ status: S.Completed, issue: true })).toBe(true);
    expect(canResolveDispute({ status: S.Completed, issue: false })).toBe(
      false,
    );
    expect(canResolveDispute({ status: S.Completed })).toBe(false);
  });

  it("isValidRating accepts integers 1 to 5", () => {
    expect(isValidRating(1)).toBe(true);
    expect(isValidRating(5)).toBe(true);
    expect(isValidRating(0)).toBe(false);
    expect(isValidRating(6)).toBe(false);
    expect(isValidRating(3.5)).toBe(false);
    expect(isValidRating("4")).toBe(false);
  });

  it("canRate needs a completed, unrated, uncancelled request and valid rating", () => {
    expect(canRate({ status: S.Completed }, 5)).toBe(true);
    expect(canRate({ status: S.Completed, rating: 4 }, 5)).toBe(false);
    expect(canRate({ status: S.Completed }, 9)).toBe(false);
    expect(canRate({ status: S.Accepted }, 5)).toBe(false);
    expect(canRate({ status: S.Completed, cancelled: true }, 5)).toBe(false);
  });

  it("dispute notes are trimmed and bounded to 2000 characters", () => {
    expect(normalizeDisputeNote("  hi ")).toBe("hi");
    expect(normalizeDisputeNote(undefined)).toBe("");
    expect(isValidDisputeNote("")).toBe(false);
    expect(isValidDisputeNote("a")).toBe(true);
    expect(isValidDisputeNote("a".repeat(2000))).toBe(true);
    expect(isValidDisputeNote("a".repeat(2001))).toBe(false);
  });
});
