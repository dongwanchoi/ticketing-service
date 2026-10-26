// Real public performance API/browser coverage only. Auth is mocked anonymous; no mutation is permitted.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { performanceLinks, assertCountEventually } from "./browser-assertions.mjs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH
  ? pathToFileURL(`${process.env.PLAYWRIGHT_MODULE_PATH}/index.mjs`).href : "playwright");

async function main() {
  const base = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  const backend = (process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080").replace(/\/$/, "");
  const response = await fetch(`${backend}/api/v1/performances`, { method: "GET", signal: AbortSignal.timeout(15_000) });
  assert.equal(response.status, 200, "The real public performance API must respond successfully");
  const performances = await response.json();
  assert.ok(Array.isArray(performances) && performances.length > 0, "Real performance data is required");
  assert.ok(performances.every(item => Number.isSafeInteger(item.id) && item.id > 0 && typeof item.title === "string"),
    "Every public performance must have a valid ID and title");
  const ids = new Set(performances.map(item => item.id));
  assert.equal(ids.size, performances.length, "Public performance IDs must be unique");
  const browser = await chromium.launch({ headless: true,
    executablePath: process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
  const context = await browser.newContext();
  context.setDefaultTimeout(15_000);
  context.setDefaultNavigationTimeout(30_000);
  const failures = [];
  await context.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!["GET", "HEAD"].includes(request.method())) {
      failures.push(`Blocked non-read request: ${request.method()}`);
      return route.abort("blockedbyclient");
    }
    if (url.pathname === "/api/v1/auth/me") {
      return route.fulfill({ status: 401, contentType: "application/json", body: "{}",
        headers: { "Access-Control-Allow-Origin": base, "Access-Control-Allow-Credentials": "true" } });
    }
    if (url.pathname.startsWith("/api/v1/auth/")) {
      failures.push("Unexpected authentication request during public-only coverage");
      return route.abort("blockedbyclient");
    }
    if (url.pathname.startsWith("/__test/")) {
      failures.push("Unexpected fixture control request during real public coverage");
      return route.abort("blockedbyclient");
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", error => failures.push(error.message));
  const heading = name => page.getByRole("heading", { name, exact: true });
  const checks = [];
  const checked = message => { checks.push(message); console.log(`PASS ${message}`); };
  try {
    await page.goto(base);
    await heading("공연 둘러보기").waitFor();
    const links = performanceLinks(page);
    await links.first().waitFor({ state: "visible" });
    await assertCountEventually(links, performances.length, "The browser must render the real API list");
    const first = links.first();
    const href = await first.getAttribute("href");
    assert.match(href ?? "", /^\/performances\/[1-9]\d*\/?$/);
    const selected = performances.find(item => item.id === Number(href.split("/")[2]));
    assert.ok(selected, "The browser detail link must refer to an actual backend performance");
    await first.click();
    await page.waitForURL(new URL(href, base).href);
    await heading("공연 소개").waitFor({ state: "visible" });
    await heading(selected.title).waitFor({ state: "visible" });
    checked("real public list and detail URL/content match the backend data");

    await page.goto(base);
    await heading("공연 둘러보기").waitFor();
    let unmatched = "__public_browser_unmatched__";
    while (performances.some(item => `${item.title} ${item.description ?? ""}`.toLowerCase().includes(unmatched))) unmatched += "_";
    await page.getByRole("searchbox").fill(unmatched);
    await page.getByText("일치하는 공연이 없습니다", { exact: true }).waitFor();
    await assertCountEventually(links, 0, "An unmatched search must not show any performance links");
    await page.getByRole("button", { name: "전체 공연 보기", exact: true }).click();
    assert.equal(await page.getByRole("searchbox").inputValue(), "");
    await links.first().waitFor({ state: "visible" });
    await assertCountEventually(links, performances.length, "Reset must restore every real performance link");
    checked("real public list search and reset preserve available performances");

    let missingId = 1;
    while (ids.has(missingId)) missingId++;
    for (const id of ["invalid", String(missingId)]) {
      await page.goto(`${base}/performances/${id}`);
      await heading("공연을 찾을 수 없습니다").waitFor({ state: "visible" });
      await page.getByRole("link", { name: "공연 목록으로", exact: true }).click();
      await heading("공연 둘러보기").waitFor({ state: "visible" });
    }
    checked("invalid and nonexistent real performance IDs show 404 and recover to the list");
    assert.deepEqual(failures, [], "Unexpected browser errors or blocked requests");
    console.log(JSON.stringify({ mode: "real-public-performance-api-anonymous-auth-mocked", apiStatus: response.status,
      performanceCount: performances.length, checks: checks.length, authE2E: false, mutations: 0 }));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
