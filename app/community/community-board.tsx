"use client";

import {
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  LoaderCircle,
  MessageSquare,
  MessagesSquare,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useLocale } from "../language-provider";
import type { Locale } from "../i18n-config";

type PostType = "question" | "discussion";
type CommunityPost = {
  id: string;
  type: PostType;
  title: string;
  body: string;
  authorName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
};
type CommunityComment = {
  id: string;
  postId: string;
  body: string;
  authorName: string;
  createdAt: string;
};
type CommunityDetail = { post: CommunityPost; comments: CommunityComment[] };

const COMMUNITY_COPY = {
  ko: {
    loadError: "게시글을 불러오지 못했습니다.", openError: "게시글을 열지 못했습니다.", createError: "게시글을 등록하지 못했습니다.", replyError: "답변을 등록하지 못했습니다.", statusError: "상태를 변경하지 못했습니다.", deleteError: "글을 삭제하지 못했습니다.", deleteReplyError: "답변을 삭제하지 못했습니다.",
    codePrompt: "작성할 때 설정한 관리 코드를 입력하세요.", deleteConfirm: "이 글과 모든 답변을 삭제할까요?", replyCodePrompt: "답변 작성 시 설정한 관리 코드를 입력하세요.",
    title: "Q&A와 사용자 커뮤니티", description: "설치와 AI 모델을 질문하고, 더 나은 검색 방법과 사용 경험을 공유하세요.", boardLabel: "커뮤니티 게시판", community: "커뮤니티", close: "닫기", writeQuestion: "질문 작성", writePost: "새 글 작성", newQuestion: "새 질문", newPost: "새 커뮤니티 글", questionHint: "문제가 발생한 환경과 화면의 메시지를 함께 적어주세요.", postHint: "OneSearch 활용법, 검색 워크플로와 의견을 공유하세요.", subject: "제목", body: "내용", nickname: "닉네임", code: "관리 코드", website: "웹사이트", codeHint: "관리 코드는 상태 변경과 삭제에 사용됩니다.", submit: "등록", loading: "불러오는 중", empty: "아직 등록된 글이 없습니다.", answered: "답변 완료", waiting: "답변 대기", closePost: "게시글 닫기", reopen: "다시 열기", deletePost: "글 삭제", commentsLabel: "답변과 댓글", firstReply: "첫 답변을 남겨주세요.", deleteReply: "답변 삭제", replyBody: "답변 또는 댓글", submitReply: "답변 등록",
  },
  en: {
    loadError: "Could not load posts.", openError: "Could not open the post.", createError: "Could not publish the post.", replyError: "Could not publish the reply.", statusError: "Could not update the status.", deleteError: "Could not delete the post.", deleteReplyError: "Could not delete the reply.",
    codePrompt: "Enter the management code you set when writing this post.", deleteConfirm: "Delete this post and all replies?", replyCodePrompt: "Enter the management code you set for this reply.",
    title: "Q&A and user community", description: "Ask about installation and AI models, and share better search workflows and your experience.", boardLabel: "Community board", community: "Community", close: "Close", writeQuestion: "Ask a question", writePost: "New post", newQuestion: "New question", newPost: "New community post", questionHint: "Include your operating system and the exact message shown on screen.", postHint: "Share OneSearch workflows, search methods, and product feedback.", subject: "Title", body: "Content", nickname: "Display name", code: "Management code", website: "Website", codeHint: "Use this code to change status or delete your content.", submit: "Publish", loading: "Loading", empty: "No posts yet.", answered: "Answered", waiting: "Awaiting reply", closePost: "Close post", reopen: "Reopen", deletePost: "Delete post", commentsLabel: "Replies and comments", firstReply: "Be the first to reply.", deleteReply: "Delete reply", replyBody: "Reply or comment", submitReply: "Publish reply",
  },
} as const;

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    .format(new Date(value));
}

async function responseData(response: Response) {
  return response.json().catch(() => null) as Promise<{ message?: string; id?: string } | null>;
}

