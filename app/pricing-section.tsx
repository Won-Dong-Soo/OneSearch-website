"use client";

import { useEffect, useState } from "react";
import { Check, Copy, CreditCard, KeyRound, LoaderCircle } from "lucide-react";
import { trackPromotionEvent } from "./promotion";
import { useLocale } from "./language-provider";
import type { Locale } from "./i18n-config";

const PRICE_COPY = {
  ko: {
    loadError: "결제 화면을 불러오지 못했습니다.",
    licenseError: "라이선스를 발급하지 못했습니다.",
    licenseDelay: "결제는 완료되었지만 라이선스 발급이 지연되고 있습니다. 잠시 후 다시 확인하세요.",
    configError: "결제 설정을 불러오지 못했습니다.",
    prepareError: "결제를 준비하지 못했습니다.",
    title: "검색 결과를 지식 자산으로 보관하세요",
    description: "무료 검색 기능은 계속 사용할 수 있습니다. 더 정교한 로컬 AI와 작업 보관이 필요한 경우에만 한 번 구매하세요.",
    free: "무료",
    freeFeatures: ["AI 의미별 폴더 정리", "빠른 4B 로컬 AI", "앱 내부 웹 탐색 탭", "로컬 AI 처리"],
    freeDownload: "무료 다운로드",
    proLabel: "FOUNDING PRO · 1회 구매",
    proFeatures: ["8B·14B 고급 로컬 AI 선택", "검색 결과 보관함", "Markdown·CSV 내보내기", "최대 3대 기기", "OneSearch 1.x 업데이트"],
    sandbox: "샌드박스 결제 테스트",
    buy: "Founding Pro 구매",
    preparing: "결제 준비 중",
    sandboxNotice: "테스트 결제입니다. 실제 청구되지 않습니다.",
    productionNotice: "1회 결제 · 최대 3대 · OneSearch 1.x 업데이트 포함",
    issued: "라이선스가 발급되었습니다",
    activation: "OneSearch의 열쇠 아이콘을 눌러 등록하세요.",
    copyLicense: "라이선스 키 복사",
  },
  en: {
    loadError: "Could not load the checkout.",
    licenseError: "Could not issue the license.",
    licenseDelay: "Payment completed, but license issuance is taking longer than expected. Please check again shortly.",
    configError: "Could not load payment settings.",
    prepareError: "Could not prepare checkout.",
    title: "Keep search results as reusable knowledge",
    description: "Core search remains free. Make a one-time purchase only when you need more capable local AI and a saved research library.",
    free: "Free",
    freeFeatures: ["Semantic AI folders", "Fast 4B local AI", "In-app web browsing tabs", "Local AI processing"],
    freeDownload: "Free download",
    proLabel: "FOUNDING PRO · ONE-TIME PURCHASE",
    proFeatures: ["Choose advanced 8B or 14B local AI", "Saved search library", "Markdown and CSV export", "Up to 3 devices", "OneSearch 1.x updates"],
    sandbox: "Test sandbox checkout",
    buy: "Buy Founding Pro",
    preparing: "Preparing checkout",
    sandboxNotice: "This is a test checkout. You will not be charged.",
    productionNotice: "One-time payment · up to 3 devices · OneSearch 1.x updates included",
    issued: "Your license is ready",
    activation: "Use the key icon in OneSearch to activate it.",
    copyLicense: "Copy license key",
  },
} as const;

type PaddleConfig = {
  configured: boolean;
  clientToken: string;
  priceId: string;
  environment: "sandbox" | "production";
};

type CheckoutEvent = {
  name?: string;
  data?: { transaction_id?: string };
};

type PaddleWindow = Window & {
  Paddle?: {
    Environment: { set(environment: string): void };
    Initialize(options: Record<string, unknown>): void;
    Checkout: { open(options: Record<string, unknown>): void };
  };
  oneSearchPaddleReady?: boolean;
  oneSearchCheckoutHandler?: (event: CheckoutEvent) => void;
};

let paddleScriptPromise: Promise<void> | null = null;

function loadPaddleScript(errorMessage: string): Promise<void> {
  const paddleWindow = window as PaddleWindow;
  if (paddleWindow.Paddle) return Promise.resolve();
  if (paddleScriptPromise) return paddleScriptPromise;

  paddleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-onesearch-paddle]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(errorMessage)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.dataset.onesearchPaddle = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error(errorMessage)), { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    paddleScriptPromise = null;
    throw error;
  });

  return paddleScriptPromise;
}

