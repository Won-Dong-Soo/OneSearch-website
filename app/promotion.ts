export type PromotionEvent =
  | "page_view"
  | "share"
  | "share_copy"
  | "press_copy"
  | "download_mac"
  | "download_windows"
  | "checkout_open";

type Attribution = {
  source: string;
  medium: string;
  campaign: string;
};

const ATTRIBUTION_KEY = "onesearch.attribution-v1";

export function isPublicAnalyticsPath(pathname: string): boolean {
  return !pathname.startsWith("/admin") && !pathname.startsWith("/api/");
}

export function isInternalAnalyticsSession(): boolean {
  return typeof document !== "undefined" &&
    document.cookie.split(";").some((item) => item.trim() === "onesearch_internal=1");
}

export function readAttribution(): Attribution {
  if (typeof window === "undefined") {
    return { source: "direct", medium: "none", campaign: "none" };
  }

  try {
    const stored = JSON.parse(window.sessionStorage.getItem(ATTRIBUTION_KEY) ?? "null") as Attribution | null;
    if (stored?.source) return stored;
  } catch {
    // Ignore invalid browser storage and fall back to direct attribution.
  }

  return { source: "direct", medium: "none", campaign: "none" };
}

export function saveAttribution(attribution: Attribution) {
  try {
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    // Tracking must never block the product experience.
  }
}

export function detectPlatform(): string {
  if (typeof navigator === "undefined") return "unknown";
  const agent = navigator.userAgent.toLowerCase();
  if (agent.includes("mac")) return "mac";
  if (agent.includes("win")) return "windows";
  if (agent.includes("android")) return "android";
  if (agent.includes("iphone") || agent.includes("ipad")) return "ios";
  return "other";
}

export function trackPromotionEvent(event: PromotionEvent, detail: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  if (!isPublicAnalyticsPath(window.location.pathname) || isInternalAnalyticsSession()) return;
  const attribution = readAttribution();
  const payload = JSON.stringify({
    event,
    path: window.location.pathname,
    platform: detail.platform || detectPlatform(),
    source: detail.source || attribution.source,
    medium: detail.medium || attribution.medium,
    campaign: detail.campaign || attribution.campaign,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/promotion/event", new Blob([payload], { type: "application/json" }));
    return;
  }

  void fetch("/api/promotion/event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  });
}

export function campaignUrl(source: string): string {
  if (typeof window === "undefined") return "/";
  const url = new URL("/", window.location.origin);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", "founding-launch");
  return url.toString();
}
