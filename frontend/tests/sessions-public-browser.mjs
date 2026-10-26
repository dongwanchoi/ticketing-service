// Public session E2E: real Spring API + MySQL; authentication is mocked anonymous.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { assertCountEventually } from "./browser-assertions.mjs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH
  ? pathToFileURL(`${process.env.PLAYWRIGHT_MODULE_PATH}/index.mjs`).href : "playwright");

async function main() {
  const base = process.env.FRONTEND_URL || "http://localhost:3100";
  const backend = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:18081";
  const securityBackend = process.env.SESSION_SECURITY_BACKEND_URL || backend;
  const listResponse = await fetch(`${backend}/api/v1/performances`, { signal: AbortSignal.timeout(15_000) });
  assert.equal(listResponse.status, 200);
  const performances = await listResponse.json();
  assert.ok(Array.isArray(performances) && performances.length > 0);
  const id = performances[0].id;
  assert.ok(Number.isSafeInteger(id) && id > 0);
  const response = await fetch(`${backend}/api/v1/performances/${id}/sessions`);
  assert.equal(response.status, 200);
  const sessions = await response.json();
  assert.ok(Array.isArray(sessions) && sessions.length > 0, "Real session data is required");
  for (const session of sessions) {
    assert.deepEqual(Object.keys(session).sort(), ["maxPrice", "minPrice", "remainingSeatCount", "sessionId", "startsAt"]);
    assert.ok(Number.isSafeInteger(session.sessionId) && session.sessionId > 0);
    assert.ok(Number.isSafeInteger(session.remainingSeatCount) && session.remainingSeatCount >= 0);
  }
  for (let i = 1; i < sessions.length; i++) {
    assert.ok(sessions[i - 1].startsAt < sessions[i].startsAt ||
      (sessions[i - 1].startsAt === sessions[i].startsAt && sessions[i - 1].sessionId < sessions[i].sessionId));
  }
  for (const path of [`/api/v1/admin/performances/${id}/sessions`,
    `/api/v1/performances/${id}/sessions/${sessions[0].sessionId}/seats`]) {
    assert.equal((await fetch(`${securityBackend}${path}`)).status, 401, "Private endpoints must remain unauthorized");
  }
  const browser = await chromium.launch({ headless: true,
    executablePath: process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
  const context = await browser.newContext();
  context.setDefaultTimeout(15_000);
  const failures = [];
  await context.route("**/*", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (!["GET", "HEAD"].includes(request.method()) || /\/admin\/|\/seats(?:\/|$)/.test(path)) {
      failures.push("Unexpected write or private seat request");
      return route.abort("blockedbyclient");
    }
    if (path === "/api/v1/auth/me") return route.fulfill({ status: 401, contentType: "application/json", body: "{}",
      headers: { "Access-Control-Allow-Origin": base, "Access-Control-Allow-Credentials": "true" } });
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", error => failures.push(error.message));
  try {
    await page.goto(`${base}/performances/${id}`);
    const panel = page.getByRole("complementary", { name: "관람 회차 선택과 예매 안내", exact: true });
    await assertCountEventually(panel.getByRole("radio"), sessions.length, "Every public session must be selectable");
    for (const session of [sessions[0], sessions[sessions.length - 1]]) {
      const radio = panel.locator(`input[type="radio"][value="${session.sessionId}"]:visible`);
      await radio.check();
      assert.equal(await radio.isChecked(), true);
      assert.equal(await panel.locator('input[type="radio"]:checked').count(), 1);
      const summary = panel.getByRole("region", { name: "선택한 회차", exact: true });
      const expectedTime = `${session.startsAt.slice(0, 10).replaceAll("-", ".")} ${session.startsAt.slice(11, 16)} (한국 시간)`;
      await summary.getByText(expectedTime, { exact: true }).waitFor();
      await summary.getByText(`잔여 좌석 ${new Intl.NumberFormat("ko-KR").format(session.remainingSeatCount)}석`, { exact: true }).waitFor();
    }
    await panel.getByRole("link", { name: "로그인", exact: true }).waitFor();
    assert.equal(await panel.getByRole("button", { name: "예매 기능 준비 중", exact: true }).isDisabled(), true);
    assert.deepEqual(failures, []);
    console.log(JSON.stringify({ mode: "real-spring-mysql-public-sessions", sessionCount: sessions.length,
      apiStatus: response.status, authE2E: false, mutations: 0 }));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
