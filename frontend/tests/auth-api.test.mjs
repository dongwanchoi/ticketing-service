import { test } from "node:test";
import assert from "node:assert/strict";
import * as auth from "../src/features/auth/api.ts";

function mockRequests(t, responses) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    assert.ok(next, "Unexpected request (or an unsafe automatic retry)");
    return new Response(next.body === undefined ? null : JSON.stringify(next.body), { status: next.status ?? 200 });
  };
  t.after(() => { globalThis.fetch = original; });
  return calls;
}
const token = { body: { headerName: "X-CSRF-TOKEN", token: "request-only-token" } };

test("signup obtains CSRF, sends only JSON credentials, and does not login", async t => {
  const calls = mockRequests(t, [token, { status: 201, body: { id: 1, role: "USER" } }]);
  await auth.signup("example_user", "ExamplePassword123!");
  assert.equal(calls.length, 2);
  assert.ok(calls[0].url.endsWith("/csrf"));
  assert.ok(calls[1].url.endsWith("/signup"));
  assert.deepEqual(JSON.parse(calls[1].init.body), { username: "example_user", password: "ExamplePassword123!" });
  assert.equal(calls[1].init.headers["Content-Type"], "application/json");
  assert.equal(calls[1].init.headers["X-CSRF-TOKEN"], "request-only-token");
  for (const { init } of calls) {
    assert.equal(init.credentials, "include");
    assert.equal(init.cache, "no-store");
    assert.ok(init.signal instanceof AbortSignal);
  }
});

test("login is form encoded and refreshes CSRF after success", async t => {
  const calls = mockRequests(t, [token, { status: 204 }, token]);
  assert.equal(await auth.login("example_user", "A+&Password123!"), null);
  assert.equal(calls[1].init.headers["Content-Type"], "application/x-www-form-urlencoded");
  assert.ok(calls[1].init.body instanceof URLSearchParams);
  assert.equal(calls[1].init.body.get("password"), "A+&Password123!");
  assert.ok(calls[2].url.endsWith("/csrf"));
});

test("duplicate signup and invalid credentials have distinct messages", async t => {
  mockRequests(t, [token, { status: 409 }, token, { status: 401 }]);
  await assert.rejects(auth.signup("existing", "ExamplePassword123!"), error => error.status === 409 && /이미 사용/.test(error.message));
  await assert.rejects(auth.login("existing", "wrong"), error => error.status === 401 && /아이디 또는 비밀번호/.test(error.message));
});

test("CSRF session mismatch fails explicitly without resending a mutation", async t => {
  const calls = mockRequests(t, [token, { status: 403 }]);
  await assert.rejects(auth.login("example_user", "ExamplePassword123!"), error => error.status === 403 && /세션이 변경/.test(error.message));
  assert.equal(calls.length, 2);
});

test("me uses the server response, distinguishes anonymous from unavailable", async t => {
  const user = { id: 12, username: "server_user", role: "USER" };
  mockRequests(t, [{ body: user }, { status: 401 }, { status: 500 }]);
  assert.deepEqual(await auth.getCurrentUser(), user);
  assert.equal(await auth.getCurrentUser(), null);
  await assert.rejects(auth.getCurrentUser(), error => error.status === 500);
});

test("logout sends credentials and CSRF then obtains a fresh anonymous token", async t => {
  const calls = mockRequests(t, [token, { status: 204 }, token]);
  assert.equal(await auth.logout(), null);
  assert.ok(calls[1].url.endsWith("/logout"));
  assert.equal(calls[1].init.method, "POST");
  assert.equal(calls[1].init.headers["X-CSRF-TOKEN"], "request-only-token");
  assert.ok(calls[2].url.endsWith("/csrf"));
});

test("a committed login with failed token refresh is a warning, never an automatic retry", async t => {
  const calls = mockRequests(t, [token, { status: 204 }, new Error("offline")]);
  assert.match(await auth.login("example_user", "ExamplePassword123!"), /갱신이 지연/);
  assert.equal(calls.filter(call => call.init.method === "POST").length, 1);
});

test("network failure before mutation does not send credentials", async t => {
  const calls = mockRequests(t, [new Error("offline")]);
  await assert.rejects(auth.signup("example_user", "ExamplePassword123!"), /서버에 연결/);
  assert.equal(calls.length, 1);
});
