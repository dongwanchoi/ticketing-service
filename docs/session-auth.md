# Session authentication

Backend: Java 21 / Spring Boot 4.1.1 / Boot-managed Spring Security 7.1.1.
No JWT, privileged signup, seat hold, reservation, payment, or frontend screens are included.

## Database and local startup

Apply `docs/auth-schema.sql` once to your configured MySQL database. This task does not
apply schema changes to your existing database. The application does not automatically
create production tables. Username policy is lowercase ASCII letters, digits and underscore
(3–50 characters). Password policy is 12–72 printable non-space ASCII characters, within
BCrypt's 72-byte limit. BCrypt cost is 12. Registration always creates USER.

Configure the existing datasource through `SPRING_DATASOURCE_URL`,
`SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`.
For local HTTP development run from `backend`:

```powershell
.\gradlew.bat bootRun --args='--spring.profiles.active=local'
```

The local profile disables Secure cookies for HTTP. All other profiles default to Secure
cookies; production requires HTTPS. Session cookies are HttpOnly, SameSite=Lax, cookie-only,
with a 30-minute idle timeout. Sessions are held in one backend instance's memory.
Do not enable the local profile in production.

## API contract

| Method | Path | Body / result |
| --- | --- | --- |
| GET | /api/v1/auth/csrf | 200: headerName, parameterName, token; creates anonymous session |
| POST | /api/v1/auth/signup | JSON username/password; 201: id, username, role; does not log in |
| POST | /api/v1/auth/login | application/x-www-form-urlencoded username/password; 204 or 401 |
| GET | /api/v1/auth/me | 200: authenticated id, username, role; anonymous 401 |
| POST | /api/v1/auth/logout | valid CSRF required; 204; invalidates session and deletes cookie |

Signup duplicate username returns 409; invalid input returns 400. Extra identity/role fields
are ignored and cannot grant permissions. Login failure does not disclose whether a username
exists. No password or password hash is returned. Missing/invalid CSRF returns 403, including
on signup/login/logout. Anonymous protected GET returns 401; authenticated forbidden requests
return 403. A missing CSRF token may produce 403 before authentication is checked.

GET `/api/v1/performances` and `/api/v1/performances/{id}/sale-availability` remain public.
Every other route is denied unless explicitly allowed above, including all existing admin,
create, update and delete endpoints. ADMIN/SELLER provisioning, authorization and ownership
remain unimplemented; even a manually assigned privileged authority cannot use these routes.
The existing unapproved-performance visibility policy is unchanged.

## Browser integration (no screen changes)

Only `http://localhost:3000` is allowed by CORS, with credentials. Use `localhost` consistently
for frontend and backend (do not mix it with 127.0.0.1). CSRF is stored server-side; use the
returned masked token in the returned header name. Never read the HttpOnly session cookie.

```javascript
const base = 'http://localhost:8080';
async function csrf() {
  return fetch(`${base}/api/v1/auth/csrf`, { credentials: 'include' }).then(r => r.json());
}
let token = await csrf();
await fetch(`${base}/api/v1/auth/signup`, {
  method: 'POST', credentials: 'include',
  headers: { 'Content-Type': 'application/json', [token.headerName]: token.token },
  body: JSON.stringify({ username: 'example_user', password: 'ExamplePassword123!' })
});
const login = await fetch(`${base}/api/v1/auth/login`, {
  method: 'POST', credentials: 'include',
  headers: { [token.headerName]: token.token },
  body: new URLSearchParams({ username: 'example_user', password: 'ExamplePassword123!' })
});
if (!login.ok) throw new Error('Login failed');
token = await csrf(); // Login rotates session ID and clears the previous CSRF token.
const me = await fetch(`${base}/api/v1/auth/me`, { credentials: 'include' }).then(r => r.json());
await fetch(`${base}/api/v1/auth/logout`, {
  method: 'POST', credentials: 'include', headers: { [token.headerName]: token.token }
});
token = await csrf(); // Obtain a fresh anonymous token before signing in again.
```

For server-rendered Next.js calls, cookies must be explicitly forwarded or use a same-origin
proxy. Browser credentials do not automatically propagate to server-side fetch.

## Verification

```powershell
cd backend
.\gradlew.bat test
```

Requires Docker with Linux containers; integration tests use disposable MySQL 8.4 databases.
AuthIntegrationTest exercises the real security chain, actual CSRF endpoint and BCrypt,
session persistence/fixation/logout, role and identity spoofing, public/denied routes,
CORS, duplicate signup, invalid input and real servlet Set-Cookie attributes.
Existing performance tests disable filters explicitly to retain their controller/business
contracts; they do not demonstrate production permission to register performances.
The application context smoke test now also uses Testcontainers instead of an external DB.

Verified on 2026-10-26: `gradlew.bat test` completed successfully with MySQL 8.4
Testcontainers: 19 tests passed (11 authentication, 5 performance controller,
2 performance integration, 1 application context), zero failures/skips.
The HTTP test also exercises signup, session cookie rotation, authenticated identity lookup,
logout, and rejection of the invalidated cookie. Browser UI integration was not exercised.

Remaining production work: login/signup rate limiting, account recovery and verification,
privileged-account lifecycle and ownership checks, migration tooling, configured production
origin, HTTPS deployment and session storage strategy if multiple backend instances are used.
