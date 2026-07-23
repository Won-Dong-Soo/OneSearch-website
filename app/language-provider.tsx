"use client";

import { Languages } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { localeName, type Locale } from "./i18n-config";

const LANGUAGE_COOKIE = "onesearch_language";
const LanguageContext = createContext<Locale>("ko");

function persistLocale(locale: Locale) {
  document.cookie = `${LANGUAGE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale] = useState(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <LanguageContext.Provider value={locale}>{children}</LanguageContext.Provider>;
}

export function useLocale() {
  return useContext(LanguageContext);
}

export function LanguageSwitcher() {
  const locale = useLocale();

  const selectLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    persistLocale(nextLocale);
    window.location.reload();
  };

  const label = locale === "ko" ? "언어 선택" : "Choose language";

  return (
    <div className="language-switcher" role="group" aria-label={label}>
      <Languages size={16} aria-hidden="true" />
      {(["ko", "en"] as const).map((item) => (
        <button
          type="button"
          className={locale === item ? "active" : ""}
          aria-pressed={locale === item}
          title={localeName(item)}
          onClick={() => selectLocale(item)}
          key={item}
        >
          <span className="language-wide">{localeName(item)}</span>
          <span className="language-short">{item.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
