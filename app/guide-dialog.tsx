"use client";

import { useRef, useState } from "react";
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  FolderTree,
  Moon,
  Search,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { useLocale } from "./language-provider";

type GuideTab = "start" | "search" | "settings";

const commands = ["ollama pull nomic-embed-text", "ollama pull qwen3:4b"];

const GUIDE_COPY = {
  ko: {
    trigger: "사용 가이드",
    title: "OneSearch 사용 가이드",
    close: "가이드 닫기",
    closeTitle: "닫기",
    tabsLabel: "사용 가이드 항목",
    tabs: { start: "빠른 시작", search: "검색 사용법", settings: "AI 설정" },
    quick: {
      title: "처음 실행하기",
      description: "검색 전에 로컬 AI 서비스와 모델을 한 번 준비합니다.",
      steps: [
        ["Ollama 준비", "Windows에서는 Ollama를 설치하고 실행하세요. macOS 배포본은 포함된 Ollama 실행 파일을 사용할 수 있으며, 이미 실행 중인 Ollama가 있으면 해당 서비스에 연결합니다."],
        ["AI 모델 설치", "OneSearch 준비 창에서 AI 모델 자동 설치를 누르세요. 문제가 있을 때만 아래 명령을 사용하면 됩니다."],
        ["검색 시작", "OneSearch를 열고 상단 검색창에 검색어를 입력한 뒤 Search 버튼을 누르세요. 상태 경고가 없다면 준비가 완료된 것입니다."],
      ],
    },
    search: {
      title: "검색 결과 활용하기",
      description: "웹 결과를 AI 분류와 앱 내 탭으로 이어서 탐색합니다.",
      features: [
        ["웹 검색", "상단 검색창에서 검색하면 설정된 검색 제공자로부터 웹 결과를 가져옵니다."],
        ["의미별 폴더", "Ollama가 결과를 분석하고 AI 라벨, 의미별 폴더, 하위 계층으로 정리합니다."],
        ["앱 내 탭", "결과 카드를 누르면 OneSearch 안에 독립 탭이 열립니다. 검색 화면은 그대로 유지됩니다."],
        ["외부 브라우저", "사이트가 앱 안에서 열리지 않으면 결과의 외부 열기 버튼으로 시스템 브라우저를 사용하세요."],
      ],
    },
    settings: {
      title: "기본 설정 확인하기",
      description: "일반 사용은 기본값으로 가능하며, 아래 항목만 확인하면 됩니다.",
      features: [
        ["화면 테마", "앱 오른쪽 위의 해·달 아이콘으로 밝은 화면과 어두운 화면을 전환합니다."],
        ["AI 모델 선택", "설정에서 Free 4B 모델을 사용하거나 Pro 라이선스로 8B·14B 고급 로컬 AI를 선택할 수 있습니다."],
      ],
      modelTitle: "필수 모델 다시 확인",
      modelDescription: "모델 누락 경고가 표시되면 설정 버튼에서 자동 설치를 다시 시도하세요. 직접 설치가 필요할 때는 아래 명령을 사용합니다.",
    },
    copyCommand: "명령 복사",
  },
  en: {
    trigger: "User guide",
    title: "OneSearch user guide",
    close: "Close guide",
    closeTitle: "Close",
    tabsLabel: "User guide sections",
    tabs: { start: "Quick start", search: "Using search", settings: "AI settings" },
    quick: {
      title: "First launch",
      description: "Prepare the local AI service and models once before searching.",
      steps: [
        ["Prepare Ollama", "On Windows, install and run Ollama. The macOS build can use its bundled Ollama executable, or connect to an Ollama service that is already running."],
        ["Install AI models", "Choose automatic AI model setup in the OneSearch setup window. Use the commands below only if automatic setup has a problem."],
        ["Start searching", "Open OneSearch, enter a query in the top search field, and choose Search. Setup is complete when no status warning is shown."],
      ],
    },
    search: {
      title: "Work with search results",
      description: "Move from web results to AI folders and in-app browsing tabs.",
      features: [
        ["Web search", "The top search field collects web results from your configured search provider."],
        ["Semantic folders", "Ollama analyzes results and organizes them into AI labels, semantic folders, and nested groups."],
        ["In-app tabs", "Select a result card to open it in a separate OneSearch tab while the search workspace stays available."],
        ["External browser", "If a site cannot open inside the app, use the result's external-open button to use your system browser."],
      ],
    },
    settings: {
      title: "Check the essential settings",
      description: "The defaults work for most people. Review only the items below.",
      features: [
        ["Theme", "Use the sun or moon icon in the top-right corner to switch between light and dark themes."],
        ["Choose an AI model", "Use the Free 4B model, or activate Pro to choose a more capable 8B or 14B local model."],
      ],
      modelTitle: "Check required models",
      modelDescription: "If a missing-model warning appears, retry automatic setup from Settings. Use the commands below when manual installation is necessary.",
    },
    copyCommand: "Copy command",
  },
} as const;

