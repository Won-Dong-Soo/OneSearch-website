import type { Metadata } from "next";
import { LegalLayout } from "../legal-layout";
import { getRequestLocale } from "../i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "ko" ? "이용약관" : "Terms of Use", alternates: { canonical: "/terms" } };
}

const TERMS_COPY = {
  ko: {
    title: "OneSearch 이용약관",
    sections: [
      ["1. 서비스 운영자", "OneSearch는 개인 개발자가 운영하는 소프트웨어 브랜드입니다. 본 약관은 OneSearch 데스크톱 앱, 다운로드 사이트 및 Pro 라이선스에 적용됩니다."],
      ["2. 제공 서비스", "OneSearch는 웹 검색 결과를 로컬 AI로 분류하고 폴더와 계층으로 정리하는 macOS·Windows용 데스크톱 앱입니다. 검색 결과와 AI 모델의 출력은 참고용이며 정확성이나 완전성을 보장하지 않습니다."],
      ["3. Free와 Pro", "Free는 4B 로컬 AI와 기본 검색·탐색 기능을 제공합니다. Founding Pro는 19,900원 1회 구매 상품으로, 8B·14B 고급 로컬 AI 선택, 검색 보관함, Markdown·CSV 내보내기, 최대 3대 기기 활성화 및 OneSearch 1.x 업데이트를 포함합니다."],
      ["4. 라이선스", "Pro 라이선스는 구매자 본인이 소유하거나 사용하는 최대 3대의 기기에서 사용할 수 있습니다. 라이선스 키의 판매, 대여, 공개 공유 및 결제 우회는 허용되지 않습니다. 환불되거나 부정 결제로 확인된 라이선스는 비활성화될 수 있습니다."],
      ["5. 로컬 AI와 시스템 요구사항", "AI 모델은 사용자의 컴퓨터에서 Ollama를 통해 실행됩니다. 8B·14B 모델은 추가 저장 공간과 메모리가 필요하며, 기기 사양에 따라 속도와 사용 가능 여부가 달라질 수 있습니다."],
      ["6. 결제", "결제, 세금 계산, 영수증 및 결제 관련 고객지원은 판매대행사인 Paddle이 처리합니다. 화면에 표시된 총 결제 금액과 Paddle Checkout의 주문 정보를 확인한 뒤 구매해야 합니다."],
      ["7. 커뮤니티", "이용자는 Q&A와 커뮤니티에 게시글과 답변을 작성할 수 있습니다. 개인정보 침해, 불법 정보, 혐오·괴롭힘, 반복 광고 및 서비스와 무관한 콘텐츠는 제한되거나 삭제될 수 있습니다. 작성자는 설정한 관리 코드로 자신의 콘텐츠를 관리해야 합니다."],
      ["8. 업데이트와 변경", "1.x 업데이트는 Pro 구매에 포함됩니다. 향후 2.x와 같은 주요 버전은 별도 상품으로 제공될 수 있으며, 기존에 구매한 버전의 사용 권한은 유지됩니다."],
    ],
    contactTitle: "9. 문의", contactBefore: "제품 및 라이선스 문의는", support: "고객지원 페이지", contactMiddle: "에서 접수할 수 있습니다. 결제 취소, 영수증 및 결제수단 문의는", paddle: "Paddle 구매자 지원", contactAfter: "을 이용할 수 있습니다.",
  },
  en: {
    title: "OneSearch Terms of Use",
    sections: [
      ["1. Operator", "OneSearch is a software brand operated by an independent developer. These terms apply to the OneSearch desktop app, download website, and Pro license."],
      ["2. Service", "OneSearch is a macOS and Windows desktop app that classifies web results with local AI and organizes them into folders and hierarchies. Search results and AI output are informational and are not guaranteed to be accurate or complete."],
      ["3. Free and Pro", "Free includes the 4B local AI model and core search and browsing. Founding Pro is a one-time KRW 19,900 purchase that includes 8B and 14B local AI options, saved searches, Markdown and CSV export, activation on up to three devices, and OneSearch 1.x updates."],
      ["4. License", "A Pro license may be used on up to three devices owned or used by the buyer. Selling, renting, publicly sharing a license key, or bypassing payment is prohibited. Refunded or fraudulent licenses may be deactivated."],
      ["5. Local AI and system requirements", "AI models run on the user's computer through Ollama. The 8B and 14B models require additional storage and memory, and speed or availability depends on device specifications."],
      ["6. Payment", "Paddle, acting as merchant of record, handles payment, taxes, receipts, and payment support. Review the displayed total and Paddle Checkout order details before purchasing."],
      ["7. Community", "Users may publish posts and replies in Q&A and Community. Content involving privacy violations, illegal information, hate or harassment, repeated advertising, or unrelated material may be restricted or removed. Authors must use their management code to manage their own content."],
      ["8. Updates and changes", "OneSearch 1.x updates are included with Pro. Future major versions such as 2.x may be sold separately, while the right to use an already purchased version remains."],
    ],
    contactTitle: "9. Contact", contactBefore: "For product and license questions, use the", support: "support page", contactMiddle: ". For cancellations, receipts, or payment-method questions, use", paddle: "Paddle buyer support", contactAfter: ".",
  },
} as const;

export default async function TermsPage() {
  const locale = await getRequestLocale();
  const copy = TERMS_COPY[locale];
  return (
    <LegalLayout eyebrow="TERMS" title={copy.title}>
      {copy.sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}
      <section><h2>{copy.contactTitle}</h2><p>{copy.contactBefore} <a href="/support">{copy.support}</a>{copy.contactMiddle} <a href="https://paddle.net">{copy.paddle}</a>{copy.contactAfter}</p></section>
    </LegalLayout>
  );
}
