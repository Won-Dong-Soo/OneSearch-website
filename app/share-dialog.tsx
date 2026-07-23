"use client";

import { Check, Copy, ExternalLink, Share2, X } from "lucide-react";
import { useRef, useState } from "react";
import { campaignUrl, trackPromotionEvent } from "./promotion";
import { useLocale } from "./language-provider";

const SHARE_COPY = {
  ko: {
    title: "OneSearch - 로컬 AI 검색 정리 앱",
    text: "웹 검색 결과를 로컬 AI가 의미별 폴더로 자동 정리하는 macOS·Windows 앱",
    trigger: "공유",
    heading: "OneSearch 알리기",
    close: "공유 창 닫기",
    closeTitle: "닫기",
    description: "검색 결과를 폴더로 정리하는 경험이 필요한 사람에게 OneSearch를 소개하세요.",
    native: "기본 공유",
    copied: "복사됨",
    copy: "링크 복사",
    press: "소개 문구와 미디어 자료 보기",
  },
  en: {
    title: "OneSearch - Local AI Search Organizer",
    text: "A macOS and Windows app that organizes web results into semantic folders with local AI.",
    trigger: "Share",
    heading: "Share OneSearch",
    close: "Close share dialog",
    closeTitle: "Close",
    description: "Share OneSearch with people who need a clearer way to organize search results.",
    native: "Share",
    copied: "Copied",
    copy: "Copy link",
    press: "View product copy and media assets",
  },
} as const;

export function ShareDialog() {
  const locale = useLocale();
  const copy = SHARE_COPY[locale];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(campaignUrl("copy-link"));
    trackPromotionEvent("share_copy", { source: "copy-link", medium: "referral", campaign: "founding-launch" });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const nativeShare = async () => {
    const url = campaignUrl("native-share");
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({ title: copy.title, text: copy.text, url });
      trackPromotionEvent("share", { source: "native-share", medium: "referral", campaign: "founding-launch" });
    } catch {
      // Closing the system share sheet is not an error.
    }
  };

  const openChannel = (channel: "x" | "reddit") => {
    const url = campaignUrl(channel);
    const target = channel === "x"
      ? `https://x.com/intent/post?${new URLSearchParams({ text: `${copy.text}\n${url}` })}`
      : `https://www.reddit.com/submit?${new URLSearchParams({ url, title: copy.title })}`;
    trackPromotionEvent("share", { source: channel, medium: "social", campaign: "founding-launch" });
    window.open(target, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <button className="share-trigger" type="button" onClick={() => dialogRef.current?.showModal()}>
        <Share2 size={17} aria-hidden="true" />
        <span>{copy.trigger}</span>
      </button>
      <dialog
        ref={dialogRef}
        className="share-dialog"
        aria-labelledby="share-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        <div className="share-window">
          <header>
            <div>
              <p>SHARE ONESEARCH</p>
              <h2 id="share-title">{copy.heading}</h2>
            </div>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label={copy.close} title={copy.closeTitle}>
              <X size={19} />
            </button>
          </header>
          <p className="share-description">{copy.description}</p>
          <div className="share-actions">
            <button type="button" onClick={() => void nativeShare()}><Share2 size={18} /> {copy.native}</button>
            <button type="button" onClick={() => void copyLink()}>{copied ? <Check size={18} /> : <Copy size={18} />} {copied ? copy.copied : copy.copy}</button>
            <button type="button" onClick={() => openChannel("x")}><ExternalLink size={18} /> X</button>
            <button type="button" onClick={() => openChannel("reddit")}><ExternalLink size={18} /> Reddit</button>
          </div>
          <a className="share-press-link" href="/press">{copy.press} <ExternalLink size={16} /></a>
        </div>
      </dialog>
    </>
  );
}
