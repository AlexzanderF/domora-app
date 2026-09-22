export function formatExperience(years?: number): string {
  if (years === undefined || years === null) return "—";
  if (years === 0) return "Под 1 година";
  if (years === 1) return "1 година";
  return `${years} години`;
}

export function formatCompany(companyName?: string, eik?: string): string {
  if (companyName && eik) {
    return `${companyName} (ЕИК: ${eik})`;
  }
  if (companyName) {
    return companyName;
  }
  if (eik) {
    return `ЕИК: ${eik}`;
  }
  return "Физическо лице";
}
