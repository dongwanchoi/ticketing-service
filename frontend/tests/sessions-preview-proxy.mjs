// Local read-only bridge for the isolated Spring/MySQL browser preview.
// It never forwards credentials, writes, admin routes or individual seat routes.
import http from "node:http";

const target = new URL(process.env.SESSION_PREVIEW_BACKEND_URL || "http://localhost:9080");
if (!["localhost", "127.0.0.1"].includes(target.hostname)) throw new Error("Preview backend must be local");
const port = Number(process.env.SESSION_PREVIEW_PROXY_PORT || 18081);
const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:3100",
  "Access-Control-Allow-Credentials": "true" };
const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const send = (status, body) => { response.writeHead(status, headers); response.end(body); };
  if (request.method !== "GET") return send(403, "{}");
  if (pathname === "/api/v1/auth/me") return send(401, "{}");
  if (!/^\/api\/v1\/performances(?:\/[1-9]\d*\/(?:sessions|sale-availability))?$/.test(pathname)) return send(403, "{}");
  try {
    const upstream = await fetch(new URL(pathname, target), { signal: AbortSignal.timeout(10_000), redirect: "error" });
    send(upstream.status, await upstream.text());
  } catch {
    send(503, JSON.stringify({ code: "PREVIEW_BACKEND_UNAVAILABLE" }));
  }
});
server.listen(port, "127.0.0.1", () => console.log(`Read-only isolated preview bridge: http://localhost:${port}`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
