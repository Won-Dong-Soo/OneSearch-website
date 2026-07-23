"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import Link from "next/link";
import { LanguageSwitcher, useLocale } from "../language-provider";

const SUPPORT_COPY = {
  ko: { back: "다운로드로 돌아가기", title: "고객지원", description: "설치, AI 모델, 라이선스 문제를 알려주세요. 결제 취소와 영수증은", paddle: "Paddle 구매자 지원", suffix: "에서 바로 처리할 수 있습니다.", email: "답변 받을 이메일", subject: "문의 제목", message: "문의 내용", website: "웹사이트", sending: "접수 중", sent: "접수 완료", submit: "문의 보내기", success: "문의가 접수되었습니다.", error: "문의를 접수하지 못했습니다." },
  en: { back: "Back to downloads", title: "Support", description: "Tell us about installation, AI model, or license issues. For cancellations and receipts, use", paddle: "Paddle buyer support", suffix: ".", email: "Reply email", subject: "Subject", message: "Message", website: "Website", sending: "Sending", sent: "Submitted", submit: "Send request", success: "Your support request was submitted.", error: "Could not submit your request." },
} as const;

export default function SupportPage() {
  const locale = useLocale();
  const copy = SUPPORT_COPY[locale];
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("sending");
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const data = await response.json().catch(() => null) as { message?: string } | null;
    if (!response.ok) {
      setState("idle");
      setError(locale === "en" ? copy.error : data?.message ?? copy.error);
      return;
    }
    setState("sent");
    event.currentTarget.reset();
  };

  return (
    <main className="support-shell">
      <header className="legal-header"><Link className="brand" href="/">OneSearch</Link><div className="legal-header-actions"><Link href="/">{copy.back}</Link><LanguageSwitcher /></div></header>
      <section className="support-panel">
        <p className="eyebrow">SUPPORT</p>
        <h1>{copy.title}</h1>
        <p>{copy.description} <a href="https://paddle.net">{copy.paddle}</a>{copy.suffix}</p>
        <form onSubmit={submit}>
          <label>{copy.email}<input name="email" type="email" required autoComplete="email" /></label>
          <label>{copy.subject}<input name="subject" type="text" required minLength={2} maxLength={120} /></label>
          <label>{copy.message}<textarea name="message" required minLength={10} maxLength={3000} rows={8} /></label>
          <label className="support-honeypot" aria-hidden="true">{copy.website}<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <button type="submit" disabled={state === "sending" || state === "sent"}>
            {state === "sending" ? <LoaderCircle className="price-spin" size={18} /> : state === "sent" ? <CheckCircle2 size={18} /> : <Send size={18} />}
            {state === "sending" ? copy.sending : state === "sent" ? copy.sent : copy.submit}
          </button>
          {error && <p className="pricing-error" role="alert">{error}</p>}
          {state === "sent" && <p className="support-success" role="status">{copy.success}</p>}
        </form>
      </section>
    </main>
  );
}
