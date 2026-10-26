// Real Chrome against the isolated fixture. No real authentication or application mutations.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { assertCountEventually } from "./browser-assertions.mjs";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH
  ? pathToFileURL(`${process.env.PLAYWRIGHT_MODULE_PATH}/index.mjs`).href : "playwright");

async function main() {
  const base = process.env.FRONTEND_URL || "http://localhost:3100";
  const fixture = process.env.MOCK_BACKEND_URL || "http://localhost:18080";
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(fixture).hostname));
  const setMode = async mode => {
    const response = await fetch(`${fixture}/__test/sessions`, { method: "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { mode });
  };
  const browser = await chromium.launch({ headless: true,
    executablePath: process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
  const context = await browser.newContext({ timezoneId: "America/Los_Angeles" });
  context.setDefaultTimeout(15_000);
  context.setDefaultNavigationTimeout(30_000);
  let auth = "anonymous";
  const failures = [];
  await context.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!["GET", "HEAD"].includes(request.method()) || /\/admin\/|\/seats(?:\/|$)/.test(url.pathname)) {
      failures.push("Unexpected mutation or protected seat request");
      return route.abort("blockedbyclient");
    }
    if (url.pathname === "/api/v1/auth/me") {
      const status = auth === "authenticated" ? 200 : auth === "error" ? 503 : 401;
      return route.fulfill({ status, contentType: "application/json",
        headers: { "Access-Control-Allow-Origin": base, "Access-Control-Allow-Credentials": "true" },
        body: JSON.stringify(status === 200 ? { id: 1, username: "mock_viewer", role: "USER" } : {}) });
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", error => failures.push(error.message));
  const panel = page.getByRole("complementary", { name: "관람 회차 선택과 예매 안내", exact: true });
  const radios = panel.getByRole("radio");
  const summary = panel.getByRole("region", { name: "선택한 회차", exact: true });
  let checks = 0;
  const checked = message => { checks++; console.log(`PASS ${message}`); };
  try {
    await setMode("normal");
    await page.goto(`${base}/performances/1`);
    await radios.first().waitFor();
    await assertCountEventually(radios, 3, "All session summaries must render");
    // Native radio labels include the Korean local time, price range and count.
    const matinee = panel.getByRole("radio", { name: /2027\.01\.16 14:00.*50,000원 ~ 90,000원.*12석/ });
    await matinee.check();
    assert.equal(await matinee.isChecked(), true);
    await summary.getByText("2027.01.16 14:00 (한국 시간)", { exact: true }).waitFor();
    await summary.getByText("50,000원 ~ 90,000원", { exact: true }).waitFor();
    const evening = panel.getByRole("radio", { name: /2027\.01\.16 19:00.*70,000원.*3석/ });
    await evening.check();
    assert.equal(await matinee.isChecked(), false);
    await summary.getByText("2027.01.16 19:00 (한국 시간)", { exact: true }).waitFor();
    await panel.getByRole("radio", { name: /가격 미등록.*0석/ }).waitFor();
    assert.equal(await panel.getByRole("button", { name: "예매 기능 준비 중", exact: true }).isDisabled(), true);
    await panel.getByRole("link", { name: "로그인", exact: true }).waitFor();
    checked("anonymous session selection, price ranges, zero seats and Korean local time");

    await page.goto(`${base}/performances/2`);
    await radios.first().waitFor();
    assert.equal(await panel.locator('input[type="radio"]:checked').count(), 0);
    await summary.getByText("미선택", { exact: true }).waitFor();
    checked("changing performances clears the selection");

    await setMode("empty");
    await page.reload();
    await panel.getByText(/등록된 관람 회차가 없습니다/).waitFor();
    await assertCountEventually(radios, 0, "Empty sessions must not offer a selection");
    await setMode("normal");
    await panel.getByRole("button", { name: "회차 다시 불러오기", exact: true }).click();
    await radios.first().waitFor();
    checked("empty sessions and refresh recovery");

    await setMode("error");
    await page.reload();
    await panel.getByRole("alert").waitFor();
    await assertCountEventually(radios, 0, "Failed sessions must not offer stale choices");
    await setMode("normal");
    await panel.getByRole("button", { name: "회차 다시 불러오기", exact: true }).click();
    await radios.first().waitFor();
    checked("server error is distinct from empty sessions and retry recovers");

    await setMode("slow");
    await page.reload({ waitUntil: "domcontentloaded" });
    await panel.getByText("관람 회차를 불러오고 있습니다.", { exact: true }).waitFor();
    await radios.first().waitFor();
    checked("session loading is visible before the response arrives");

    await setMode("normal");
    auth = "authenticated";
    await page.reload();
    await panel.getByText(/로그인되어 있습니다/).waitFor();
    await radios.first().check();
    assert.equal(await panel.getByRole("button", { name: "예매 기능 준비 중", exact: true }).isDisabled(), true);
    auth = "error";
    await page.reload();
    await panel.getByText(/로그인 상태를 확인할 수 없습니다/).waitFor();
    await radios.first().check();
    checked("mock authenticated and unavailable auth states never expose seat selection");
    assert.deepEqual(failures, []);
    console.log(JSON.stringify({ mode: "mock-session-api-real-chrome", checks, authE2E: false }));
  } finally {
    await browser.close();
    await setMode("normal");
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
