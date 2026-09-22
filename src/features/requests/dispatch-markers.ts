import { sql, type SQL } from "drizzle-orm";
import { requests } from "@/db/schema";

// Single owner of the description-encoded request flags. Markers only ever
// count at line starts: every writer appends them on their own line, so
// line-anchored parsing can never false-positive on client-typed text.
const CANCELLED_PREFIX = "[ОТКАЗАНА] ";

const REPORT_PATTERN = /^\[ОТЧЕТ\]\s*([^\n]+)/m;
const RATING_PATTERN = /^\[ОЦЕНКА:\s*(\d)\/5\]/m;
const ISSUE_PATTERN = /^\[СИГНАЛ\]\s*([^\n]*)/m;
const RECOMMEND_PATTERN = /^\[ПРЕПОРЪЧАНА:\s*(\d+)\]/m;
const DISPATCH_PATTERN = /^\[ДИСПЕЧЕР\]/m;

// Full-line markers share the line with nothing else, so stripping removes
// the whole line. [ОТКАЗАНА] is a prefix sharing its line with client text
// and is handled separately.
const FULL_LINE_MARKER_PATTERN =
  /^\[(ОТЧЕТ|СИГНАЛ|ОЦЕНКА:[^\n\]]*|ПРЕПОРЪЧАНА:[^\n\]]*|ДИСПЕЧЕР)[^\n]*\n?/gm;

export function parseReport(description: string): string | undefined {
  const match = description.match(REPORT_PATTERN);
  return match ? match[1].trim() : undefined;
}

export function parseRating(description: string): number | undefined {
  const match = description.match(RATING_PATTERN);
  return match ? Number(match[1]) : undefined;
}

export function parseIssueNote(description: string): string | undefined {
  const match = description.match(ISSUE_PATTERN);
  const note = match ? match[1].trim() : "";
  return note ? note : undefined;
}

export function hasIssueMarker(description: string): boolean {
  return ISSUE_PATTERN.test(description);
}

export function isCancelledDescription(description: string): boolean {
  return description.startsWith(CANCELLED_PREFIX);
}

export function parseRecommendMarker(description: string): number | undefined {
  const match = description.match(RECOMMEND_PATTERN);
  return match ? Number(match[1]) : undefined;
}

export function hasDispatchMarker(description: string): boolean {
  return DISPATCH_PATTERN.test(description);
}

export function stripAllMarkers(description: string): string {
  const withoutPrefix = isCancelledDescription(description)
    ? description.slice(CANCELLED_PREFIX.length)
    : description;
  return withoutPrefix
    .replace(FULL_LINE_MARKER_PATTERN, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function appendReport(description: string, report: string): string {
  const clean = description.replace(/^\[ОТЧЕТ\][^\n]*\n?/gm, "").trim();
  return `${clean}\n[ОТЧЕТ] ${report.trim()}`;
}

export function appendRating(description: string, rating: number): string {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Оценката трябва да е цяло число от 1 до 5.");
  }
  const clean = description.replace(/^\[ОЦЕНКА:[^\n]*\n?/gm, "").trim();
  return `${clean}\n[ОЦЕНКА: ${rating}/5]`;
}

export function appendIssue(description: string): string {
  if (hasIssueMarker(description)) return description;
  return `${description}\n[СИГНАЛ] Подаден сигнал от клиент`;
}

export function removeIssueMarker(description: string): string {
  return description
    .replace(/^\[СИГНАЛ\][^\n]*\n?/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function markCancelled(description: string): string {
  if (isCancelledDescription(description)) return description;
  return `${CANCELLED_PREFIX}${description}`;
}

export function stripRecommendMarkers(description: string): string {
  return description.replace(/^\[ПРЕПОРЪЧАНА:[^\n]*\n?/gm, "").trim();
}

export function appendRecommendMarker(
  description: string,
  specialistId: number,
): string {
  return `${stripRecommendMarkers(description)}\n[ПРЕПОРЪЧАНА: ${specialistId}]`;
}

export function appendDispatchMarker(description: string): string {
  return `${stripRecommendMarkers(description)}\n[ДИСПЕЧЕР] Разпределена от администратор`;
}

export function issueFlagCondition(): SQL {
  return sql`(${requests.description} LIKE '[СИГНАЛ]%' OR ${requests.description} LIKE ('%' || chr(10) || '[СИГНАЛ]%'))`;
}

export function notCancelledCondition(): SQL {
  return sql`${requests.description} NOT LIKE '[ОТКАЗАНА] %'`;
}
