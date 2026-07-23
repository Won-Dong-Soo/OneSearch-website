const LIVE_SITE = "https://onesearch-download.adultdongsoo0516.chatgpt.site";

const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector(".mobile-nav");
const guideDialog = document.querySelector(".guide-dialog");

function setLiveLinks() {
  document.querySelectorAll("[data-live-path]").forEach((link) => {
    link.href = `${LIVE_SITE}${link.dataset.livePath}`;
  });

  document.querySelectorAll("[data-live-anchor]").forEach((link) => {
    link.href = `${LIVE_SITE}/#${link.dataset.liveAnchor}`;
  });
}

function setLanguage(language) {
  const locale = language === "en" ? "en" : "ko";
  document.documentElement.lang = locale;
  localStorage.setItem("onesearch-language", locale);

  document.querySelectorAll("[data-ko][data-en]").forEach((element) => {
    element.textContent = element.dataset[locale];
  });

  document.querySelectorAll("[data-language]").forEach((button) => {
    const active = button.dataset.language === locale;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  document.title = locale === "ko"
    ? "OneSearch - 로컬 AI 검색 정리 앱"
    : "OneSearch - Local AI Search Organizer";
}

function detectPlatform() {
  const platform = navigator.userAgent.toLowerCase().includes("win")
    ? "windows"
    : navigator.userAgent.toLowerCase().includes("mac")
      ? "mac"
      : "";

  if (platform) {
    document.querySelector(`[data-platform-card="${platform}"]`)?.classList.add("recommended");
  }
}

menuButton?.addEventListener("click", () => {
  const nextOpen = !mobileMenu.classList.contains("open");
  mobileMenu.classList.toggle("open", nextOpen);
  menuButton.setAttribute("aria-expanded", String(nextOpen));
});

mobileMenu?.addEventListener("click", (event) => {
  if (event.target.closest("a, button")) {
    mobileMenu.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  }
});

document.querySelectorAll("[data-language]").forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});

document.querySelectorAll("[data-open-guide]").forEach((button) => {
  button.addEventListener("click", () => {
    guideDialog?.showModal();
    document.body.classList.add("modal-open");
  });
});

document.querySelector("[data-close-guide]")?.addEventListener("click", () => {
  guideDialog?.close();
});

guideDialog?.addEventListener("click", (event) => {
  if (event.target === guideDialog) guideDialog.close();
});

guideDialog?.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
});

setLiveLinks();
detectPlatform();
setLanguage(localStorage.getItem("onesearch-language") || (navigator.language.startsWith("ko") ? "ko" : "en"));
