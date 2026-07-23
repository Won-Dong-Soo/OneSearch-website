"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  ChevronRight,
  ExternalLink,
  Folder,
  FolderOpen,
  Globe2,
  KeyRound,
  Pause,
  Play,
  RotateCcw,
  Search,
  Settings2,
  Sun,
  X,
} from "lucide-react";
import { useLocale } from "./language-provider";

const DEMO_COPY = {
  ko: {
    stages: [{ label: "검색", caption: "웹 결과 수집" }, { label: "AI 정리", caption: "의미별 폴더 생성" }, { label: "탐색", caption: "앱 안에서 비교" }],
    folders: [{ name: "로컬 AI 검색", count: 12, color: "teal" }, { name: "문서·지식 관리", count: 9, color: "magenta" }, { name: "개발자 도구", count: 7, color: "black" }],
    stageLabel: "제품 데모 단계",
    pause: "데모 일시 정지",
    play: "데모 재생",
    pauseTitle: "일시 정지",
    playTitle: "재생",
    restart: "데모 처음부터 재생",
    restartTitle: "처음부터",
    query: "로컬 AI 검색 도구 비교",
    folderLabel: "AI가 정리한 폴더",
    searching: "웹에서 관련 결과를 찾고 있습니다",
    resultFolder: "로컬 AI 검색",
    resultCount: "12개 결과",
    resultOne: "로컬 환경에서 모델을 실행하고 애플리케이션에 연결하는 방법",
    resultTwo: "웹 검색과 로컬 모델을 결합한 오픈소스 도구 비교",
    browser: "검색 화면을 잃지 않고 결과를 독립 탭에서 읽고 비교합니다.",
    searchTab: "검색",
    results: "검색 결과 28개",
    folderSummary: "폴더 3개",
    progress: "웹 검색 → 의미 분석 → 폴더 정리를 진행하고 있습니다",
    library: "검색 보관함",
    license: "라이선스 등록",
    setup: "AI 준비 및 설정",
    theme: "밝은 화면",
    closeTab: "탭 닫기",
  },
  en: {
    stages: [{ label: "Search", caption: "Collect web results" }, { label: "Organize", caption: "Create semantic folders" }, { label: "Explore", caption: "Compare inside the app" }],
    folders: [{ name: "Local AI search", count: 12, color: "teal" }, { name: "Docs and knowledge", count: 9, color: "magenta" }, { name: "Developer tools", count: 7, color: "black" }],
    stageLabel: "Product demo stages",
    pause: "Pause demo",
    play: "Play demo",
    pauseTitle: "Pause",
    playTitle: "Play",
    restart: "Restart demo",
    restartTitle: "Restart",
    query: "Compare local AI search tools",
    folderLabel: "Folders organized by AI",
    searching: "Finding relevant results on the web",
    resultFolder: "Local AI search",
    resultCount: "12 results",
    resultOne: "How to run models locally and connect them to applications",
    resultTwo: "Comparing open-source tools that combine web search and local models",
    browser: "Read and compare results in separate tabs without losing the search screen.",
    searchTab: "Search",
    results: "28 search results",
    folderSummary: "3 folders",
    progress: "Searching the web → analyzing meaning → organizing folders",
    library: "Saved searches",
    license: "Register license",
    setup: "AI setup and settings",
    theme: "Light theme",
    closeTab: "Close tab",
  },
} as const;

