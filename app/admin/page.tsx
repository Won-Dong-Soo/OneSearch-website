import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "../language-provider";
import { getRequestLocale } from "../i18n-server";
import { AdminDashboard } from "./admin-dashboard";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "ko" ? "관리자 통계" : "Admin analytics",
    description: locale === "ko" ? "OneSearch 다운로드 및 홍보 통계" : "OneSearch download and promotion analytics",
    robots: { index: false, follow: false },
  };
}

export default async function AdminPage() {
  const locale = await getRequestLocale();
  const copy = locale === "ko"
    ? { home: "OneSearch 홈", back: "사이트로 돌아가기", footer: "OneSearch 관리자" }
    : { home: "OneSearch home", back: "Back to site", footer: "OneSearch Admin" };

  return (
    <main className="admin-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label={copy.home}>
          <Image src="/onesearch-icon.png" alt="" width={38} height={38} unoptimized />
          <span>OneSearch</span>
        </Link>
        <div className="header-actions">
          <Link className="header-link header-link-muted" href="/">{copy.back}</Link>
          <LanguageSwitcher />
        </div>
      </header>
      <AdminDashboard />
      <footer>
        <span>{copy.footer}</span>
        <span>PRIVATE · ANALYTICS</span>
      </footer>
    </main>
  );
}
