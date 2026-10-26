# Next.js 세션 인증 연동 보고서

작성일: 2026-10-26 (Asia/Seoul)

## 1. 구현 완료·미완료 기능

### 구현 완료

- App Router의 `/signup`, `/login` 화면과 입력 검증·비밀번호 확인을 추가했다.
- 회원가입은 JSON으로 전송하고 완료 화면에서 로그인으로 이동한다. 자동 로그인하지 않는다.
- 로그인은 `application/x-www-form-urlencoded`로 전송하며 성공 후 `/auth/me`에서 실제 세션 사용자를 확인하고 메인 페이지로 이동한다.
- 공통 헤더에 비회원 로그인·회원가입 링크, 인증 사용자명, 로그아웃 버튼을 표시한다.
- 인증 확인 중·비회원·인증됨·확인 실패를 구분한다. 네트워크 오류를 임의로 비회원 상태로 처리하지 않는다.
- 초기 로드·새로고침 및 탭 포커스/표시 복귀 시 서버 인증 상태를 조회한다.
- 변경 요청 전에 CSRF 토큰을 조회하고, 로그인·로그아웃 성공 후 토큰을 다시 받는다.
- 모든 인증 fetch에 `credentials: "include"`, `cache: "no-store"`, 15초 제한을 적용했다.
- 비밀번호·세션 쿠키·CSRF 토큰을 localStorage/sessionStorage에 저장하지 않는다. 비밀번호는 제출 결과 처리 후 입력 상태에서 지운다.
- 제출 ref와 공통 busy 상태로 중복 변경 요청을 차단하고 처리 중 입력/버튼을 비활성화한다.
- 중복 가입, 잘못된 비밀번호, CSRF/세션 변경, 서버·네트워크 오류를 구분해 표시한다. 변경 요청은 자동 재전송하지 않는다.
- 기존 관리자 화면은 `/auth/me` 상태에 맞춰 안내하되 실제 폼은 모든 역할에 비공개로 유지한다. 현재 백엔드도 관리자 업무를 모두 차단하므로 클라이언트 역할만으로 기능을 열지 않는다.
- 기존 공연 목록·검색·카테고리·상세 코드는 유지했다. 기존 페이지별 헤더를 공통 인증 헤더로 옮겼다.

### 미완료·범위 밖

- **실제 개발 DB로 브라우저 회원가입 → 로그인 → 새로고침 → 로그아웃을 연결하는 전체 검증은 미완료다.** `app_user` 테이블이 없어 생성 승인을 요청했으며 이 보고서 작성 시점까지 승인되지 않았다. SQL을 적용하거나 기존 DB에 테스트 사용자를 생성하지 않았다.
- 좌석 선점·예매·결제는 구현하지 않았다.
- ADMIN/SELLER 발급·소유권·관리자 업무는 미구현이다. 이번 프론트 변경으로 접근을 허용하지 않았다.
- 인증 관련 SSR 쿠키 전달이나 Next.js 프록시는 추가하지 않았다. 인증 상태는 브라우저에서 백엔드에 직접 조회한다.

## 2. 생성·수정한 파일

### 생성

| 파일 | 역할 |
| --- | --- |
| `frontend/src/features/auth/api.ts` | 재사용 가능한 인증 API, 쿠키 포함, CSRF 획득/갱신, 오류 분류, 요청 제한 시간 |
| `frontend/src/features/auth/components/AuthProvider.tsx` | 공통 인증 상태, 서버 사용자 확인, 변경 요청 잠금, 오래된 응답 무시, 포커스 복귀 확인 |
| `frontend/src/features/auth/components/AuthControls.tsx` | 헤더 인증 상태·로그아웃·확인 실패 재조회 |
| `frontend/src/features/auth/components/AuthForm.tsx` | 로그인/회원가입 폼, 가입 완료, 입력 검증·중복 요청·실패 처리 |
| `frontend/src/features/auth/components/AdminAccessBoundary.tsx` | 인증 상태에 따른 관리자 안내. 업무 폼은 렌더링하지 않음 |
| `frontend/src/components/SiteHeader.tsx` | 기존 MOMENT 스타일을 활용한 공통 헤더 |
| `frontend/src/app/(auth)/layout.tsx` | 인증 화면 공통 레이아웃 |
| `frontend/src/app/(auth)/signup/page.tsx` | `/signup` 라우트 |
| `frontend/src/app/(auth)/login/page.tsx` | `/login` 라우트 |
| `frontend/src/app/admin/layout.tsx` | 관리자 경로에 접근 안내 적용 |
| `frontend/tests/auth-api.test.mjs` | Node 내장 테스트 러너를 사용하는 API 계약 테스트 8개 |
| `frontend/tests/auth-browser.mjs` | Chrome/Playwright 브라우저 검증. 모의 인증, 실제 백엔드 읽기 검증, 전체 실제 연동 모드 지원 |
| `reports/frontend-auth-report.md` | 이 보고서 |

