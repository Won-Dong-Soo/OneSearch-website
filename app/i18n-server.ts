import { cookies, headers } from "next/headers";
import { normalizeLocale, type Locale } from "./i18n-config";

export const LANGUAGE_COOKIE = "onesearch_language";

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const savedLocale = normalizeLocale(cookieStore.get(LANGUAGE_COOKIE)?.value);
  if (savedLocale) return savedLocale;

  const requestHeaders = await headers();
  const acceptedLocale = normalizeLocale(requestHeaders.get("accept-language")?.split(",")[0]);
  return acceptedLocale ?? "ko";
}
