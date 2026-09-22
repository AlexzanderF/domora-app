// Codec for the admin dispatch markers stored in the request description
// column, following the existing description-encoded flag convention
// ([ОТЧЕТ], [СИГНАЛ], [ОЦЕНКА], [ОТКАЗАНА]).

const RECOMMEND_PATTERN = /\[ПРЕПОРЪЧАНА:\s*(\d+)\]/;
const RECOMMEND_STRIP_PATTERN = /\n?\[ПРЕПОРЪЧАНА:\s*\d+\]/g;
const DISPATCH_STRIP_PATTERN = /\n?\[ДИСПЕЧЕР\][^\n]*/g;

export function parseRecommendMarker(description: string): number | undefined {
  const match = description.match(RECOMMEND_PATTERN);
  return match ? Number(match[1]) : undefined;
}

export function hasDispatchMarker(description: string): boolean {
  return description.includes("[ДИСПЕЧЕР]");
}

export function stripRecommendMarkers(description: string): string {
  return description.replace(RECOMMEND_STRIP_PATTERN, "").trim();
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

export function stripDispatchMarkers(description: string): string {
  return description
    .replace(RECOMMEND_STRIP_PATTERN, "")
    .replace(DISPATCH_STRIP_PATTERN, "")
    .trim();
}
