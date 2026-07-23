import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("ships the OneSearch download page with accurate product copy", async () => {
  const [page, layout, css, downloadSelector, releaseConfig, downloadRoute] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/download-selector.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/release-config.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/download/[platform]/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /웹 검색 결과를 로컬 AI가 의미별 폴더와 계층으로 정리합니다/);
  assert.match(page, /필요한 페이지는 검색 화면을 떠나지 않고 독립 탭에서 비교하세요/);
  assert.match(page, /<DownloadSelector \/>/);
  assert.match(page, /<GuideDialog \/>/);
  assert.match(page, /<ProductDemo \/>/);
  assert.match(page, /첫 AI 설정/);
  assert.match(page, /VERSION 1\.0\.0/);
  assert.match(page, /개인정보 처리방침/);
  assert.match(layout, /OneSearch - 로컬 AI 검색 정리 앱/);
  assert.match(layout, /icons:\s*\{/);
  assert.doesNotMatch(page, /내 파일과 지식을/);
  assert.doesNotMatch(page + layout, /codex-preview|_sites-preview|Starter Project/);
  assert.match(css, /\.guide-dialog/);
  assert.match(downloadSelector, /releaseList/);
  assert.match(downloadSelector, /release\.sha256\.slice\(0, 12\)/);
  assert.match(releaseConfig, /release-manifest\.json/);
  assert.match(downloadRoute, /export async function HEAD/);
  assert.match(downloadRoute, /accept-ranges/);
  assert.match(downloadRoute, /x-release-sha256/);
  assert.match(downloadRoute, /x-release-upload-token/);
  assert.match(downloadRoute, /createMultipartUpload/);
  assert.match(downloadRoute, /uploadPart/);
  assert.match(downloadRoute, /upload\.complete/);

  await Promise.all([
    access(new URL("../public/onesearch-icon.png", import.meta.url)),
    access(new URL("../public/og-v2.png", import.meta.url)),
  ]);
});

test("includes launch sharing, anonymous attribution, SEO routes, and a media kit", async () => {
  const [page, shareDialog, tracker, promotion, eventRoute, schema, migration, press, sitemap, robots, privacy] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/share-dialog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/promotion-tracker.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/promotion.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/promotion/event/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0003_dazzling_texas_twister.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/press/press-kit.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/robots.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/privacy/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /SoftwareApplication/);
  assert.match(page, /<ShareDialog \/>/);
  assert.match(shareDialog, /navigator\.share/);
  assert.match(shareDialog, /x\.com\/intent\/post/);
  assert.match(shareDialog, /reddit\.com\/submit/);
  assert.match(tracker, /utm_source/);
  assert.match(promotion, /founding-launch/);
  assert.match(eventRoute, /ON CONFLICT\(key\) DO UPDATE/);
  assert.match(schema, /promotionMetrics/);
  assert.match(migration, /CREATE TABLE `promotion_metrics`/);
  assert.match(press, /READY-TO-USE COPY/);
  assert.match(sitemap, /MetadataRoute\.Sitemap/);
  assert.match(robots, /sitemap\.xml/);
  assert.match(privacy, /날짜·유입 출처·캠페인 단위의 합계/);
});

test("publishes internally consistent release metadata", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../public/release-manifest.json", import.meta.url), "utf8"),
  );

  assert.equal(manifest.version, "1.0.0");
  for (const release of Object.values(manifest.releases)) {
    assert.match(release.filename, /^OneSearch_1\.0\.0_/);
    assert.ok(Number.isSafeInteger(release.bytes) && release.bytes > 0);
    assert.match(release.sha256, /^[a-f0-9]{64}$/);
  }
});