type GuideCopy = (typeof GUIDE_COPY)[keyof typeof GUIDE_COPY];

export function GuideDialog() {
  const locale = useLocale();
  const copy = GUIDE_COPY[locale];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeTab, setActiveTab] = useState<GuideTab>("start");
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyCommand = async (command: string) => {
    await navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    window.setTimeout(() => setCopiedCommand(null), 1600);
  };

  return (
    <>
      <button
        className="guide-trigger"
        type="button"
        aria-label={copy.trigger}
        onClick={() => dialogRef.current?.showModal()}
      >
        <BookOpen size={16} aria-hidden="true" />
        <span>{copy.trigger}</span>
      </button>

      <dialog
        className="guide-dialog"
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="guide-window">
          <header className="guide-header">
            <div>
              <p>ONBOARDING / ONESEARCH 1.0.0</p>
              <h2>{copy.title}</h2>
            </div>
            <form method="dialog">
              <button className="guide-close" type="submit" aria-label={copy.close} title={copy.closeTitle}>
                <X size={20} aria-hidden="true" />
              </button>
            </form>
          </header>

          <nav className="guide-tabs" aria-label={copy.tabsLabel}>
            <button
              type="button"
              className={activeTab === "start" ? "active" : ""}
              onClick={() => setActiveTab("start")}
            >
              <Sparkles size={16} aria-hidden="true" />
              {copy.tabs.start}
            </button>
            <button
              type="button"
              className={activeTab === "search" ? "active" : ""}
              onClick={() => setActiveTab("search")}
            >
              <Search size={16} aria-hidden="true" />
              {copy.tabs.search}
            </button>
            <button
              type="button"
              className={activeTab === "settings" ? "active" : ""}
              onClick={() => setActiveTab("settings")}
            >
              <Settings2 size={16} aria-hidden="true" />
              {copy.tabs.settings}
            </button>
          </nav>

          <div className="guide-content">
            {activeTab === "start" && <QuickStart copy={copy} copyCommand={copyCommand} copiedCommand={copiedCommand} />}
            {activeTab === "search" && <SearchGuide copy={copy} />}
            {activeTab === "settings" && <SettingsGuide copy={copy} copyCommand={copyCommand} copiedCommand={copiedCommand} />}
          </div>
        </div>
      </dialog>
    </>
  );
}

