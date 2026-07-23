import type { Metadata } from "next";
import { LegalLayout } from "../legal-layout";
import { getRequestLocale } from "../i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "ko" ? "개인정보 처리방침" : "Privacy Policy", alternates: { canonical: "/privacy" } };
}

const PRIVACY_COPY = {
  ko: { title: "개인정보 처리방침", sections: [
    ["1. 로컬 검색 데이터", "검색어, 검색 결과, 저장된 검색 및 AI 분석 내용은 기본적으로 사용자 기기에 저장됩니다. OneSearch 라이선스 서버는 검색 내용을 수집하지 않습니다."],
    ["2. 라이선스 처리 정보", "결제 완료 후 Paddle 거래 식별자와 고객 식별자, 암호화된 라이선스 키, 해시 처리된 기기 식별자, 앱 버전 및 활성화 시각을 처리합니다. 카드번호와 결제수단 정보는 Paddle이 직접 처리하며 OneSearch가 저장하지 않습니다."],
    ["3. 고객지원과 커뮤니티 정보", "문의 답변을 위해 이메일 주소, 문의 제목과 내용, 접수 시각을 처리합니다. 커뮤니티에서는 공개 닉네임, 게시글과 답변, 작성 시각을 처리하며 관리 코드와 접속 주소는 복원할 수 없는 해시로 변환해 글 관리와 남용 방지에 사용합니다."],
    ["4. 익명 이용 집계", "사이트 개선과 홍보 효과 확인을 위해 페이지 조회, 공유, 운영체제별 다운로드, 결제 화면 열기 횟수를 날짜·유입 출처·캠페인 단위의 합계로만 저장합니다. 이 집계에는 검색어, 이름, 이메일, 쿠키 또는 개별 사용자를 식별하는 값이 포함되지 않습니다."],
    ["5. 이용 목적", "수집 정보는 라이선스 발급·검증·기기 수 제한, 환불에 따른 라이선스 해지, 고객 문의 처리, 서비스 보안 및 익명 이용 흐름 개선 목적으로만 사용합니다."],
    ["6. 보관과 삭제", "라이선스 기록은 라이선스 운영과 법적 의무 수행에 필요한 기간 동안 보관합니다. 고객지원 기록은 문의 종결 후 최대 3년 동안 보관할 수 있습니다. 커뮤니티 글과 답변은 작성자가 관리 코드로 직접 삭제하거나 고객지원에서 삭제를 요청할 수 있습니다."],
    ["7. 외부 처리자", "Paddle은 결제와 세금, 구매자 지원을 처리합니다. 사이트와 라이선스 데이터는 OpenAI Sites 및 해당 클라우드 인프라에서 처리될 수 있습니다. 각 제공자의 처리에는 해당 제공자의 개인정보 정책이 적용됩니다."],
    ["8. 이용자 권리", "이용자는 본인의 개인정보 열람, 정정 또는 삭제를 요청할 수 있습니다. 결제 관련 정보 삭제는 Paddle 구매자 지원을 통해 별도로 요청해야 할 수 있습니다."],
  ] },
  en: { title: "Privacy Policy", sections: [
    ["1. Local search data", "Search queries, results, saved searches, and AI analysis are stored on the user's device by default. The OneSearch license server does not collect search content."],
    ["2. License data", "After payment, OneSearch processes Paddle transaction and customer identifiers, an encrypted license key, a hashed device identifier, app version, and activation time. Paddle processes card and payment-method details directly; OneSearch does not store them."],
    ["3. Support and community data", "To answer support requests, we process an email address, subject, message, and submission time. Community features process a public display name, posts, replies, and timestamps. Management codes and network addresses are irreversibly hashed for content management and abuse prevention."],
    ["4. Anonymous usage totals", "To improve the site and understand promotion performance, we store only daily aggregate counts for page views, shares, operating-system downloads, and checkout opens by source and campaign. These totals do not contain search queries, names, emails, cookies, or individual identifiers."],
    ["5. Purpose", "Processed information is used only for license issuance and validation, device limits, deactivation after refunds, support, service security, and improving anonymous usage flows."],
    ["6. Retention and deletion", "License records are retained as needed to operate licenses and meet legal obligations. Support records may be retained for up to three years after resolution. Community posts and replies can be deleted by their author with the management code or through a support request."],
    ["7. Service providers", "Paddle handles payments, taxes, and buyer support. Site and license data may be processed by OpenAI Sites and its cloud infrastructure. Each provider's privacy policy applies to its processing."],
    ["8. Your rights", "You may request access to, correction of, or deletion of your personal information. Payment-related deletion requests may need to be submitted separately through Paddle buyer support."],
  ] },
} as const;

export default async function PrivacyPage() {
  const locale = await getRequestLocale();
  const copy = PRIVACY_COPY[locale];
  return (
    <LegalLayout eyebrow="PRIVACY" title={copy.title}>
      {copy.sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}
    </LegalLayout>
  );
}
