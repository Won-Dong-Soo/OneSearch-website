export const locales = ["ko", "en"] as const;

export type Locale = (typeof locales)[number];

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized === "ko" || normalized.startsWith("ko-")) return "ko";
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  return null;
}

export function localeName(locale: Locale) {
  return locale === "ko" ? "한국어" : "English";
}
