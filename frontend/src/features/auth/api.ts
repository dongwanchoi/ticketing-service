export type AuthUser = { id: number; username: string; role: string };
type CsrfToken = { headerName: string; token: string };

export class AuthApiError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

const baseUrl = (process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

async function request(path: string, init: RequestInit = {}) {
  try {
    return await fetch(`${baseUrl}/api/v1/auth/${path}`, {
      ...init,
      credentials: "include",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new AuthApiError("서버에 연결할 수 없습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.");
  }
}

async function csrf(): Promise<CsrfToken> {
  const response = await request("csrf");
  if (!response.ok) throw new AuthApiError("요청 보안 정보를 받지 못했습니다. 잠시 후 다시 시도해 주세요.", response.status);
  return response.json();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await request("me");
  if (response.status === 401) return null;
  if (!response.ok) throw new AuthApiError("로그인 상태를 확인하지 못했습니다. 다시 확인해 주세요.", response.status);
  return response.json();
}

async function mutate(path: "signup" | "login" | "logout", body?: BodyInit, contentType?: string) {
  // Tokens stay in this request's memory, never in browser storage or URLs.
  const token = await csrf();
  const response = await request(path, {
    method: "POST",
    headers: {
      [token.headerName]: token.token,
      ...(contentType ? { "Content-Type": contentType } : {}),
    },
    body,
  });
  if (response.ok) return;
  if (response.status === 403) {
    throw new AuthApiError("보안 정보가 만료되었거나 세션이 변경되었습니다. 다시 시도해 주세요.", 403);
  }
  if (path === "login" && response.status === 401) {
    throw new AuthApiError("아이디 또는 비밀번호가 올바르지 않습니다.", 401);
  }
  if (path === "signup" && response.status === 409) {
    throw new AuthApiError("이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요.", 409);
  }
  if (response.status === 400) {
    throw new AuthApiError("아이디와 비밀번호 입력 조건을 확인해 주세요.", 400);
  }
  throw new AuthApiError("요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.", response.status);
}

export function signup(username: string, password: string) {
  return mutate("signup", JSON.stringify({ username, password }), "application/json");
}

async function refreshCsrfAfterChange(): Promise<string | null> {
  try {
    await csrf();
    return null;
  } catch {
    // The mutation already succeeded: never retry it automatically or report it as rejected.
    return "로그인 보안 정보 갱신이 지연되고 있습니다. 다음 요청에서 다시 확인합니다.";
  }
}

export async function login(username: string, password: string) {
  await mutate("login", new URLSearchParams({ username, password }), "application/x-www-form-urlencoded");
  return refreshCsrfAfterChange();
}

export async function logout() {
  await mutate("logout");
  return refreshCsrfAfterChange();
}
