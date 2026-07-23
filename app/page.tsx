import Image from "next/image";
import type { Metadata } from "next";
import { DownloadSelector } from "./download-selector";
import { GuideDialog } from "./guide-dialog";
import { ProductDemo } from "./product-demo";
import { PricingSection } from "./pricing-section";
import { QnaDialog } from "./qna-dialog";
import { ShareDialog } from "./share-dialog";
import { LanguageSwitcher } from "./language-provider";
import { getRequestLocale } from "./i18n-server";

const HOME_COPY = {
  ko: {
    description: "웹 검색 결과를 로컬 AI가 의미별 폴더와 계층으로 정리하는 데스크톱 앱",
    home: "OneSearch 홈",
    how: "작동 방식",
    community: "커뮤니티",
    download: "다운로드",
    heroDescription: "웹 검색 결과를 로컬 AI가 의미별 폴더와 계층으로 정리합니다. 필요한 페이지는 검색 화면을 떠나지 않고 독립 탭에서 비교하세요.",
    freeDownload: "무료로 다운로드",
    seeHow: "작동 방식 보기",
    proofLabel: "제품 주요 정보",
    proof: ["무료 4B 모델", "AI 분석은 내 컴퓨터에서", "macOS · Windows"],
    demoTitle: "검색 링크를 폴더 구조로 바꾸세요",
    demoDescription: "웹 결과를 수집하고, 로컬 AI가 의미별 폴더로 정리한 뒤, 필요한 페이지를 OneSearch 안에서 비교합니다.",
    outcomesLabel: "OneSearch 활용 사례",
    outcomes: [
      ["RESEARCH", "자료 조사", "여러 관점의 검색 결과를 주제별로 나눠 빠르게 훑습니다."],
      ["COMPARE", "제품·서비스 비교", "가격, 기능, 리뷰 결과를 폴더와 탭으로 나란히 확인합니다."],
      ["KEEP", "검색 결과 보관", "Pro 보관함과 Markdown·CSV 내보내기로 조사 결과를 다시 사용합니다."],
    ],
    installLabel: "설치 안내",
    installs: [
      ["macOS 설치", "DMG를 연 뒤 OneSearch를 응용 프로그램 폴더로 옮기세요. Apple Silicon(M1 이상)용입니다."],
      ["Windows 설치", "설치 파일을 실행해 안내를 따르세요. Windows 10/11 x64 환경을 지원합니다."],
      ["첫 AI 설정", "첫 실행 시 준비 창에서 AI 모델 자동 설치를 누르세요. Free는 빠른 4B 모델, Pro는 8B 또는 14B 모델을 선택할 수 있습니다."],
      ["보안 알림", "파일 무결성과 macOS 기동을 확인했습니다. 공식 코드 서명 전이므로 Gatekeeper 또는 SmartScreen 안내가 표시될 수 있습니다."],
    ],
    footerLabel: "정책 및 지원",
    terms: "이용약관",
    privacy: "개인정보 처리방침",
    refund: "환불 정책",
    support: "고객지원",
    communityFooter: "Q&A·커뮤니티",
    press: "미디어 키트",
  },
  en: {
    description: "A desktop app that organizes web results into semantic folders and hierarchies with local AI",
    home: "OneSearch home",
    how: "How it works",
    community: "Community",
    download: "Download",
    heroDescription: "Local AI organizes web results into semantic folders and hierarchies. Compare the pages you need in separate tabs without leaving your search workspace.",
    freeDownload: "Download for free",
    seeHow: "See how it works",
    proofLabel: "Product highlights",
    proof: ["Free 4B model", "AI runs on your computer", "macOS · Windows"],
    demoTitle: "Turn search links into a folder structure",
    demoDescription: "Collect web results, organize them into semantic folders with local AI, and compare the pages you need inside OneSearch.",
    outcomesLabel: "OneSearch use cases",
    outcomes: [
      ["RESEARCH", "Research", "Scan results from multiple perspectives, grouped by topic."],
      ["COMPARE", "Compare products and services", "Review prices, features, and opinions side by side in folders and tabs."],
      ["KEEP", "Keep search results", "Reuse your research with the Pro library and Markdown or CSV export."],
    ],
    installLabel: "Installation guide",
    installs: [
      ["Install on macOS", "Open the DMG and move OneSearch to Applications. Built for Apple Silicon (M1 or later)."],
      ["Install on Windows", "Run the installer and follow the instructions. Supports Windows 10/11 x64."],
      ["Set up local AI", "On first launch, choose automatic AI model setup. Free uses the fast 4B model; Pro can use an 8B or 14B model."],
      ["Security notice", "File integrity and macOS launch have been checked. Gatekeeper or SmartScreen may appear until official code signing is complete."],
    ],
    footerLabel: "Policies and support",
    terms: "Terms",
    privacy: "Privacy",
    refund: "Refund policy",
    support: "Support",
    communityFooter: "Q&A · Community",
    press: "Media kit",
  },
} as const;