### 수정

| 파일 | 변경 |
| --- | --- |
| `frontend/src/app/layout.tsx` | AuthProvider·공통 헤더 적용, 문서 언어 ko |
| `frontend/src/app/page.tsx` | 기존 공연 목록·검색·푸터 유지, 중복 헤더만 공통화 |
| `frontend/src/app/performances/[performanceId]/page.tsx` | 기존 상세·판매 상태 표시 유지, 중복 헤더만 공통화 |
| `frontend/package.json` | `test:auth`, `test:auth:browser` 실행 스크립트 추가 |

백엔드 소스·SecurityConfig·CORS·쿠키 설정은 수정하지 않았다. 기존 관련 없는 미커밋 변경은 유지했다. 특히 메인 페이지와 상세 페이지는 작업 시작 당시의 미커밋 구현을 기반으로 헤더를 통합했으며 Git HEAD의 초기 화면으로 되돌리지 않았다.

프로젝트 의존성은 추가하지 않았다. 브라우저 검증 도구만 npm 임시 캐시에 Playwright 1.64.1을 받아 기존 Chrome으로 실행했다. package-lock.json은 변경하지 않았다.

## 3. API 연동 및 세션 처리

| API | 프론트 처리 |
| --- | --- |
| GET `/api/v1/auth/csrf` | 변경 요청 직전에 토큰 조회. 응답 headerName에 token을 실어 전송 |
| POST `/api/v1/auth/signup` | JSON `{username, password}`만 전송. ID·역할은 전송하지 않음 |
| POST `/api/v1/auth/login` | URLSearchParams로 username/password 전송. 성공 후 CSRF 갱신 및 me 확인 |
| GET `/api/v1/auth/me` | 200의 서버 사용자 정보를 표시. 401만 비회원으로 취급하고 통신/서버 오류는 별도 상태로 처리 |
| POST `/api/v1/auth/logout` | CSRF·쿠키를 포함해 요청하고 토큰 재발급, me에서 비회원 확인 |

브라우저 API 주소는 `NEXT_PUBLIC_BACKEND_API_URL`, 기본값은 `http://localhost:8080`이다. 기존 서버 컴포넌트의 공개 공연 조회 주소는 `BACKEND_API_URL`을 그대로 사용한다. 다른 주소로 실행하려면 두 값을 함께 설정하고 Next.js 빌드를 다시 해야 한다.

인증 정보는 React 메모리에만 두며 실제 권한은 백엔드가 판단한다. 로그인·로그아웃 전 시작한 인증 조회의 오래된 응답이 최신 결과를 덮지 않도록 요청 버전을 비교한다. 오류 후에는 서버 상태를 다시 조회해 응답 유실 가능성을 조정한다.

로그인·로그아웃 POST가 성공했는데 후속 CSRF 조회가 실패하면 해당 POST를 다시 보내지 않고 갱신 지연 안내를 표시한다. 다음 변경 요청에서도 먼저 새 CSRF를 조회한다. 403도 자동 재시도하지 않으며 사용자가 다시 요청할 때 새 토큰을 받는다.

기존 정책인 `http://localhost:3000` CORS, HttpOnly·SameSite=Lax 세션 쿠키, local 프로필의 Secure=false를 활용했다. CSRF를 끄거나 Origin을 확대하지 않았다.

## 4. 실제 테스트 실행 결과

### 자동 검사

| 실행 | 결과 |
| --- | --- |
| `frontend`: `node_modules/.bin/tsc.cmd --noEmit` | 통과 |
| `frontend`: `npm.cmd run lint` | 최종 실행 오류 0, 경고 0 |
| `frontend`: `npm.cmd run build` | 통과. Next.js 16.3.8 프로덕션 빌드 및 TypeScript 처리 완료 |
| `frontend`: `node --test tests/auth-api.test.mjs` | 8개 통과, 실패·스킵 0 |
| `backend`: `.\gradlew.bat test --tests com.dongwan.ticketing.auth.AuthIntegrationTest` | MySQL 8.4 Testcontainers 인증 테스트 11개 통과. `BUILD SUCCESSFUL in 32s` |
| `git diff --check` | 공백 오류 없음. 기존 파일의 LF/CRLF 안내만 출력 |

