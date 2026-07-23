import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/signin-with-chatgpt", "/callback"],
    },
    sitemap: "https://onesearch-download.adultdongsoo0516.chatgpt.site/sitemap.xml",
  };
}
