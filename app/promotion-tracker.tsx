"use client";

import { useEffect } from "react";
import { isInternalAnalyticsSession, isPublicAnalyticsPath, saveAttribution, trackPromotionEvent } from "./promotion";

function referrerSource() {
  if (!document.referrer) return "direct";
  try {
    const referrer = new URL(document.referrer);
    return referrer.origin === window.location.origin ? "internal" : referrer.hostname;
  } catch {
    return "direct";
  }
}

export function PromotionTracker() {
  useEffect(() => {
    if (!isPublicAnalyticsPath(window.location.pathname) || isInternalAnalyticsSession()) return;
    const params = new URLSearchParams(window.location.search);
    saveAttribution({
      source: params.get("utm_source") || params.get("ref") || referrerSource(),
      medium: params.get("utm_medium") || "none",
      campaign: params.get("utm_campaign") || "none",
    });

    const viewKey = `onesearch.viewed:${window.location.pathname}`;
    if (!window.sessionStorage.getItem(viewKey)) {
      window.sessionStorage.setItem(viewKey, "1");
      trackPromotionEvent("page_view");
    }
  }, []);

  return null;
}
