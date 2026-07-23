"use client";

import Link from "next/link";
import { ArrowRight, MessageCircleQuestion, MessagesSquare, X } from "lucide-react";
import { useRef } from "react";
import { useLocale } from "./language-provider";

const FAQS = {
  ko: [
  {
    question: "Windows에서 AI가 준비되지 않았다고 나옵니다.",
    answer: "Windows 배포본은 Ollama를 별도로 설치하고 실행해야 합니다. 이후 OneSearch 준비 창에서 4B 모델 설치를 진행하세요.",
  },
  {
    question: "4B와 8B·14B 모델은 무엇이 다른가요?",
    answer: "4B는 빠르고 가벼운 무료 모델입니다. Pro의 8B·14B는 더 정교한 분류와 폴더 이름을 제공하지만 메모리와 처리 시간이 더 필요합니다.",
  },
  {
    question: "앱 실행 시 보안 경고가 표시됩니다.",
    answer: "현재 배포본은 서명 전 버전입니다. macOS에서는 우클릭 후 열기, Windows에서는 SmartScreen의 추가 정보에서 실행을 선택할 수 있습니다.",
  },
  {
    question: "Pro 라이선스 키는 어디에서 확인하나요?",
    answer: "Paddle 결제가 완료되면 구매 창 아래에 OS- 형식의 키가 표시됩니다. OneSearch의 열쇠 아이콘을 눌러 등록하세요.",
  },
  ],
  en: [
    { question: "Windows says local AI is not ready.", answer: "Install and run Ollama separately on Windows, then install the 4B model from the OneSearch setup window." },
    { question: "What is the difference between the 4B, 8B, and 14B models?", answer: "The 4B model is fast, lightweight, and free. Pro's 8B and 14B models provide more precise classification and folder names but need more memory and processing time." },
    { question: "A security warning appears when I launch the app.", answer: "The current build is not yet code-signed. On macOS, right-click and choose Open. On Windows, choose More info in SmartScreen, then Run anyway." },
    { question: "Where can I find my Pro license key?", answer: "After Paddle checkout completes, an OS- license key appears below the purchase panel. Use the key icon in OneSearch to activate it." },
  ],
} as const;

const QNA_COPY = {
  ko: { title: "자주 묻는 질문", close: "Q&A 닫기", closeTitle: "닫기", view: "질문과 답변 보기", ask: "새 질문 작성" },
  en: { title: "Frequently asked questions", close: "Close Q&A", closeTitle: "Close", view: "View questions and answers", ask: "Ask a question" },
} as const;

export function QnaDialog() {
  const locale = useLocale();
  const copy = QNA_COPY[locale];
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button className="qna-trigger" type="button" onClick={() => dialogRef.current?.showModal()}>
        <MessageCircleQuestion size={17} />
        <span>Q&A</span>
      </button>
      <dialog
        ref={dialogRef}
        className="qna-dialog"
        aria-labelledby="qna-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        <div className="qna-window">
          <header className="qna-header">
            <div>
              <p>ONESEARCH Q&A</p>
              <h2 id="qna-title">{copy.title}</h2>
            </div>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label={copy.close} title={copy.closeTitle}>
              <X size={19} />
            </button>
          </header>
          <div className="qna-list">
            {FAQS[locale].map((faq, index) => (
              <details key={faq.question} open={index === 0}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
          <div className="qna-actions">
            <Link href="/community">
              <MessagesSquare size={17} /> {copy.view}
            </Link>
            <Link href="/community?compose=question">
              {copy.ask} <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
