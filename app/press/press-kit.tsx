"use client";

import Image from "next/image";
import { Check, Copy, Download, ExternalLink, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { campaignUrl, trackPromotionEvent } from "../promotion";
import { useLocale } from "../language-provider";

const PRESS_COPY = {
  ko: {
    copy: { short: "OneSearch는 웹 검색 결과를 로컬 AI가 의미별 폴더로 자동 정리해 주는 macOS·Windows 데스크톱 앱입니다.", launch: "검색할 때 탭을 수십 개씩 여는 문제를 줄이려고 OneSearch를 만들었습니다. 웹 검색 결과를 수집한 뒤 Ollama 기반 로컬 AI가 주제별 폴더와 계층으로 정리하고, 결과를 앱 안의 독립 탭에서 비교할 수 있습니다. 무료 4B 모델부터 바로 사용할 수 있습니다.", social: "검색 결과를 하나씩 읽기 전에 로컬 AI가 주제별 폴더로 정리합니다. macOS·Windows용 OneSearch 1.0을 공개했습니다." },
    title: "OneSearch를 정확하게 소개하는 자료", description: "제품 설명, 검증된 정보, 로고와 공유용 이미지를 한곳에서 사용할 수 있습니다.", factsLabel: "제품 정보", facts: [["제품", "로컬 AI 검색 결과 정리 앱"], ["지원", "macOS Apple Silicon · Windows x64"], ["가격", "Free ₩0 · Founding Pro ₩19,900"], ["AI", "무료 4B · Pro 8B/14B"]], copyTitle: "소개 문구", copyLabels: { short: "한 줄 소개", launch: "출시 소개", social: "소셜 게시물" }, copyAria: "소개 문구 복사", assetsTitle: "이미지 자료", appIconAlt: "OneSearch 앱 아이콘", appIcon: "앱 아이콘", square: "PNG · 정사각형", socialAlt: "OneSearch 소셜 공유 이미지", socialImage: "소셜 공유 이미지", download: "다운로드", trustTitle: "현재 배포 검증 범위", trust: "macOS DMG 체크섬·arm64 번들·앱 및 로컬 서버 기동을 확인했습니다. Windows 설치 파일 구조와 해시는 확인했으며 Windows 실기기 실행과 두 플랫폼의 공식 코드 서명은 진행 중입니다.", shareTitle: "공유 링크에는 유입 출처가 자동으로 표시됩니다", copyLink: "링크 복사", shareX: "X에 공유", shareReddit: "Reddit에 공유",
  },
  en: {
    copy: { short: "OneSearch is a macOS and Windows desktop app that organizes web results into semantic folders with local AI.", launch: "I built OneSearch to reduce the dozens of tabs opened during research. It collects web results, uses Ollama-based local AI to arrange them into topic folders and hierarchies, and lets you compare pages in separate in-app tabs. You can start with the free 4B model.", social: "Local AI organizes search results into topic folders before you read them one by one. OneSearch 1.0 is available for macOS and Windows." },
    title: "Everything needed to describe OneSearch accurately", description: "Use verified product facts, ready-to-use descriptions, the app icon, and social artwork in one place.", factsLabel: "Product facts", facts: [["Product", "Local AI search-result organizer"], ["Platforms", "macOS Apple Silicon · Windows x64"], ["Price", "Free ₩0 · Founding Pro ₩19,900"], ["AI", "Free 4B · Pro 8B/14B"]], copyTitle: "Ready-to-use copy", copyLabels: { short: "One-line description", launch: "Launch description", social: "Social post" }, copyAria: "Copy product description", assetsTitle: "Image assets", appIconAlt: "OneSearch app icon", appIcon: "App icon", square: "PNG · square", socialAlt: "OneSearch social sharing image", socialImage: "Social sharing image", download: "Download", trustTitle: "Current release verification", trust: "The macOS DMG checksum, arm64 bundle, app launch, and local server startup have been verified. The Windows installer structure and hash have been checked; Windows hardware testing and official code signing for both platforms are still in progress.", shareTitle: "Shared links automatically include campaign attribution", copyLink: "Copy link", shareX: "Share on X", shareReddit: "Share on Reddit",
  },
} as const;

type CopyKey = keyof (typeof PRESS_COPY)["ko"]["copy"];

export function PressKit() {
  const locale = useLocale();
  const content = PRESS_COPY[locale];
  const copy = content.copy;
  const [copied, setCopied] = useState<CopyKey | "link" | null>(null);

  const copyText = async (key: CopyKey) => {
    await navigator.clipboard.writeText(copy[key]);
    trackPromotionEvent("press_copy", { source: `press-${key}`, medium: "owned", campaign: "founding-launch" });
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(campaignUrl("press-kit"));
    trackPromotionEvent("share_copy", { source: "press-kit", medium: "referral", campaign: "founding-launch" });
    setCopied("link");
    window.setTimeout(() => setCopied(null), 1600);
  };

  const shareTo = (channel: "x" | "reddit") => {
    const url = campaignUrl(channel);
    const target = channel === "x"
      ? `https://x.com/intent/post?${new URLSearchParams({ text: `${copy.social}\n${url}` })}`
      : `https://www.reddit.com/submit?${new URLSearchParams({ url, title: "OneSearch - Local AI organized web search" })}`;
    trackPromotionEvent("share", { source: channel, medium: "social", campaign: "founding-launch" });
    window.open(target, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="press-page">
      <header className="press-hero">
        <p>ONESEARCH / MEDIA KIT</p>
        <h1>{content.title}</h1>
        <span>{content.description}</span>
      </header>

      <section className="press-facts" aria-label={content.factsLabel}>
        {content.facts.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}
      </section>

      <section className="press-copy-section">
        <div className="press-section-heading">
          <p>READY-TO-USE COPY</p>
          <h2>{content.copyTitle}</h2>
        </div>
        <div className="press-copy-list">
          {(Object.keys(copy) as CopyKey[]).map((key) => (
            <article key={key}>
              <div>
                <span>{content.copyLabels[key]}</span>
                <p>{copy[key]}</p>
              </div>
              <button type="button" onClick={() => void copyText(key)} aria-label={`${content.copyAria}: ${content.copyLabels[key]}`}>
                {copied === key ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="press-assets">
        <div className="press-section-heading">
          <p>BRAND ASSETS</p>
          <h2>{content.assetsTitle}</h2>
        </div>
        <div className="press-asset-grid">
          <article>
            <div className="press-icon-preview"><Image src="/onesearch-icon.png" alt={content.appIconAlt} width={180} height={180} unoptimized /></div>
            <div><strong>{content.appIcon}</strong><span>{content.square}</span></div>
            <a href="/onesearch-icon.png" download><Download size={17} /> {content.download}</a>
          </article>
          <article>
            <div className="press-social-preview"><Image src="/og-v2.png" alt={content.socialAlt} width={600} height={315} unoptimized /></div>
            <div><strong>{content.socialImage}</strong><span>PNG · 1200×630</span></div>
            <a href="/og-v2.png" download><Download size={17} /> {content.download}</a>
          </article>
        </div>
      </section>

      <section className="press-trust">
        <ShieldCheck size={28} aria-hidden="true" />
        <div>
          <h2>{content.trustTitle}</h2>
          <p>{content.trust}</p>
        </div>
      </section>

      <section className="press-share-band">
        <div><p>FOUNDING LAUNCH</p><h2>{content.shareTitle}</h2></div>
        <div className="press-share-actions">
          <button type="button" onClick={() => void copyLink()}>{copied === "link" ? <Check size={17} /> : <Copy size={17} />} {content.copyLink}</button>
          <button type="button" onClick={() => shareTo("x")}><ExternalLink size={17} /> {content.shareX}</button>
          <button type="button" onClick={() => shareTo("reddit")}><ExternalLink size={17} /> {content.shareReddit}</button>
        </div>
      </section>
    </section>
  );
}
