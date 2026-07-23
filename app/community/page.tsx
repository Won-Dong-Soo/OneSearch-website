import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CommunityBoard } from "./community-board";
import { LanguageSwitcher } from "../language-provider";
import { getRequestLocale } from "../i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "ko" ? "Q&A·커뮤니티" : "Q&A and Community",
    description: locale === "ko" ? "OneSearch 사용 질문과 검색 워크플로를 공유하는 커뮤니티" : "Ask OneSearch questions and share local-AI search workflows.",
    alternates: { canonical: "/community" },
  };
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ compose?: string }>;
}) {
  const requestedType = (await searchParams).compose;
  const locale = await getRequestLocale();
  const copy = locale === "ko" ? {
    home: "OneSearch 홈", support: "고객지원", download: "다운로드", footerLabel: "정책 및 지원", terms: "이용약관", privacy: "개인정보 처리방침",
  } : {
    home: "OneSearch home", support: "Support", download: "Download", footerLabel: "Policies and support", terms: "Terms", privacy: "Privacy",
  };
  const initialType = requestedType === "discussion" ? "discussion" : "question";
  const initialComposing = requestedType === "question" || requestedType === "discussion";

  return (
    <main className="community-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label={copy.home}>
          <Image src="/onesearch-icon.png" alt="" width={38} height={38} unoptimized />
          <span>OneSearch</span>
        </Link>
        <div className="header-actions">
          <Link className="header-link header-link-muted" href="/support">{copy.support}</Link>
          <Link className="header-link" href="/">{copy.download}</Link>
          <LanguageSwitcher />
        </div>
      </header>
      <CommunityBoard initialType={initialType} initialComposing={initialComposing} />
      <footer>
        <span>OneSearch Community</span>
        <nav aria-label={copy.footerLabel}>
          <Link href="/terms">{copy.terms}</Link>
          <Link href="/privacy">{copy.privacy}</Link>
          <Link href="/support">{copy.support}</Link>
          <a href="https://github.com/onesearch-app/onesearch" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
        <span>Q&A · DISCUSSION</span>
      </footer>
    </main>
  );
}