function QuickStart({
  copy,
  copyCommand,
  copiedCommand,
}: {
  copy: GuideCopy;
  copyCommand: (command: string) => Promise<void>;
  copiedCommand: string | null;
}) {
  return (
    <section className="guide-panel" aria-labelledby="quick-start-title">
      <div className="guide-intro">
        <p>QUICK START</p>
        <h3 id="quick-start-title">{copy.quick.title}</h3>
        <span>{copy.quick.description}</span>
      </div>

      <ol className="guide-steps">
        <li>
          <span className="step-number">01</span>
          <div>
            <h4>{copy.quick.steps[0][0]}</h4>
            <p>{copy.quick.steps[0][1]}</p>
          </div>
        </li>
        <li>
          <span className="step-number">02</span>
          <div>
            <h4>{copy.quick.steps[1][0]}</h4>
            <p>{copy.quick.steps[1][1]}</p>
            <CommandList copy={copy} copyCommand={copyCommand} copiedCommand={copiedCommand} />
          </div>
        </li>
        <li>
          <span className="step-number">03</span>
          <div>
            <h4>{copy.quick.steps[2][0]}</h4>
            <p>{copy.quick.steps[2][1]}</p>
          </div>
        </li>
      </ol>
    </section>
  );
}

function SearchGuide({ copy }: { copy: GuideCopy }) {
  return (
    <section className="guide-panel" aria-labelledby="search-guide-title">
      <div className="guide-intro">
        <p>SEARCH WORKFLOW</p>
        <h3 id="search-guide-title">{copy.search.title}</h3>
        <span>{copy.search.description}</span>
      </div>

      <div className="guide-feature-list">
        <article>
          <Search size={20} aria-hidden="true" />
          <div>
            <h4>{copy.search.features[0][0]}</h4>
            <p>{copy.search.features[0][1]}</p>
          </div>
        </article>
        <article>
          <FolderTree size={20} aria-hidden="true" />
          <div>
            <h4>{copy.search.features[1][0]}</h4>
            <p>{copy.search.features[1][1]}</p>
          </div>
        </article>
        <article>
          <BookOpen size={20} aria-hidden="true" />
          <div>
            <h4>{copy.search.features[2][0]}</h4>
            <p>{copy.search.features[2][1]}</p>
          </div>
        </article>
        <article>
          <ExternalLink size={20} aria-hidden="true" />
          <div>
            <h4>{copy.search.features[3][0]}</h4>
            <p>{copy.search.features[3][1]}</p>
          </div>
        </article>
      </div>
    </section>
  );
}

function SettingsGuide({
  copy,
  copyCommand,
  copiedCommand,
}: {
  copy: GuideCopy;
  copyCommand: (command: string) => Promise<void>;
  copiedCommand: string | null;
}) {
  return (
    <section className="guide-panel" aria-labelledby="settings-guide-title">
      <div className="guide-intro">
        <p>AI SETTINGS</p>
        <h3 id="settings-guide-title">{copy.settings.title}</h3>
        <span>{copy.settings.description}</span>
      </div>

      <div className="settings-list">
        <article>
          <Moon size={19} aria-hidden="true" />
          <div>
            <h4>{copy.settings.features[0][0]}</h4>
            <p>{copy.settings.features[0][1]}</p>
          </div>
        </article>
        <article>
          <Sparkles size={19} aria-hidden="true" />
          <div>
            <h4>{copy.settings.features[1][0]}</h4>
            <p>{copy.settings.features[1][1]}</p>
          </div>
        </article>
      </div>

      <div className="model-check">
        <h4>{copy.settings.modelTitle}</h4>
        <p>{copy.settings.modelDescription}</p>
        <CommandList copy={copy} copyCommand={copyCommand} copiedCommand={copiedCommand} />
      </div>
    </section>
  );
}

function CommandList({
  copy,
  copyCommand,
  copiedCommand,
}: {
  copy: GuideCopy;
  copyCommand: (command: string) => Promise<void>;
  copiedCommand: string | null;
}) {
  return (
    <div className="command-list">
      {commands.map((command) => (
        <div className="command-row" key={command}>
          <code>{command}</code>
          <button
            type="button"
            onClick={() => void copyCommand(command)}
            aria-label={`${copy.copyCommand}: ${command}`}
            title={copy.copyCommand}
          >
            {copiedCommand === command ? (
              <Check size={17} aria-hidden="true" />
            ) : (
              <Copy size={17} aria-hidden="true" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