export function CommunityBoard({
  initialType,
  initialComposing,
}: {
  initialType: PostType;
  initialComposing: boolean;
}) {
  const locale = useLocale();
  const copy = COMMUNITY_COPY[locale];
  const errorMessage = useCallback((message: string | undefined, fallback: string) => locale === "en" ? fallback : message ?? fallback, [locale]);
  const [type, setType] = useState<PostType>(initialType);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [detail, setDetail] = useState<CommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [composing, setComposing] = useState(initialComposing);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async (nextType: PostType) => {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/community?type=${nextType}`, { cache: "no-store" });
    const data = await response.json().catch(() => null) as { posts?: CommunityPost[]; message?: string } | null;
    if (!response.ok) {
      setError(errorMessage(data?.message, copy.loadError));
      setPosts([]);
    } else {
      setPosts(data?.posts ?? []);
    }
    setLoading(false);
  }, [copy.loadError, errorMessage]);

  const openPost = useCallback(async (id: string) => {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/community/${encodeURIComponent(id)}`, { cache: "no-store" });
    const data = await response.json().catch(() => null) as CommunityDetail & { message?: string };
    if (!response.ok) setError(errorMessage(data?.message, copy.openError));
    else setDetail(data);
    setBusy(false);
  }, [copy.openError, errorMessage]);

  useEffect(() => {
    let active = true;
    void fetch(`/api/community?type=${type}`, { cache: "no-store" })
      .then(async (response) => ({
        response,
        data: await response.json().catch(() => null) as { posts?: CommunityPost[]; message?: string } | null,
      }))
      .then(({ response, data }) => {
        if (!active) return;
        if (!response.ok) {
          setError(errorMessage(data?.message, copy.loadError));
          setPosts([]);
        } else {
          setPosts(data?.posts ?? []);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError(copy.loadError);
        setPosts([]);
        setLoading(false);
      });
    return () => { active = false; };
  }, [copy.loadError, errorMessage, type]);

  const selectType = (nextType: PostType) => {
    if (nextType === type) return;
    setLoading(true);
    setError("");
    setType(nextType);
    setDetail(null);
  };

  const submitPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/community", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...values, type }),
    });
    const data = await responseData(response);
    if (!response.ok || !data?.id) {
      setError(errorMessage(data?.message, copy.createError));
    } else {
      form.reset();
      setComposing(false);
      await loadPosts(type);
      await openPost(data.id);
    }
    setBusy(false);
  };

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detail) return;
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    const response = await fetch(`/api/community/${encodeURIComponent(detail.post.id)}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const data = await responseData(response);
    if (!response.ok) setError(errorMessage(data?.message, copy.replyError));
    else {
      form.reset();
      await openPost(detail.post.id);
      await loadPosts(type);
    }
    setBusy(false);
  };

  const updateQuestionStatus = async () => {
    if (!detail) return;
    const managementCode = window.prompt(copy.codePrompt);
    if (!managementCode) return;
    const action = detail.post.status === "answered" ? "open" : "answered";
    const response = await fetch(`/api/community/${encodeURIComponent(detail.post.id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, managementCode }),
    });
    const data = await responseData(response);
    if (!response.ok) setError(errorMessage(data?.message, copy.statusError));
    else {
      await openPost(detail.post.id);
      await loadPosts(type);
    }
  };

  const deletePost = async () => {
    if (!detail || !window.confirm(copy.deleteConfirm)) return;
    const managementCode = window.prompt(copy.codePrompt);
    if (!managementCode) return;
    const response = await fetch(`/api/community/${encodeURIComponent(detail.post.id)}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ managementCode }),
    });
    const data = await responseData(response);
    if (!response.ok) setError(errorMessage(data?.message, copy.deleteError));
    else {
      setDetail(null);
      await loadPosts(type);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!detail) return;
    const managementCode = window.prompt(copy.replyCodePrompt);
    if (!managementCode) return;
    const response = await fetch(`/api/community/${encodeURIComponent(detail.post.id)}/comments/${encodeURIComponent(commentId)}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ managementCode }),
    });
    const data = await responseData(response);
    if (!response.ok) setError(errorMessage(data?.message, copy.deleteReplyError));
    else {
      await openPost(detail.post.id);
      await loadPosts(type);
    }
  };

  return (
    <section className="community-page">
      <header className="community-heading">
        <div>
          <p>ONESEARCH COMMUNITY</p>
          <h1>{copy.title}</h1>
        </div>
        <span>{copy.description}</span>
      </header>

      <div className="community-toolbar">
        <div className="community-segments" role="tablist" aria-label={copy.boardLabel}>
          <button type="button" role="tab" aria-selected={type === "question"} className={type === "question" ? "active" : ""} onClick={() => selectType("question")}>
            <CircleHelp size={17} /> Q&A
          </button>
          <button type="button" role="tab" aria-selected={type === "discussion"} className={type === "discussion" ? "active" : ""} onClick={() => selectType("discussion")}>
            <MessagesSquare size={17} /> {copy.community}
          </button>
        </div>
        <button className="community-compose-trigger" type="button" onClick={() => setComposing((value) => !value)}>
          {composing ? <X size={17} /> : <Plus size={17} />}
          {composing ? copy.close : type === "question" ? copy.writeQuestion : copy.writePost}
        </button>
      </div>

      {composing && (
        <form className="community-composer" onSubmit={submitPost}>
          <div className="community-form-heading">
            <strong>{type === "question" ? copy.newQuestion : copy.newPost}</strong>
            <span>{type === "question" ? copy.questionHint : copy.postHint}</span>
          </div>
          <label>{copy.subject}<input name="title" required minLength={4} maxLength={100} /></label>
          <label className="community-form-wide">{copy.body}<textarea name="body" required minLength={10} maxLength={3000} rows={6} /></label>
          <label>{copy.nickname}<input name="authorName" required minLength={2} maxLength={24} autoComplete="nickname" /></label>
          <label>{copy.code}<input name="managementCode" type="password" required minLength={6} maxLength={40} autoComplete="new-password" /></label>
          <label className="support-honeypot" aria-hidden="true">{copy.website}<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <div className="community-form-actions">
            <span>{copy.codeHint}</span>
            <button type="submit" disabled={busy}>{busy ? <LoaderCircle className="price-spin" size={17} /> : <Send size={17} />} {copy.submit}</button>
          </div>
        </form>
      )}

      {error && <p className="community-error" role="alert">{error}</p>}

      <div className={`community-workspace ${detail ? "has-detail" : ""}`}>
        <div className="community-list" aria-busy={loading}>
          {loading ? (
            <div className="community-state"><LoaderCircle className="price-spin" size={22} /> {copy.loading}</div>
          ) : posts.length === 0 ? (
            <div className="community-state"><MessageSquare size={24} /> {copy.empty}</div>
          ) : posts.map((post) => (
            <button key={post.id} type="button" className={detail?.post.id === post.id ? "active" : ""} onClick={() => void openPost(post.id)}>
              <div className="community-row-topline">
                {post.type === "question" && (
                  <span className={post.status === "answered" ? "answered" : "open"}>{post.status === "answered" ? copy.answered : copy.waiting}</span>
                )}
                <time dateTime={post.createdAt}>{formatDate(post.createdAt, locale)}</time>
              </div>
              <strong>{post.title}</strong>
              <p>{post.body}</p>
              <div className="community-row-meta">
                <span>{post.authorName}</span>
                <span><MessageSquare size={14} /> {post.commentCount}</span>
                <ChevronRight size={17} />
              </div>
            </button>
          ))}
        </div>

        {detail && (
          <article className="community-detail">
            <header>
              <div>
                {detail.post.type === "question" && (
                  <span className={detail.post.status === "answered" ? "answered" : "open"}>{detail.post.status === "answered" ? copy.answered : copy.waiting}</span>
                )}
                <h2>{detail.post.title}</h2>
                <p>{detail.post.authorName} · {formatDate(detail.post.createdAt, locale)}</p>
              </div>
              <button type="button" className="community-icon-button" onClick={() => setDetail(null)} aria-label={copy.closePost} title={copy.close}><X size={18} /></button>
            </header>
            <p className="community-detail-body">{detail.post.body}</p>
            <div className="community-manage-actions">
              {detail.post.type === "question" && (
                <button type="button" onClick={() => void updateQuestionStatus()}><CheckCircle2 size={16} /> {detail.post.status === "answered" ? copy.reopen : copy.answered}</button>
              )}
              <button type="button" className="danger" onClick={() => void deletePost()}><Trash2 size={16} /> {copy.deletePost}</button>
            </div>
            <section className="community-comments" aria-label={copy.commentsLabel}>
              <h3>{copy.commentsLabel} <span>{detail.comments.length}</span></h3>
              {detail.comments.length === 0 ? <p className="community-comments-empty">{copy.firstReply}</p> : detail.comments.map((comment) => (
                <article key={comment.id}>
                  <header><strong>{comment.authorName}</strong><time dateTime={comment.createdAt}>{formatDate(comment.createdAt, locale)}</time></header>
                  <p>{comment.body}</p>
                  <button type="button" onClick={() => void deleteComment(comment.id)} aria-label={`${comment.authorName}: ${copy.deleteReply}`} title={copy.deleteReply}><Trash2 size={14} /></button>
                </article>
              ))}
            </section>
            <form className="community-reply-form" onSubmit={submitComment}>
              <label className="community-form-wide">{copy.replyBody}<textarea name="body" required minLength={2} maxLength={1500} rows={4} /></label>
              <label>{copy.nickname}<input name="authorName" required minLength={2} maxLength={24} autoComplete="nickname" /></label>
              <label>{copy.code}<input name="managementCode" type="password" required minLength={6} maxLength={40} autoComplete="new-password" /></label>
              <label className="support-honeypot" aria-hidden="true">{copy.website}<input name="website" tabIndex={-1} autoComplete="off" /></label>
              <button type="submit" disabled={busy}>{busy ? <LoaderCircle className="price-spin" size={17} /> : <Send size={17} />} {copy.submitReply}</button>
            </form>
          </article>
        )}
      </div>
    </section>
  );
}