Node v24.22.0에서 TypeScript API 모듈을 직접 읽어 내장 테스트를 실행했다. 모듈 형식 자동 감지 안내 경고가 출력됐으나 테스트는 통과했다. 이를 없애기 위해 기존 package.json의 모듈 체계를 변경하지 않았다.

이번 백엔드 재실행은 인증 테스트만 대상으로 했으며 전체 백엔드 테스트를 재실행한 것은 아니다. 현재 JUnit 근거는 `backend/build/test-results/test/TEST-com.dongwan.ticketing.auth.AuthIntegrationTest.xml`이다. 이전 전체 19개 결과와 이번 인증 11개 결과를 합산하지 않는다.

API 테스트는 모의 fetch로 JSON/폼 형식, credentials, 토큰 헤더, 로그인·로그아웃 후 토큰 갱신, 401/403/409, 네트워크 실패 및 자동 재전송하지 않는 동작을 검증한다. 실제 서버 통합 테스트와 구분해야 한다.

### Chrome 브라우저: 모의 인증 API 13개 체크 통과

실행: `PLAYWRIGHT_MODULE_PATH`를 npm 임시 Playwright 패키지 디렉터리로 설정한 뒤 `node tests/auth-browser.mjs`.

프론트는 실제 프로덕션 빌드의 `http://localhost:3000`, 브라우저는 기존 Chrome headless를 사용했다. 인증 API만 Playwright route로 모의 응답했고 공연 목록·상세 서버 조회는 실제 기존 백엔드를 사용했다.

```text
PASS anonymous public performance page and login header
PASS signup succeeds once on double submit, without automatic login
PASS duplicate account has a specific error
PASS wrong password fails and password field is cleared
PASS CSRF rejection is shown without automatic mutation retry
PASS login confirms me and navigates to main
PASS authentication persists after reload
PASS no auth data in localStorage or sessionStorage
PASS ordinary user cannot see admin mutation form
PASS logout clears authentication, including after reload
PASS public performance detail remains accessible
PASS public list and search remain usable
PASS network errors are distinct from anonymous state, with recovery
{"mode":"mock-auth-api","checks":13}
```

이 모드의 로그인 유지·가입 성공은 실제 MySQL/HttpSession 검증을 의미하지 않는다. 실제 백엔드의 세션 동작은 별도로 Testcontainers 테스트에서 검증했다.

### Chrome 브라우저: 실제 백엔드, 사용자 DB 변경 없는 5개 체크 통과

실행: 같은 브라우저 스크립트에 `AUTH_E2E_READ_ONLY=1`을 설정했다. 이 모드는 모의 인증 응답을 사용하지 않는다.

백엔드를 `local` 프로필 및 `spring.jpa.hibernate.ddl-auto=none`으로 기존 MySQL에 연결해 실행했다. 사용자 테이블을 자동 생성하지 않았다. 익명 세션은 서버 메모리에 생성되지만 DB 사용자 생성/수정은 실행하지 않았다.

```text
PASS real anonymous me response enables login form
PASS real browser CORS/cookies: me 401, protected API 401, missing CSRF 403, token endpoint 200
PASS local HTTP session cookie is HttpOnly, SameSite=Lax, Secure=false
PASS real backend rejects another session's CSRF before attempting login
PASS real backend public performance list and detail remain available
{"mode":"live-backend-no-user-db-writes","checks":5}
```

별도 브라우저 컨텍스트가 발급받은 CSRF 토큰을 현재 세션으로 전송해 실제 로그인 필터 이전에 403이 되는 것을 확인했다. 정상 로그인은 이 모드에 포함되지 않는다.

## 5. 확인된 문제와 미검증 사항

