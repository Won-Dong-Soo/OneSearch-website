"use client";

import { useEffect, useRef } from "react";
import { Command, Download, PanelsTopLeft, ShieldCheck } from "lucide-react";
import { trackPromotionEvent } from "./promotion";
import { formatFileSize, releaseList, releaseVersion } from "./release-config";
import { useLocale } from "./language-provider";

const DOWNLOAD_COPY = {
  ko: {
    title: "운영체제를 선택하세요",
    recommended: "이 기기에 추천",
    requirement: "요구 사항",
    size: "파일 크기",
    setup: "첫 AI 설정",
    setupSize: "약 2.8GB 별도",
    download: (platform: string) => `${platform}용 다운로드`,
    downloadLabel: (platform: string) => `${platform}용 OneSearch 다운로드`,
    macRequirement: "macOS 11 이상",
    verification: {
      mac: "DMG·arm64 앱 기동 검증 완료",
      windows: "설치 파일 구조·해시 검증 완료",
    },
  },
  en: {
    title: "Choose your operating system",
    recommended: "Recommended for this device",
    requirement: "Requirements",
    size: "File size",
    setup: "First AI setup",
    setupSize: "About 2.8 GB separately",
    download: (platform: string) => `Download for ${platform}`,
    downloadLabel: (platform: string) => `Download OneSearch for ${platform}`,
    macRequirement: "macOS 11 or later",
    verification: {
      mac: "DMG and arm64 app launch verified",
      windows: "Installer structure and hash verified",
    },
  },
} as const;

export function DownloadSelector() {
  const locale = useLocale();
  const copy = DOWNLOAD_COPY[locale];
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("mac")) {
      sectionRef.current?.setAttribute("data-platform", "mac");
    } else if (userAgent.includes("win")) {
      sectionRef.current?.setAttribute("data-platform", "windows");
    }
  }, []);

  return (
    <section className="download-section" id="download" ref={sectionRef}>
      <div className="section-heading">
        <p>PLATFORM</p>
        <h2>{copy.title}</h2>
      </div>

      <div className="platform-grid">
        {releaseList.map((release) => {
          const PlatformIcon = release.id === "mac" ? Command : PanelsTopLeft;

          return (
            <article
              className={`platform-panel ${release.id} ${release.accent}`}
              key={release.id}
            >
              <div className="platform-topline">
                <span className="platform-icon" aria-hidden="true">
                  <PlatformIcon size={24} strokeWidth={1.8} />
                </span>
                <span className="recommendation">{copy.recommended}</span>
                <span className="version">VERSION {releaseVersion}</span>
              </div>

              <div className="platform-copy">
                <h3>{release.name}</h3>
                <p>{release.detail}</p>
              </div>

              <dl>
                <div>
                  <dt>{copy.requirement}</dt>
                  <dd>{release.id === "mac" ? copy.macRequirement : release.requirement}</dd>
                </div>
                <div>
                  <dt>{copy.size}</dt>
                  <dd>{formatFileSize(release.bytes)}</dd>
                </div>
                <div>
                  <dt>{copy.setup}</dt>
                  <dd>{copy.setupSize}</dd>
                </div>
              </dl>

              <p className="release-verification"><ShieldCheck size={16} /> {copy.verification[release.id]}</p>

              <a
                className="download-button"
                href={`/api/download/${release.id}?v=${release.sha256.slice(0, 12)}`}
                download={release.filename}
                aria-label={copy.downloadLabel(release.name)}
                onClick={() => trackPromotionEvent(release.id === "mac" ? "download_mac" : "download_windows", { platform: release.id })}
              >
                <span>{copy.download(release.name)}</span>
                <Download size={19} strokeWidth={2} aria-hidden="true" />
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