async function waitForLicense(transactionId: string, locale: Locale): Promise<string> {
  const copy = PRICE_COPY[locale];
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await fetch(`/api/license/claim?transaction_id=${encodeURIComponent(transactionId)}`, {
      cache: "no-store",
    });
    if (response.ok) {
      const data = await response.json() as { licenseKey: string };
      return data.licenseKey;
    }
    if (response.status !== 404) {
      const data = await response.json().catch(() => null) as { message?: string } | null;
      throw new Error(locale === "en" ? copy.licenseError : data?.message ?? copy.licenseError);
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
  }
  throw new Error(copy.licenseDelay);
}

export function PricingSection() {
  const locale = useLocale();
  const copy = PRICE_COPY[locale];
  const [config, setConfig] = useState<PaddleConfig | null>(null);
  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function prepare() {
      const response = await fetch("/api/paddle/config", { cache: "no-store" });
      if (!response.ok) throw new Error(copy.configError);
      const nextConfig = await response.json() as PaddleConfig;
      if (!active) return;
      setConfig(nextConfig);
      if (!nextConfig.configured) return;

      await loadPaddleScript(copy.loadError);
      if (!active) return;
      const paddleWindow = window as PaddleWindow;
      paddleWindow.oneSearchCheckoutHandler = async (event) => {
        if (event.name !== "checkout.completed" || !event.data?.transaction_id) return;
        setProcessing(true);
        setError("");
        try {
          setLicenseKey(await waitForLicense(event.data.transaction_id, locale));
        } catch (claimError) {
          setError(claimError instanceof Error ? claimError.message : copy.licenseError);
        } finally {
          setProcessing(false);
        }
      };

      if (!paddleWindow.oneSearchPaddleReady && paddleWindow.Paddle) {
        if (nextConfig.environment === "sandbox") paddleWindow.Paddle.Environment.set("sandbox");
        paddleWindow.Paddle.Initialize({
          token: nextConfig.clientToken,
          checkout: {
            settings: {
              displayMode: "overlay",
              locale,
              theme: "light",
              variant: "one-page",
            },
          },
          eventCallback: (event: CheckoutEvent) => paddleWindow.oneSearchCheckoutHandler?.(event),
        });
        paddleWindow.oneSearchPaddleReady = true;
      }
      setReady(true);
    }

    void prepare().catch((prepareError) => {
      if (active) setError(prepareError instanceof Error ? prepareError.message : copy.prepareError);
    });

    return () => {
      active = false;
    };
  }, [copy, locale]);

  const openCheckout = () => {
    if (!ready || !config?.priceId) return;
    setError("");
    trackPromotionEvent("checkout_open");
    (window as PaddleWindow).Paddle?.Checkout.open({
      items: [{ priceId: config.priceId, quantity: 1 }],
      settings: { displayMode: "overlay", locale, theme: "light", variant: "one-page" },
    });
  };

  const copyLicense = async () => {
    await navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="pricing-section" id="pricing">
      <div className="pricing-heading">
        <p>FOUNDING PRO</p>
        <h2>{copy.title}</h2>
        <span>{copy.description}</span>
      </div>

      <div className="pricing-grid">
        <article className="price-panel free-price">
          <div>
            <span>FREE</span>
            <h3>{copy.free}</h3>
            <strong>₩0</strong>
          </div>
          <ul>
            {copy.freeFeatures.map((feature) => <li key={feature}><Check size={17} />{feature}</li>)}
          </ul>
          <a href="#download">{copy.freeDownload}</a>
        </article>

        <article className="price-panel pro-price">
          <div>
            <span>{copy.proLabel}</span>
            <h3>OneSearch Pro</h3>
            <strong>₩19,900</strong>
          </div>
          <ul>
            {copy.proFeatures.map((feature) => <li key={feature}><Check size={17} />{feature}</li>)}
          </ul>
          <button type="button" onClick={openCheckout} disabled={!ready || processing}>
            {processing ? <LoaderCircle className="price-spin" size={18} /> : <CreditCard size={18} />}
            {config?.configured
              ? config.environment === "sandbox" ? copy.sandbox : copy.buy
              : copy.preparing}
          </button>
          {config?.environment === "sandbox" && (
            <p className="pricing-notice">{copy.sandboxNotice}</p>
          )}
          {config?.environment === "production" && (
            <p className="pricing-notice">{copy.productionNotice}</p>
          )}
          {error && <p className="pricing-error" role="alert">{error}</p>}
        </article>
      </div>

      {licenseKey && (
        <div className="license-delivery" role="status">
          <KeyRound size={24} />
          <div>
            <strong>{copy.issued}</strong>
            <code>{licenseKey}</code>
            <span>{copy.activation}</span>
          </div>
          <button type="button" onClick={copyLicense} aria-label={copy.copyLicense}>
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      )}
    </section>
  );
}
