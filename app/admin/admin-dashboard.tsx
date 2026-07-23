"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  MonitorDown,
  MousePointerClick,
  RefreshCw,
  Share2,
} from "lucide-react";
import { useLocale } from "../language-provider";

type MetricEvent =
  | "page_view"
  | "share"
  | "share_copy"
  | "press_copy"
  | "download_mac"
  | "download_windows"
  | "checkout_open";

type Metric = {
  day: string;
  event: MetricEvent;
  path: string;
  platform: string;
  source: string;
  medium: string;
  campaign: string;
  count: number;
};

type Summary = {
  since: string;
  metrics: Metric[];
};

const COPY = {
  ko: {
    eyebrow: "PRIVATE ANALYTICS",
    title: "관리자 통계",
    description: "최근 30일간 익명 집계된 다운로드와 홍보 성과를 확인합니다.",
    loginTitle: "관리자 로그인",
    loginDescription: "관리자 계정으로 로그인하면 통계가 표시됩니다. 세션은 12시간 동안 유지됩니다.",
    username: "아이디",
    password: "비밀번호",
    showPassword: "비밀번호 표시",
    hidePassword: "비밀번호 숨기기",
    login: "로그인",
    loggingIn: "로그인 중",
    loginError: "아이디 또는 비밀번호가 올바르지 않습니다.",
    rateError: "시도 횟수가 많습니다. 15분 뒤 다시 시도하세요.",
    configError: "관리자 로그인이 아직 설정되지 않았습니다.",
    loadError: "통계를 불러오지 못했습니다.",
    checking: "로그인 상태 확인 중",
    refresh: "새로고침",
    logout: "로그아웃",
    last30: "최근 30일",
    totalDownloads: "총 다운로드 클릭",
    macDownloads: "macOS",
    windowsDownloads: "Windows",
    pageViews: "페이지 조회",
    checkout: "결제 진입",
    share: "공유",
    trendTitle: "최근 14일 다운로드",
    trendDescription: "버튼을 누른 횟수이며 설치 완료 수와는 다를 수 있습니다.",
    macShort: "Mac",
    windowsShort: "Win",
    noData: "아직 집계된 데이터가 없습니다.",
    sourceTitle: "다운로드 유입 경로",
    source: "유입",
    campaign: "캠페인",
    count: "횟수",
    activityTitle: "일별 활동",
    day: "날짜",
    event: "이벤트",
    platform: "환경",
    direct: "직접 방문",
    events: {
      page_view: "페이지 조회",
      share: "공유 실행",
      share_copy: "공유 링크 복사",
      press_copy: "소개 문구 복사",
      download_mac: "macOS 다운로드",
      download_windows: "Windows 다운로드",
      checkout_open: "결제 진입",
    },
  },
  en: {
    eyebrow: "PRIVATE ANALYTICS",
    title: "Admin analytics",
    description: "Review anonymously aggregated downloads and promotion performance from the last 30 days.",
    loginTitle: "Admin sign in",
    loginDescription: "Sign in with the admin account to view analytics. The session remains active for 12 hours.",
    username: "Username",
    password: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    login: "Sign in",
    loggingIn: "Signing in",
    loginError: "The username or password is incorrect.",
    rateError: "Too many attempts. Try again in 15 minutes.",
    configError: "Admin login has not been configured yet.",
    loadError: "Could not load analytics.",
    checking: "Checking sign-in status",
    refresh: "Refresh",
    logout: "Sign out",
    last30: "Last 30 days",
    totalDownloads: "Download clicks",
    macDownloads: "macOS",
    windowsDownloads: "Windows",
    pageViews: "Page views",
    checkout: "Checkout opens",
    share: "Shares",
    trendTitle: "Downloads over 14 days",
    trendDescription: "These are button clicks and may differ from completed installations.",
    macShort: "Mac",
    windowsShort: "Win",
    noData: "No analytics have been recorded yet.",
    sourceTitle: "Download sources",
    source: "Source",
    campaign: "Campaign",
    count: "Count",
    activityTitle: "Daily activity",
    day: "Date",
    event: "Event",
    platform: "Platform",
    direct: "Direct",
    events: {
      page_view: "Page view",
      share: "Share",
      share_copy: "Share link copied",
      press_copy: "Press copy copied",
      download_mac: "macOS download",
      download_windows: "Windows download",
      checkout_open: "Checkout opened",
    },
  },
} as const;

