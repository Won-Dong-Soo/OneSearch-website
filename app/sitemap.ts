import type { MetadataRoute } from "next";

const SITE_URL = "https://onesearch-download.adultdongsoo0516.chatgpt.site";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date("2026-07-22T00:00:00+09:00");
  return [
    { url: SITE_URL, lastModified: updated, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/community`, lastModified: updated, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/press`, lastModified: updated, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/support`, lastModified: updated, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/terms`, lastModified: updated, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, lastModified: updated, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/refund`, lastModified: updated, changeFrequency: "yearly", priority: 0.2 },
  ];
}
