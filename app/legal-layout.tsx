import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "./language-provider";
import { getRequestLocale } from "./i18n-server";

export async function LegalLayout({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  const locale = await getRequestLocale();
  const copy = locale === "ko"
    ? { home: "OneSearch 홈", back: "다운로드로 돌아가기", effective: "시행일: 2026년 7월 21일" }
    : { home: "OneSearch home", back: "Back to downloads", effective: "Effective: July 21, 2026" };
  return (
    <main className="legal-shell">
      <header className="legal-header">
        <Link className="brand" href="/" aria-label={copy.home}>
          <Image src="/onesearch-icon.png" alt="" width={36} height={36} unoptimized />
          <span>OneSearch</span>
        </Link>
        <div className="legal-header-actions"><Link href="/">{copy.back}</Link><LanguageSwitcher /></div>
      </header>
      <article className="legal-document">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="legal-effective">{copy.effective}</p>
        {children}
      </article>
    </main>
  );
}
