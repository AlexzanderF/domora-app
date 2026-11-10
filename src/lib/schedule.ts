export const TIME_RANGES = ["09:00–12:00", "12:00–15:00", "15:00–18:00"];

/** Both values are local `YYYY-MM-DD` strings, so string order is date order. */
export function isPastDate(date: string, today: string) {
  return date < today;
}