1. **개발 DB의 사용자 테이블 부재:** `information_schema.tables`를 읽기 전용 조회한 결과 현재 DB의 `app_user` 개수는 0이었다. `docs/auth-schema.sql` 적용 승인을 요청했으며 미승인 상태로 SQL을 실행하지 않았다. 따라서 실제 개발 DB에 대한 가입·로그인 전체 흐름을 완료로 판정하지 않는다.
2. **브라우저 전체 실제 연동 미실행:** 준비된 `AUTH_E2E_LIVE=1` 모드는 아직 실행하지 않았다. 이 모드는 실제 가입 계정을 남기므로 승인된 DB 준비 후 실행해야 한다.
3. **관리자 정책 미구현:** 클라이언트 안내는 보안 경계가 아니다. 실제 변경 API 차단은 기존 백엔드가 담당한다. 일반 사용자에게 기존 등록 폼을 제공하지 않는다.
4. **공개 화면의 기존 의존성:** 메인·상세의 서버 fetch는 백엔드 실행이 필요하다. 백엔드가 꺼진 상태의 공개 공연 오류 화면 개선은 이번 범위가 아니다.
5. **운영 환경 미검증:** HTTPS, 운영 Origin, 다른 사이트 간 쿠키, SSR 인증 전달, 다중 서버 세션은 검증하지 않았다. 운영에서는 local 프로필을 사용하면 안 된다.
6. **도구 이슈:** PowerShell npm.ps1 실행 정책 때문에 npm.cmd를 사용했다. 임시 Playwright 최초 다운로드가 제한 환경에서 실패해 승인된 환경에서 실행했다. 최초 브라우저 검증은 로그아웃 후 로그인 링크 2개를 하나로 조회하는 테스트 선택자 오류로 실패했으며, 선택자를 수정한 최종 실행은 통과했다.
7. **기존 보안 과제 유지:** 로그인/가입 rate limit, 계정 복구·비활성화, DB 마이그레이션, 관리자 소유권 정책은 이번에 변경하지 않았다.

### SQL 승인 후 실제 검증 절차

1. 대상 DB와 테이블 부재를 확인하고 승인된 범위에서만 `docs/auth-schema.sql`을 적용한다. 기존 공연 데이터는 변경하지 않는다.
2. 기존 외부 데이터소스 설정을 준비하고 `backend`에서 `.\gradlew.bat bootRun --args='--spring.profiles.active=local --spring.jpa.hibernate.ddl-auto=none'`으로 실행한다. 비밀값은 로그나 보고서에 기록하지 않는다.
3. `frontend`에서 `npm.cmd run build`, `npm.cmd run start -- --hostname localhost`를 실행한다.
4. 다음을 실행한다. 브라우저 테스트용 임시 Playwright 경로는 설치 환경에 맞게 설정한다.

```powershell
# frontend 디렉터리
$env:PLAYWRIGHT_MODULE_PATH = '<임시 설치 경로>\node_modules\playwright'
$env:AUTH_E2E_LIVE = '1'
Remove-Item Env:AUTH_E2E_READ_ONLY -ErrorAction SilentlyContinue
npm.cmd run test:auth:browser
```

이 모드는 `web_<실행 시각>` 아이디 하나를 가입시키고 최종 출력에 아이디를 기록한다. 테스트 계정 자동 삭제는 구현하지 않았다. 삭제가 필요하면 별도 승인 범위에서 처리한다.

수동으로는 가입 성공 후 비회원 헤더 유지 → 동일 아이디 중복 가입 오류 → 틀린 비밀번호 오류 → 정상 로그인 시 메인 이동 및 사용자명 표시 → 새로고침 유지 → 로그아웃 및 새로고침 후 로그인 링크 복귀를 확인한다. DevTools에서 로그인 폼 형식, 요청 Cookie/CSRF 헤더, 세션 쿠키 HttpOnly, 브라우저 저장소 미사용도 확인한다. 비회원 관리자 API 401, CSRF 없는 POST 403, 다른 세션 토큰 403을 함께 확인한다.

## 6. 다음 단계: 좌석 선점 구현 가능 여부

인증 principal의 사용자 ID를 사용하는 백엔드 기반과 프론트 공통 인증 상태/API 구조는 준비됐다. 다만 **기존 개발 DB 스키마 적용과 전체 실제 브라우저 인증 검증이 아직 남아 있으므로 통합 완료 상태는 아니다.**

다음 단계에서 사용할 수 있는 요소는 `useAuth()`의 서버 사용자 상태, `AuthenticatedUser.getId()`, 쿠키 포함 요청 방식이다. 현재 API 도우미는 `/auth` 전용이며 좌석 업무 API는 별도 모듈로 추가해야 한다.

좌석 선점 작업에는 SessionSeat 상태·소유자·만료 모델, 조건부 UPDATE 및 트랜잭션 설계, 선점 API의 명시적인 Security 허용 규칙, 판매 정책 재검증, 회차 독립성·100명 경쟁 MySQL 테스트가 필요하다. 이번에는 이 코드나 API를 추가하지 않았다.

구현 참고 문서: [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components), [Next.js Testing](https://nextjs.org/docs/app/guides/testing). 프로젝트 고유 판정의 근거는 실제 코드·실행 결과이며 외부 문서로 동작 검증을 대체하지 않았다.