export function ProductDemo() {
  const locale = useLocale();
  const copy = DEMO_COPY[locale];
  const stages = copy.stages;
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setStage((current) => (current + 1) % stages.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [playing, stages.length]);

  const chooseStage = (nextStage: number) => {
    setStage(nextStage);
    setPlaying(false);
  };

  return (
    <div className="product-demo">
      <div className="demo-controls">
        <div className="demo-stage-tabs" aria-label={copy.stageLabel}>
          {stages.map((item, index) => (
            <button
              type="button"
              className={stage === index ? "active" : ""}
              onClick={() => chooseStage(index)}
              aria-pressed={stage === index}
              key={item.label}
            >
              <span>0{index + 1}</span>
              {item.label}
            </button>
          ))}
        </div>
        <div className="demo-playback">
          <span>{stages[stage].caption}</span>
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            aria-label={playing ? copy.pause : copy.play}
            title={playing ? copy.pauseTitle : copy.playTitle}
          >
            {playing ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setStage(0);
              setPlaying(true);
            }}
            aria-label={copy.restart}
            title={copy.restartTitle}
          >
            <RotateCcw size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="demo-app" data-stage={stage}>
        <div className="demo-app-header">
          <div className="demo-app-brand">
            <div className="demo-brand-mark">O</div>
            <strong>OneSearch</strong>
          </div>
          <div className="demo-search-box">
            <Search size={16} aria-hidden="true" />
            <span>{copy.query}</span>
            <b><Search size={14} aria-hidden="true" /> {copy.searchTab}</b>
          </div>
          <div className="demo-app-actions" aria-hidden="true">
            <span title={copy.library}><Bookmark size={15} /></span>
            <span title={copy.license}><KeyRound size={15} /></span>
            <span title={copy.setup}><Settings2 size={15} /></span>
            <span title={copy.theme}><Sun size={15} /></span>
          </div>
        </div>

        <div className="demo-tabbar">
          <span className={stage < 2 ? "active" : ""}>
            <div><b>{copy.searchTab}</b></div>
          </span>
          {stage === 2 && (
            <span className="active web-tab">
              <div><b>Run AI models locally</b><small>ollama.com</small></div>
              <X size={13} aria-label={copy.closeTab} />
            </span>
          )}
          <i>+</i>
        </div>

        <div className="demo-workspace">
          <section className="demo-results" aria-live="polite">
            {stage === 0 && (
              <div className="demo-search-layout">
                <div className="demo-status-row">
                  <span className="demo-pulse" />
                  <p>{copy.progress}</p>
                </div>
                <div className="demo-result-lines"><i /><i /><i /><i /></div>
              </div>
            )}

            {stage === 1 && (
              <div className="demo-search-layout demo-organized" aria-label={copy.folderLabel}>
                <div className="demo-summary-row">
                  <span>{copy.results}</span><span>{copy.folderSummary}</span><span>1842ms</span>
                </div>
                <div className="demo-category-tree">
                  <div className="demo-category-node open">
                    <div className="demo-category-row">
                      <ChevronRight className="open" size={15} /><FolderOpen size={16} /><strong>{copy.folders[0].name}</strong><span>{copy.folders[0].count}</span>
                    </div>
                    <div className="demo-category-contents">
                      <article>
                        <span>ollama.com <ExternalLink size={11} /></span>
                        <h4>Run AI models locally with Ollama</h4>
                        <p>{copy.resultOne}</p>
                      </article>
                      <article>
                        <span>github.com <ExternalLink size={11} /></span>
                        <h4>Open source local search projects</h4>
                        <p>{copy.resultTwo}</p>
                      </article>
                    </div>
                  </div>
                  {copy.folders.slice(1).map((folder) => (
                    <div className="demo-category-row" key={folder.name}>
                      <ChevronRight size={15} /><Folder size={16} /><strong>{folder.name}</strong><span>{folder.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stage === 2 && (
              <div className="demo-browser">
                <div className="demo-browser-toolbar">
                  <div><ArrowLeft size={15} /><ArrowRight size={15} /><RotateCcw size={14} /></div>
                  <span><Globe2 size={13} /> https://ollama.com/search</span>
                  <b>WebView</b>
                  <ExternalLink size={14} aria-hidden="true" />
                </div>
                <div className="demo-browser-page">
                  <span>OLLAMA</span>
                  <h3>Build with local AI</h3>
                  <p>{copy.browser}</p>
                  <div className="demo-page-rule" />
                  <div className="demo-page-rule short" />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