test("publishes the Founding Pro offer and Paddle-required policies", async () => {
  const [pricing, terms, privacy, refund, support] = await Promise.all([
    readFile(new URL("../app/pricing-section.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/terms/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/privacy/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/refund/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/support/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(pricing, /₩19,900/);
  assert.match(pricing, /8B·14B/);
  assert.match(pricing, /최대 3대/);
  assert.match(terms, /OneSearch 이용약관/);
  assert.match(privacy, /검색 내용을 수집하지 않습니다/);
  assert.match(refund, /14일 이내/);
  assert.match(support, /\/api\/support/);
});

test("includes an accessible usage and setup guide", async () => {
  const [guide, packageJson] = await Promise.all([
    readFile(new URL("../app/guide-dialog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(guide, /<dialog/);
  assert.match(guide, /사용 가이드/);
  assert.match(guide, /빠른 시작/);
  assert.match(guide, /검색 사용법/);
  assert.match(guide, /AI 설정/);
  assert.match(guide, /ollama pull nomic-embed-text/);
  assert.match(guide, /ollama pull qwen3:4b/);
  assert.match(guide, /navigator\.clipboard\.writeText/);
  assert.match(guide, /close: "가이드 닫기"/);
  assert.match(guide, /close: "Close guide"/);
  assert.match(guide, /aria-label=\{copy\.close\}/);
  assert.match(guide, /trigger: "사용 가이드"/);
  assert.match(guide, /trigger: "User guide"/);
  assert.match(guide, /aria-label=\{copy\.trigger\}/);
  assert.match(guide, /aria-labelledby="quick-start-title"/);
  assert.match(packageJson, /"lucide-react"/);

  await assert.rejects(access(new URL("app/_sites-preview", projectRoot)));
});

test("includes an interactive three-stage product demo", async () => {
  const demo = await readFile(new URL("../app/product-demo.tsx", import.meta.url), "utf8");

  assert.match(demo, /웹 결과 수집/);
  assert.match(demo, /의미별 폴더 생성/);
  assert.match(demo, /앱 안에서 비교/);
  assert.match(demo, /stageLabel: "제품 데모 단계"/);
  assert.match(demo, /stageLabel: "Product demo stages"/);
  assert.match(demo, /aria-label=\{copy\.stageLabel\}/);
  assert.match(demo, /prefers-reduced-motion|setInterval/);
});

test("includes a persistent Q&A and community system", async () => {
  const [page, qna, communityPage, board, listRoute, detailRoute, commentRoute, schema, migration, privacy, terms] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/qna-dialog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/community/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/community/community-board.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/community/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/community/[id]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/community/[id]/comments/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0002_deep_rogue.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/privacy/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/terms/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<QnaDialog \/>/);
  assert.match(page, /href="\/community"/);
  assert.match(qna, /<dialog/);
  assert.match(qna, /자주 묻는 질문/);
  assert.match(qna, /community\?compose=question/);
  assert.match(communityPage, /<CommunityBoard/);
  assert.match(board, /질문 작성/);
  assert.match(board, /답변 완료/);
  assert.match(board, /managementCode/);
  assert.match(listRoute, /LIMIT 60/);
  assert.match(listRoute, /작성 한도를 초과/);
  assert.match(detailRoute, /managementCodeMatches/);
  assert.match(commentRoute, /LIMIT|작성 한도를 초과/);
  assert.match(schema, /communityPosts/);
  assert.match(schema, /communityComments/);
  assert.match(migration, /CREATE TABLE `community_posts`/);
  assert.match(migration, /CREATE TABLE `community_comments`/);
  assert.match(privacy, /관리 코드와 접속 주소/);
  assert.match(terms, /혐오·괴롭힘/);
});

test("includes a secure admin login and download analytics dashboard", async () => {
  const [page, dashboard, sessionRoute, summaryRoute, auth] = await Promise.all([
    readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/admin-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/session/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/promotion/summary/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/admin-auth.js", import.meta.url), "utf8"),
  ]);

  assert.match(page, /robots: \{ index: false/);
  assert.match(dashboard, /총 다운로드 클릭/);
  assert.match(dashboard, /download_mac/);
  assert.match(dashboard, /download_windows/);
  assert.match(dashboard, /최근 14일 다운로드/);
  assert.match(sessionRoute, /HttpOnly/);
  assert.match(sessionRoute, /SameSite=Strict/);
  assert.match(sessionRoute, /onesearch_internal=1/);
  assert.match(sessionRoute, /loginAllowed/);
  assert.match(summaryRoute, /adminRequestAuthorized/);
  assert.match(summaryRoute, /path NOT LIKE '\/admin%'/);
  assert.match(auth, /PBKDF2/);
  assert.match(auth, /HMAC/);
});
