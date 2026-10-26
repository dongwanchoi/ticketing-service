// Isolated in-memory backend for browser tests. Never forwards requests to a real API.
import http from "node:http";

const port = Number(process.env.MOCK_BACKEND_PORT || 18080);
const performances = [
  { id: 1, title: "테스트 콘서트", description: "격리된 브라우저 검증용 공연입니다.", category: "CONCERT", ageRating: "ALL" },
  { id: 2, title: "테스트 뮤지컬", description: "검색과 상세 이동을 확인합니다.", category: "MUSICAL", ageRating: "ALL" },
];
let mode = "normal";
const requests = [];
const modes = new Set(["normal", "empty", "error", "slow"]);

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:3100",
    "Access-Control-Allow-Credentials": "true", "Access-Control-Allow-Headers": "Content-Type,X-CSRF-TOKEN",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS" };
  const send = (status, body) => { response.writeHead(status, headers); response.end(JSON.stringify(body)); };
  try {
    if (request.method === "OPTIONS") { response.writeHead(204, headers); response.end(); return; }
    if (url.pathname === "/__test/state") {
      let nextMode = url.searchParams.get("mode");
      if (request.method === "POST") {
        let body = "";
        for await (const chunk of request) {
          body += chunk;
          if (body.length > 1024) return send(413, { error: "Control payload too large" });
        }
        if (body) nextMode = JSON.parse(body).mode;
      }
      if (nextMode !== null) {
        if (!modes.has(nextMode)) return send(400, { error: "Unknown fixture mode" });
        mode = nextMode;
      }
      return send(200, { mode });
    }
    if (url.pathname === "/__test/requests" && request.method === "GET") return send(200, requests);
    requests.push({ method: request.method, path: url.pathname });
    if (request.method !== "GET") return send(403, { error: "This fixture never accepts application mutations" });
    if (url.pathname === "/api/v1/auth/me") return send(401, {});
    if (url.pathname === "/api/v1/performances") {
      const requestMode = mode;
      if (requestMode === "slow") await new Promise(resolve => setTimeout(resolve, 1500));
      if (requestMode === "error") return send(503, { error: "Intentional test failure" });
      return send(200, requestMode === "empty" ? [] : performances);
    }
    const availability = url.pathname.match(/^\/api\/v1\/performances\/([1-9]\d*)\/sale-availability$/);
    if (availability) return send(200, { performanceId: Number(availability[1]), onSale: true });
    return send(404, { error: "Unknown fixture endpoint" });
  } catch {
    if (!response.headersSent) send(400, { error: "Invalid fixture request" });
    else response.end();
  }
});
server.listen(port, "127.0.0.1", () => console.log(`Mock performance backend: http://localhost:${port}`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
