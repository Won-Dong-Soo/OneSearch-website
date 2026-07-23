import type { Metadata } from "next";
import { LegalLayout } from "../legal-layout";
import { getRequestLocale } from "../i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "ko" ? "환불 정책" : "Refund Policy", alternates: { canonical: "/refund" } };
}

const REFUND_COPY = {
  ko: { title: "OneSearch 환불 정책", sections: [
    ["1. 환불 요청 기간", "Founding Pro 구매일로부터 14일 이내에 환불을 요청할 수 있습니다. 중복 결제, 라이선스 발급 실패 또는 중대한 기능 장애가 확인된 경우에는 우선적으로 환불을 지원합니다."],
    ["3. 처리 결과", "환불 승인 시 결제에 사용한 수단으로 반환되며, 처리 시간은 결제수단과 금융기관에 따라 달라질 수 있습니다. 환불이 완료된 Pro 라이선스는 비활성화됩니다."],
    ["4. 예외", "라이선스 키의 부정 공유, 결제 우회, 반복적인 구매·환불 악용이 확인된 경우에는 관련 법령이 허용하는 범위에서 환불이 제한될 수 있습니다. 법률상 보장되는 소비자 권리는 본 정책으로 제한되지 않습니다."],
  ], methodTitle: "2. 요청 방법", methodBefore: "", methodLink: "Paddle 구매자 지원", methodMiddle: "에서 결제 이메일 또는 거래 정보를 사용해 환불을 요청하세요. 제품 문제 확인이 필요한 경우", support: "OneSearch 고객지원", methodAfter: "에도 문의할 수 있습니다." },
  en: { title: "OneSearch Refund Policy", sections: [
    ["1. Request period", "You may request a refund within 14 days of purchasing Founding Pro. Duplicate charges, failed license issuance, or a confirmed major product defect will be prioritized."],
    ["3. Refund result", "Approved refunds are returned to the original payment method. Processing time varies by payment method and financial institution. A refunded Pro license is deactivated."],
    ["4. Exceptions", "Refunds may be limited where permitted by law if license-key abuse, payment bypass, or repeated purchase-and-refund abuse is confirmed. This policy does not limit consumer rights guaranteed by law."],
  ], methodTitle: "2. How to request", methodBefore: "Use", methodLink: "Paddle buyer support", methodMiddle: " with your payment email or transaction details. If product troubleshooting is required, you can also contact", support: "OneSearch support", methodAfter: "." },
} as const;

export default async function RefundPage() {
  const locale = await getRequestLocale();
  const copy = REFUND_COPY[locale];
  return (
    <LegalLayout eyebrow="REFUND" title={copy.title}>
      <section><h2>{copy.sections[0][0]}</h2><p>{copy.sections[0][1]}</p></section>
      <section><h2>{copy.methodTitle}</h2><p>{copy.methodBefore} <a href="https://paddle.net">{copy.methodLink}</a>{copy.methodMiddle} <a href="/support">{copy.support}</a>{copy.methodAfter}</p></section>
      {copy.sections.slice(1).map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}
    </LegalLayout>
  );
}
