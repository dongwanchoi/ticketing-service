// No project dependency required: set PLAYWRIGHT_MODULE_PATH to a temporary Playwright install.
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH
  ? pathToFileURL(`${process.env.PLAYWRIGHT_MODULE_PATH}/index.mjs`).href : "playwright");

async function main() {
  const live = process.env.AUTH_E2E_LIVE === "1";
  const readOnly = process.env.AUTH_E2E_READ_ONLY === "1";
  const browser = await chromium.launch({ headless: true,
    executablePath: process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
  const context = await browser.newContext();
  const page = await context.newPage();
  const failures = [];
  page.on("pageerror", error => failures.push(error.message));
  const base = process.env.FRONTEND_URL || "http://localhost:3000";
  const backend = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";
  const username = `web_${Date.now()}`;
  const password = "BrowserPassword123!";
  const mock = { registered: false, authenticated: false, rejectCsrf: false, offline: false };
  let signupPosts = 0;
  page.on("request", request => {
    if (request.url() === `${backend}/api/v1/auth/signup` && request.method() === "POST") signupPosts++;
  });
  if (!live && !readOnly) {
    await context.route(`${backend}/api/v1/auth/**`, async route => {
      if (mock.offline) return route.abort("failed");
      const request = route.request();
      const path = new URL(request.url()).pathname.split("/").pop();
      const headers = { "Access-Control-Allow-Origin": base, "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers": "Content-Type,X-CSRF-TOKEN", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" };
      let status = 200, body;
      if (request.method() === "OPTIONS") status = 204;
      else if (path === "csrf") body = { headerName: "X-CSRF-TOKEN", token: "mock-token" };
      else if (path === "me") { status = mock.authenticated ? 200 : 401; body = { id: 1, username, role: "USER" }; }
      else if (request.headers()["x-csrf-token"] !== "mock-token" || mock.rejectCsrf) status = 403;
      else if (path === "signup") {
        status = mock.registered ? 409 : 201; mock.registered = true;
        body = { id: 1, username, role: "USER" };
      } else if (path === "login") {
        const data = new URLSearchParams(request.postData());
        mock.authenticated = data.get("username") === username && data.get("password") === password;
        status = mock.authenticated ? 204 : 401;
      } else if (path === "logout") { mock.authenticated = false; status = 204; }
      await route.fulfill({ status, headers, contentType: "application/json", ...(status !== 204 ? { body: JSON.stringify(body ?? {}) } : {}) });
    });
  }
  const checks = [];
  const checked = message => { checks.push(message); process.stdout.write(`PASS ${message}\n`); };
  try {
    if (readOnly) {
      await page.goto(`${base}/login`);
      await page.getByLabel("아이디", { exact: true }).waitFor();
      checked("real anonymous me response enables login form");
      const response = await page.evaluate(async backend => {
        const options = { credentials: "include" };
        const me = await fetch(`${backend}/api/v1/auth/me`, options);
        const admin = await fetch(`${backend}/api/v1/admin/performances`, options);
        const missing = await fetch(`${backend}/api/v1/auth/signup`, { ...options, method: "POST",
          headers: { "Content-Type": "application/json" }, body: "{}" });
        const csrf = await fetch(`${backend}/api/v1/auth/csrf`, options);
        return { me: me.status, admin: admin.status, missing: missing.status, csrf: csrf.status };
      }, backend);
      assert.deepEqual(response, { me: 401, admin: 401, missing: 403, csrf: 200 });
      checked("real browser CORS/cookies: me 401, protected API 401, missing CSRF 403, token endpoint 200");
      const cookies = await context.cookies(backend);
      const session = cookies.find(cookie => cookie.name === "JSESSIONID");
      assert.ok(session?.httpOnly);
      assert.equal(session.sameSite, "Lax");
      assert.equal(session.secure, false);
      checked("local HTTP session cookie is HttpOnly, SameSite=Lax, Secure=false");
      const other = await browser.newContext();
      try {
        const token = await other.request.get(`${backend}/api/v1/auth/csrf`).then(r => r.json());
        const status = await page.evaluate(async ({ backend, token }) => {
          const response = await fetch(`${backend}/api/v1/auth/login`, { method: "POST", credentials: "include",
            headers: { "Content-Type": "application/x-www-form-urlencoded", [token.headerName]: token.token },
            body: "username=unused&password=unused" });
          return response.status;
        }, { backend, token });
        assert.equal(status, 403);
        checked("real backend rejects another session's CSRF before attempting login");
      } finally { await other.close(); }
      await page.goto(base);
      await page.getByRole("heading", { name: "공연 둘러보기" }).waitFor();
      const detail = page.locator('a[href^="/performances/"]').first();
      if (await detail.count()) {
        await detail.click();
        await page.getByRole("heading", { name: "공연 소개" }).waitFor();
      }
      checked("real backend public performance list and detail remain available");
      assert.deepEqual(failures, []);
      process.stdout.write(JSON.stringify({ mode: "live-backend-no-user-db-writes", checks: checks.length }) + "\n");
      return;
    }
    await page.goto(base);
    await page.getByRole("heading", { name: "어떤 공연을 찾고 계신가요?" }).waitFor();
    await page.getByRole("link", { name: "로그인", exact: true }).waitFor();
    checked("anonymous public performance page and login header");
    await page.getByRole("link", { name: "회원가입", exact: true }).click();
    await page.getByLabel("아이디", { exact: true }).fill(username);
    await page.getByLabel("비밀번호", { exact: true }).fill(password);
    await page.getByLabel("비밀번호 확인", { exact: true }).fill(password);
    await page.locator("form").evaluate(form => { form.requestSubmit(); form.requestSubmit(); });
    await page.getByRole("heading", { name: "회원가입이 완료되었습니다" }).waitFor();
    assert.equal(signupPosts, 1);
    await page.getByRole("link", { name: "로그인", exact: true }).waitFor();
    checked("signup succeeds once on double submit, without automatic login");

    await page.goto(`${base}/signup`);
    await page.getByLabel("아이디", { exact: true }).fill(username);
    await page.getByLabel("비밀번호", { exact: true }).fill(password);
    await page.getByLabel("비밀번호 확인", { exact: true }).fill(password);
    await page.getByRole("button", { name: "회원가입", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "이미 사용 중인 아이디" }).waitFor();
    checked("duplicate account has a specific error");

    await page.goto(`${base}/login`);
    await page.getByLabel("아이디", { exact: true }).fill(username);
    await page.getByLabel("비밀번호", { exact: true }).fill("IncorrectPassword!");
    await page.getByRole("button", { name: "로그인", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "올바르지 않습니다" }).waitFor();
    assert.equal(await page.getByLabel("비밀번호", { exact: true }).inputValue(), "");
    checked("wrong password fails and password field is cleared");

    if (!live) {
      mock.rejectCsrf = true;
      await page.getByLabel("비밀번호", { exact: true }).fill(password);
      await page.getByRole("button", { name: "로그인", exact: true }).click();
      await page.getByRole("alert").filter({ hasText: "세션이 변경" }).waitFor();
      mock.rejectCsrf = false;
      checked("CSRF rejection is shown without automatic mutation retry");
    }

    await page.getByLabel("비밀번호", { exact: true }).fill(password);
    await page.getByRole("button", { name: "로그인", exact: true }).click();
    await page.waitForURL(`${base}/`);
    await page.getByText(`${username}님`, { exact: true }).waitFor();
    checked("login confirms me and navigates to main");
    await page.reload();
    await page.getByText(`${username}님`, { exact: true }).waitFor();
    checked("authentication persists after reload");
    const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
    assert.deepEqual(storage, { local: [], session: [] });
    checked("no auth data in localStorage or sessionStorage");

    await page.goto(`${base}/admin/performances/new`);
    await page.getByText("현재 계정으로 이용할 수 없습니다.", { exact: false }).waitFor();
    assert.equal(await page.locator("form").count(), 0);
    checked("ordinary user cannot see admin mutation form");
    await page.getByRole("button", { name: "로그아웃", exact: true }).click();
    await page.getByRole("link", { name: "로그인", exact: true }).first().waitFor();
    await page.reload();
    await page.getByRole("link", { name: "로그인", exact: true }).first().waitFor();
    checked("logout clears authentication, including after reload");

    if (live) {
      const result = await page.evaluate(async backend => {
        const protectedResponse = await fetch(`${backend}/api/v1/admin/performances`, { credentials: "include" });
        const me = await fetch(`${backend}/api/v1/auth/me`, { credentials: "include" });
        const missing = await fetch(`${backend}/api/v1/auth/signup`, { method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" }, body: "{}" });
        return { protected: protectedResponse.status, me: me.status, missing: missing.status };
      }, backend);
      assert.deepEqual(result, { protected: 401, me: 401, missing: 403 });
      checked("real backend rejects anonymous protected API and missing CSRF");
      const other = await browser.newContext();
      try {
        const token = await other.request.get(`${backend}/api/v1/auth/csrf`).then(response => response.json());
        const mismatch = await page.evaluate(async ({ backend, token }) => {
          const response = await fetch(`${backend}/api/v1/auth/login`, { method: "POST", credentials: "include",
            headers: { "Content-Type": "application/x-www-form-urlencoded", [token.headerName]: token.token },
            body: "username=unused&password=unused" });
          return response.status;
        }, { backend, token });
        assert.equal(mismatch, 403);
        checked("real backend rejects CSRF token from another session");
      } finally { await other.close(); }
    }

    await page.goto(base);
    await page.getByRole("heading", { name: "공연 둘러보기" }).waitFor();
    await page.getByRole("searchbox").fill("__no_such_performance__");
    await page.getByText("일치하는 공연이 없습니다", { exact: true }).waitFor();
    await page.getByRole("button", { name: "전체 공연 보기" }).click();
    const detail = page.locator('a[href^="/performances/"]').first();
    if (await detail.count()) {
      await detail.click();
      await page.getByRole("heading", { name: "공연 소개" }).waitFor();
      checked("public performance detail remains accessible");
    }
    checked("public list and search remain usable");
    if (!live) {
      mock.offline = true;
      await page.goto(`${base}/login`);
      await page.getByRole("heading", { name: "로그인 상태를 확인할 수 없습니다" }).waitFor();
      assert.equal(await page.locator("form").count(), 0);
      mock.offline = false;
      await page.getByRole("main").getByRole("button", { name: "다시 확인", exact: true }).click();
      await page.getByLabel("아이디", { exact: true }).waitFor();
      checked("network errors are distinct from anonymous state, with recovery");
    }
    assert.deepEqual(failures, [], "Unexpected browser JavaScript errors");
    process.stdout.write(JSON.stringify({ mode: live ? "live-backend" : "mock-auth-api", checks: checks.length, createdUsername: live ? username : undefined }) + "\n");
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
