export function hasUnsavedReport(text: string, photoCount: number): boolean {
  return text.trim().length > 0 || photoCount > 0;
}
