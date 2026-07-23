import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { LanguageProvider } from "./language-provider";
import { getRequestLocale } from "./i18n-server";
import { PromotionTracker } from "./promotion-tracker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const metadataBase = new URL(`${protocol}://${host}`);

  const title = locale === "ko" ? "OneSearch - 로컬 AI 검색 정리 앱" : "OneSearch - Local AI Search Organizer";
  const description = locale === "ko"
    ? "웹 검색 결과를 4B·8B·14B 로컬 AI가 의미별 폴더로 정리하는 macOS·Windows 데스크톱 앱"
    : "A macOS and Windows desktop app that organizes web results into semantic folders with 4B, 8B, or 14B local AI.";

  return {
    metadataBase,
    title: {
      default: title,
      template: "%s · OneSearch",
    },
    applicationName: "OneSearch",
    description,
    keywords: ["OneSearch", "local AI", "로컬 AI", "search organizer", "검색 결과 정리", "Ollama", "AI search", "macOS app", "Windows app"],
    category: "software",
    icons: {
      icon: "/onesearch-icon.png",
      apple: "/onesearch-icon.png",
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: "/og-v2.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-v2.png"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://cdn.paddle.com" crossOrigin="anonymous" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <LanguageProvider initialLocale={locale}>
          <PromotionTracker />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