const softwareApplication = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "OneSearch",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "macOS 11 or later; Windows 10 or later",
  softwareVersion: "1.0.0",
  description: "웹 검색 결과를 로컬 AI가 의미별 폴더와 계층으로 정리하는 데스크톱 앱",
  offers: [
    { "@type": "Offer", name: "OneSearch Free", price: "0", priceCurrency: "KRW" },
    { "@type": "Offer", name: "OneSearch Founding Pro", price: "19900", priceCurrency: "KRW" },
  ],
};

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const locale = await getRequestLocale();
  const copy = HOME_COPY[locale];
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label={copy.home}>
          <Image
            src="/onesearch-icon.png"
            alt=""
            width={38}
            height={38}
            unoptimized
          />
          <span>OneSearch</span>
        </a>
        <div className="header-actions">
          <a className="header-link header-link-muted" href="#demo">
            {copy.how}
          </a>
          <GuideDialog />
          <QnaDialog />
          <a className="header-link header-link-muted" href="/community">
            {copy.community}
          </a>
          <ShareDialog />
          <a className="header-link header-link-muted" href="#pricing">
            Pro
          </a>
          <a className="header-link" href="#download">
            {copy.download}
          </a>
          <LanguageSwitcher />
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">LOCAL AI SEARCH / VERSION 1.0.0</p>
          <h1>OneSearch</h1>
          <p className="hero-description">
            {copy.heroDescription}
          </p>
          <div className="hero-actions">
            <a href="#download">{copy.freeDownload}</a>
            <a href="#demo">{copy.seeHow}</a>
          </div>
          <div className="hero-proof" aria-label={copy.proofLabel}>
            {copy.proof.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
        <div className="hero-mark" aria-hidden="true">
          <Image
            src="/onesearch-icon.png"
            alt=""
            width={210}
            height={210}
            priority
            unoptimized
          />
          <span>SEARCH LESS<br />UNDERSTAND MORE</span>
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="demo-section-heading">
          <p>HOW IT WORKS</p>
          <h2>{copy.demoTitle}</h2>
          <span>{copy.demoDescription}</span>
        </div>
        <ProductDemo />
      </section>

      <section className="outcome-band" aria-label={copy.outcomesLabel}>
        {copy.outcomes.map(([eyebrow, title, description]) => (
          <article key={eyebrow}><p>{eyebrow}</p><h2>{title}</h2><span>{description}</span></article>
        ))}
      </section>

      <DownloadSelector />

      <PricingSection />

      <section className="info-band" aria-label={copy.installLabel}>
        {copy.installs.map(([title, description], index) => (
          <article key={title}>
            <p className="info-number">0{index + 1}</p>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <footer>
        <span>OneSearch 1.0.0</span>
        <nav aria-label={copy.footerLabel}>
          <a href="/terms">{copy.terms}</a>
          <a href="/privacy">{copy.privacy}</a>
          <a href="/refund">{copy.refund}</a>
          <a href="/support">{copy.support}</a>
          <a href="/community">{copy.communityFooter}</a>
          <a href="/press">{copy.press}</a>
          <a href="https://github.com/onesearch-app/onesearch" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
        <span>macOS · Windows</span>
      </footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ ...softwareApplication, description: copy.description }).replace(/</g, "\\u003c") }}
      />
    </main>
  );
}
