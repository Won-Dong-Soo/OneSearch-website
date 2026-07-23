import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PressKit } from "./press-kit";
import { LanguageSwitcher } from "../language-provider";
import { getRequestLocale } from "../i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "ko" ? "미디어 키트" : "Media Kit",
    description: locale === "ko" ? "OneSearch 소개 문구, 제품 정보, 로고와 소셜 공유 자료" : "OneSearch product facts, ready-to-use copy, logo, and social assets.",
    alternates: { canonical: "/press" },
  };
}

export default async function PressPage() {
  const locale = await getRequestLocale();
  const copy = locale === "ko" ? { home: "OneSearch 홈", community: "커뮤니티", download: "다운로드", footer: "정책 및 지원", terms: "이용약관", privacy: "개인정보 처리방침", support: "고객지원", release: "GitHub 릴리스" } : { home: "OneSearch home", community: "Community", download: "Download", footer: "Policies and support", terms: "Terms", privacy: "Privacy", support: "Support", release: "GitHub release" };
  return (
    <main className="press-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label={copy.home}>
          <Image src="/onesearch-icon.png" alt="" width={38} height={38} unoptimized />
          <span>OneSearch</span>
        </Link>
        <div className="header-actions">
          <Link className="header-link header-link-muted" href="/community">{copy.community}</Link>
          <Link className="header-link" href="/#download">{copy.download}</Link>
          <LanguageSwitcher />
        </div>
      </header>
      <PressKit />
      <footer>
        <span>OneSearch Media Kit</span>
        <nav aria-label={copy.footer}>
          <Link href="/terms">{copy.terms}</Link>
          <Link href="/privacy">{copy.privacy}</Link>
          <Link href="/support">{copy.support}</Link>
          <a href="https://github.com/onesearch-app/onesearch/releases/tag/v1.0.0" target="_blank" rel="noreferrer">{copy.release}</a>
        </nav>
        <span>VERSION 1.0.0</span>
      </footer>
    </main>
  );
}
