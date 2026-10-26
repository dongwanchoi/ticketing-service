// Runs against the isolated performance-fixture.mjs backend and a separately started frontend.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { performanceLinks, assertCountEventually } from "./browser-assertions.mjs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH
  ? pathToFileURL(`${process.env.PLAYWRIGHT_MODULE_PATH}/index.mjs`).href : "playwright");

async function main() {
  const base = process.env.FRONTEND_URL || "http://localhost:3100";
  const fixture = process.env.MOCK_BACKEND_URL || "http://localhost:18080";
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(fixture).hostname), "Fixture must be local");
  const setMode = async mode => {
    const response = await fetch(`${fixture}/__test/state`, { method: "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
    assert.equal(response.status, 200, "The isolated fixture control endpoint is required");
    assert.deepEqual(await response.json(), { mode });
  };
  const browser = await chromium.launch({ headless: true,
    executablePath: process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
  const context = await browser.newContext();
  context.setDefaultTimeout(15_000);
  context.setDefaultNavigationTimeout(30_000);
  const page = await context.newPage();
  const failures = [];
  page.on("pageerror", error => failures.push(error.message));
  const heading = name => page.getByRole("heading", { name, exact: true });
  const checks = [];
  const checked = message => { checks.push(message); console.log(`PASS ${message}`); };
  try {
    await setMode("normal");
    await page.goto(base);
    await heading("공연 둘러보기").waitFor();
    const links = performanceLinks(page);
    await assertCountEventually(links, 2, "Both fixture performances must be rendered");
    await page.getByRole("searchbox").fill("__no_such_performance__");
    await page.getByText("일치하는 공연이 없습니다", { exact: true }).waitFor();
    await assertCountEventually(links, 0, "An unmatched search must not show any performance links");
    await page.getByRole("button", { name: "전체 공연 보기", exact: true }).click();
    assert.equal(await page.getByRole("searchbox").inputValue(), "");
    await links.first().waitFor();
    await assertCountEventually(links, 2, "Reset must restore both fixture performance links");
    await links.filter({ has: page.getByRole("heading", { name: "테스트 콘서트", exact: true }) }).click();
    await page.waitForURL(`${base}/performances/1`);
    await heading("테스트 콘서트").waitFor();
    await heading("공연 소개").waitFor();
    checked("list, unmatched search, reset and detail navigation");

    for (const id of ["invalid", "999999"]) {
      await page.goto(`${base}/performances/${id}`);
      await heading("공연을 찾을 수 없습니다").waitFor();
      await page.getByRole("link", { name: "공연 목록으로", exact: true }).click();
      await heading("공연 둘러보기").waitFor();
    }
    checked("invalid ID and missing performance show 404 UI with list recovery");

    await setMode("empty");
    await page.goto(base);
    await page.getByText("등록된 공연이 아직 없습니다", { exact: true }).waitFor();
    await assertCountEventually(links, 0, "An empty API list must not show any performance links");
    assert.equal(await page.getByText("일치하는 공연이 없습니다", { exact: true }).count(), 0);
    await setMode("normal");
    await page.getByRole("button", { name: "공연 목록 새로고침", exact: true }).click();
    await links.first().waitFor();
    checked("empty data is distinct from unmatched search and refresh restores data");

    for (const [path, message] of [["/", "공연 목록을 불러오고 있습니다"], ["/performances/1", "공연 상세 정보를 불러오고 있습니다"]]) {
      await setMode("slow");
      await page.goto(new URL(path, base).href, { waitUntil: "commit" });
      await heading(message).waitFor({ state: "visible" });
      assert.equal(await page.locator('[aria-busy="true"]').count(), 1);
      await heading(path === "/" ? "공연 둘러보기" : "공연 소개").waitFor();
    }
    checked("list and detail loading UI is visible while the API is delayed");

    for (const [path, message, recovered] of [["/", "공연 정보를 불러오지 못했습니다", "공연 둘러보기"],
      ["/performances/1", "공연 상세 정보를 불러오지 못했습니다", "공연 소개"]]) {
      await setMode("error");
      await page.goto(new URL(path, base).href);
      await heading(message).waitFor();
      assert.equal(await page.getByRole("link", { name: "공연 목록으로", exact: true }).count(), 1);
      await setMode("normal");
      await page.getByRole("button", { name: "다시 시도", exact: true }).click();
      await heading(recovered).waitFor();
    }
    checked("list and detail failures render error boundaries and retry recovers");
    assert.deepEqual(failures, [], "Unexpected browser JavaScript errors");
    console.log(JSON.stringify({ mode: "mock-performance-api", checks: checks.length }));
  } finally {
    await browser.close();
    await setMode("normal");
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