function sumEvents(metrics: Metric[], events: MetricEvent[]): number {
  return metrics.reduce((total, metric) => events.includes(metric.event) ? total + Number(metric.count) : total, 0);
}

function lastFourteenDays(metrics: Metric[]) {
  const formatter = (date: Date) => date.toISOString().slice(0, 10);
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (13 - index));
    const day = formatter(date);
    return {
      day,
      mac: sumEvents(metrics.filter((metric) => metric.day === day), ["download_mac"]),
      windows: sumEvents(metrics.filter((metric) => metric.day === day), ["download_windows"]),
    };
  });
}

export function AdminDashboard() {
  const locale = useLocale();
  const copy = COPY[locale];
  const [status, setStatus] = useState<"checking" | "signed-out" | "signed-in">("checking");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadSummary = async () => {
    const response = await fetch("/api/admin/promotion/summary", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (response.status === 401) {
      setStatus("signed-out");
      setSummary(null);
      return;
    }
    if (!response.ok) throw new Error(copy.loadError);
    setSummary(await response.json() as Summary);
    setStatus("signed-in");
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/promotion/summary", {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      if (response.status === 401) {
        setStatus("signed-out");
        return;
      }
      if (!response.ok) throw new Error(copy.loadError);
      setSummary(await response.json() as Summary);
      setStatus("signed-in");
    }).catch((requestError: unknown) => {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setStatus("signed-out");
      setError(copy.loadError);
    });
    return () => controller.abort();
  }, [copy.loadError]);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        setError(response.status === 429 ? copy.rateError : response.status === 503 ? copy.configError : copy.loginError);
        return;
      }
      setPassword("");
      await loadSummary();
    } catch {
      setError(copy.loadError);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    await fetch("/api/admin/session", {
      method: "DELETE",
      credentials: "same-origin",
    }).catch(() => null);
    setSummary(null);
    setStatus("signed-out");
    setBusy(false);
  };

  const derived = useMemo(() => {
    const metrics = summary?.metrics ?? [];
    const trend = lastFourteenDays(metrics);
    const maxDaily = Math.max(1, ...trend.map((item) => item.mac + item.windows));
    const sourceMap = new Map<string, { source: string; campaign: string; count: number }>();

    for (const metric of metrics) {
      if (metric.event !== "download_mac" && metric.event !== "download_windows") continue;
      const source = metric.source === "direct" ? copy.direct : metric.source;
      const key = `${source}|${metric.campaign}`;
      const current = sourceMap.get(key) ?? { source, campaign: metric.campaign, count: 0 };
      current.count += Number(metric.count);
      sourceMap.set(key, current);
    }

    return {
      downloads: sumEvents(metrics, ["download_mac", "download_windows"]),
      mac: sumEvents(metrics, ["download_mac"]),
      windows: sumEvents(metrics, ["download_windows"]),
      pageViews: sumEvents(metrics, ["page_view"]),
      checkout: sumEvents(metrics, ["checkout_open"]),
      shares: sumEvents(metrics, ["share", "share_copy"]),
      trend,
      maxDaily,
      sources: [...sourceMap.values()].sort((left, right) => right.count - left.count).slice(0, 12),
      activity: [...metrics].sort((left, right) => right.day.localeCompare(left.day)).slice(0, 50),
    };
  }, [copy.direct, summary]);

  if (status === "checking") {
    return (
      <section className="admin-page admin-loading" aria-live="polite">
        <RefreshCw size={22} className="admin-spinner" aria-hidden="true" />
        <span>{copy.checking}</span>
      </section>
    );
  }

  if (status === "signed-out") {
    return (
      <section className="admin-page admin-login-page">
        <div className="admin-login-copy">
          <p>{copy.eyebrow}</p>
          <h1>{copy.loginTitle}</h1>
          <span>{copy.loginDescription}</span>
        </div>
        <form className="admin-login-form" onSubmit={login}>
          <label>
            <span>{copy.username}</span>
            <input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label>
            <span>{copy.password}</span>
            <div className="admin-password-field">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                title={showPassword ? copy.hidePassword : copy.showPassword}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {error && <p className="admin-form-error" role="alert">{error}</p>}
          <button className="admin-primary-button" type="submit" disabled={busy}>
            <LogIn size={18} aria-hidden="true" />
            {busy ? copy.loggingIn : copy.login}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <div>
          <p>{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <span>{copy.description}</span>
        </div>
        <div className="admin-heading-actions">
          <button
            type="button"
            onClick={() => {
              setBusy(true);
              loadSummary().catch(() => setError(copy.loadError)).finally(() => setBusy(false));
            }}
            disabled={busy}
            title={copy.refresh}
          >
            <RefreshCw size={17} className={busy ? "admin-spinner" : ""} aria-hidden="true" />
            {copy.refresh}
          </button>
          <button type="button" onClick={logout} disabled={busy} title={copy.logout}>
            <LogOut size={17} aria-hidden="true" />
            {copy.logout}
          </button>
        </div>
      </div>

      {error && <p className="admin-page-error" role="alert">{error}</p>}

      <div className="admin-metrics" aria-label={copy.last30}>
        <MetricCard icon={<Download size={19} />} label={copy.totalDownloads} value={derived.downloads} accent="teal" />
        <MetricCard icon={<MonitorDown size={19} />} label={copy.macDownloads} value={derived.mac} />
        <MetricCard icon={<MonitorDown size={19} />} label={copy.windowsDownloads} value={derived.windows} />
        <MetricCard icon={<BarChart3 size={19} />} label={copy.pageViews} value={derived.pageViews} />
        <MetricCard icon={<MousePointerClick size={19} />} label={copy.checkout} value={derived.checkout} accent="magenta" />
        <MetricCard icon={<Share2 size={19} />} label={copy.share} value={derived.shares} />
      </div>

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h2>{copy.trendTitle}</h2>
            <p>{copy.trendDescription}</p>
          </div>
          <div className="admin-chart-legend">
            <span><i className="mac" />{copy.macShort}</span>
            <span><i className="windows" />{copy.windowsShort}</span>
          </div>
        </div>
        {derived.downloads === 0 ? (
          <p className="admin-empty">{copy.noData}</p>
        ) : (
          <div className="admin-chart">
            {derived.trend.map((item) => {
              const total = item.mac + item.windows;
              const dayLabel = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
                month: "numeric",
                day: "numeric",
              }).format(new Date(`${item.day}T00:00:00Z`));
              return (
                <div className="admin-chart-column" key={item.day} title={`${dayLabel}: ${total}`}>
                  <div className="admin-chart-value">{total || ""}</div>
                  <div className="admin-chart-bar" style={{ height: `${Math.max(total ? 5 : 0, (total / derived.maxDaily) * 100)}%` }}>
                    {total > 0 && <>
                      <i className="windows" style={{ height: `${(item.windows / total) * 100}%` }} />
                      <i className="mac" style={{ height: `${(item.mac / total) * 100}%` }} />
                    </>}
                  </div>
                  <span>{dayLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="admin-table-grid">
        <AdminTable title={copy.sourceTitle}>
          <thead><tr><th>{copy.source}</th><th>{copy.campaign}</th><th>{copy.count}</th></tr></thead>
          <tbody>
            {derived.sources.length === 0
              ? <tr><td colSpan={3}>{copy.noData}</td></tr>
              : derived.sources.map((item) => (
                <tr key={`${item.source}-${item.campaign}`}>
                  <td>{item.source}</td>
                  <td>{item.campaign === "none" ? "—" : item.campaign}</td>
                  <td>{item.count.toLocaleString()}</td>
                </tr>
              ))}
          </tbody>
        </AdminTable>

        <AdminTable title={copy.activityTitle}>
          <thead><tr><th>{copy.day}</th><th>{copy.event}</th><th>{copy.platform}</th><th>{copy.count}</th></tr></thead>
          <tbody>
            {derived.activity.length === 0
              ? <tr><td colSpan={4}>{copy.noData}</td></tr>
              : derived.activity.map((metric, index) => (
                <tr key={`${metric.day}-${metric.event}-${metric.source}-${index}`}>
                  <td>{metric.day}</td>
                  <td>{copy.events[metric.event] ?? metric.event}</td>
                  <td>{metric.platform}</td>
                  <td>{Number(metric.count).toLocaleString()}</td>
                </tr>
              ))}
          </tbody>
        </AdminTable>
      </div>
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: "teal" | "magenta";
}) {
  return (
    <article className={`admin-metric ${accent ? `admin-metric-${accent}` : ""}`}>
      <div>{icon}<span>{label}</span></div>
      <strong>{value.toLocaleString()}</strong>
    </article>
  );
}

function AdminTable({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="admin-table-section">
      <h2>{title}</h2>
      <div className="admin-table-scroll">
        <table>{children}</table>
      </div>
    </section>
  );
}
