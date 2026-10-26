# 세션 인증 구현 보고서

작성일: 2026-10-26 (Asia/Seoul)

## 근거와 범위

현재 소스, `git diff`, 이전 작업의 실제 Gradle 실행 출력, 현재 보관된 JUnit XML을 확인해 작성했다. 이번 보고서 작성에서는 테스트를 재실행하지 않았으며, 애플리케이션 코드·설정·DB를 변경하지 않았다.

경로는 프로젝트 루트 기준이다. Java 소스 기본 경로는 `backend/src/main/java/com/dongwan/ticketing/`, 테스트 기본 경로는 `backend/src/test/java/com/dongwan/ticketing/`이다.

확인한 구성은 Java 21, Spring Boot 4.1.1, Gradle Wrapper 9.7.1이다. 이전 `dependencyInsight --dependency spring-security-core --configuration runtimeClasspath` 실행 결과에서 Boot가 선택한 Spring Security 7.1.1을 확인했다. Security 버전을 별도로 고정하지 않았다.

## 1. 구현 완료·미완료 기능

### 구현 완료

| 기능 | 동작과 근거 |
| --- | --- |
| 회원가입 | `AuthController.signup()` → `AuthService.signup()`에서 검증 후 사용자 저장. 성공 201, 중복 사용자명 409, 잘못된 입력 400 |
| 비밀번호 해시 | `BCryptPasswordEncoder(12)` 사용. 저장된 해시가 평문과 다르고 원문과 매칭되는 것을 MySQL 테스트에서 확인 |
| USER 권한 제한 | `AppUser` 생성자가 역할을 `USER`로 고정. 가입 DTO에는 ID·역할 입력 항목이 없음. 추가로 전달한 ID·ADMIN 역할이 적용되지 않는 테스트 통과 |
| 로그인 | Spring Security 표준 폼 로그인 필터 사용. 성공 204, 잘못된 비밀번호 401. JSON 로그인은 구현하지 않음 |
| 세션 인증 유지 | 이후 요청의 인증 principal에서 ID·사용자명·역할 조회. 실제 HTTP 쿠키 왕복 테스트 통과 |
| 세션 고정 공격 방어 | `sessionFixation().changeSessionId()` 설정. 로그인 전후 세션 ID와 실제 응답 쿠키 변경 확인 |
| 로그아웃 | 세션 무효화, 인증 제거, `JSESSIONID` 삭제 설정. 이전 세션 쿠키로 내 정보 조회 시 401 확인 |
| CSRF 보호 | 전역 비활성화하지 않고 기본 보호 사용. 토큰 조회 API 제공. 가입·로그인·로그아웃의 토큰 누락 및 다른 세션 토큰 거부 확인 |
| 공개 조회 유지 | 공연 목록 및 판매 가능 여부 GET의 비회원 200 확인 |
| 미완성 권한 기능 차단 | 명시적으로 허용한 경로 외에는 `denyAll()`. 기존 관리자·등록·수정·삭제 API를 열지 않음 |
| 개발 CORS | `http://localhost:3000`만 허용하고 쿠키 자격 증명 허용. 허용·차단 Origin의 preflight 테스트 통과 |
| 쿠키 설정 | HttpOnly, SameSite=Lax, 기본 Secure, cookie-only 세션 추적, 30분 유휴 만료 설정. 실제 서버의 Set-Cookie에서 HttpOnly·Secure·SameSite=Lax 확인 |

회원가입은 자동 로그인하지 않는다. 인증 실패 응답은 사용자 존재 여부를 구분하지 않는 `INVALID_CREDENTIALS` 코드다. CSRF 필터가 먼저 거부하면 비회원 상태 변경 요청도 401이 아닌 403이 될 수 있다.

### 미완료 또는 이번 범위 밖

- ADMIN/SELLER 발급·승격, 역할별 업무 권한 및 판매자 소유권 정책. 현재 관리자 기능은 일반 사용자뿐 아니라 테스트에서 주입한 ADMIN/SELLER에게도 차단된다.
- 관리자 검수·승인 여부에 따른 공개 공연 필터링. 이번 인증 작업에서 공연 공개 비즈니스 정책은 변경하지 않았다.
- 좌석 선점, 예매, 모의 결제, 인증 프론트 화면.
- 로그인·가입 시도 횟수 제한, 계정 복구·인증·잠금·비활성화 흐름.
- 다중 서버용 공유 세션 저장소, 운영 배포 및 DB 마이그레이션 도구.
- 기존 개발 DB에 새 사용자 테이블 적용. SQL 파일만 제공했으며 기존 DB에는 실행하지 않았다.

## 2. 변경한 파일과 주요 코드

아래는 이전 인증 구현 작업에서 추가·변경한 파일이다. 이번 요청에서 새로 작성한 파일은 이 보고서뿐이다.

| 파일 | 주요 내용 |
| --- | --- |
| `backend/build.gradle` | Security starter 및 `spring-security-test` 추가 |
| Java `auth/domain/AppUser.java` | `app_user` 엔티티, 자동 생성 ID, 유일 사용자명, 비밀번호 해시, USER 기본 역할 |
| Java `auth/repository/AppUserRepository.java` | 사용자명 기반 조회 |
| Java `auth/security/AuthenticatedUser.java` | Spring Security User 확장. DB 사용자 ID·역할을 principal에 보관 |
| Java `auth/service/AuthService.java` | 트랜잭션 안에서 비밀번호 인코딩 및 `saveAndFlush()`, 무결성 예외를 409로 변환 |
| Java `auth/web/AuthController.java` | 회원가입·내 정보·CSRF API와 입력/출력 DTO |
| Java `config/SecurityConfig.java` | 비밀번호 인코더, DB UserDetailsService, 인증 필터 체인, 세션 ID 교체, CSRF, 로그인·로그아웃, JSON 401/403 응답 |
| Java `config/WebConfig.java` | 허용 헤더를 Content-Type·X-CSRF-TOKEN으로 제한, `allowCredentials(true)` 추가 |
| `backend/src/main/resources/application.yaml` | 세션·쿠키 설정. Secure 기본값은 true이며 환경변수로 설정 가능 |
| `backend/src/main/resources/application-local.yaml` | 로컬 HTTP용 Secure=false |
| 테스트 `auth/AuthIntegrationTest.java` | 실제 보안 필터, MySQL, MockMvc 및 실제 HTTP 서버를 통한 11개 인증 테스트 |
| 테스트 `TicketingApplicationTests.java` | 컨텍스트 테스트 DB를 MySQL Testcontainers로 격리 |
| 테스트 `performance/PerformanceIntegrationTest.java` | 기존 공연 비즈니스 테스트에서 필터 제외 명시 |
| 테스트 `performance/controller/PerformanceControllerTest.java` | 기존 컨트롤러 계약 테스트에서 필터 제외 명시 |
| `docs/auth-schema.sql` | 새 사용자 테이블 수동 생성 SQL |
| `docs/session-auth.md` | API 계약, DB 준비, 실행, 브라우저 연동 및 테스트 설명 |

주요 코드의 동작은 다음과 같다.

```java
// SecurityConfig: 비밀번호 인코더
new BCryptPasswordEncoder(12);

// AuthService.signup: 평문 대신 해시를 저장
users.saveAndFlush(new AppUser(username, encoder.encode(password)));

// AppUser 생성자: 요청으로 역할을 선택할 수 없음
this.role = "USER";

// AuthController.me: 요청 userId가 아니라 인증 principal을 사용
return new UserResponse(user.getId(), user.getUsername(), user.getRole());
```

SecurityConfig는 명시된 공개 API와 인증 상태 조회를 제외한 요청을 `anyRequest().denyAll()`로 막는다. 예외는 내부 `DispatcherType.ERROR` 디스패치 허용이며, 일반 요청의 관리자 접근 허용 규칙은 아니다. 로그인·로그아웃은 컨트롤러 대신 Security 필터가 처리한다.

기존 공연·회차·좌석·판매 도메인/서비스는 이번 인증 작업에서 수정하지 않았다. 작업 시작 전부터 존재한 `frontend/src/app/page.tsx`, 공개 공연 컨트롤러 및 프론트 관련 미추적 파일 등은 인증 작업 변경 목록에 포함하지 않았다.

## 3. 실제 테스트 실행 결과

### 실행 명령과 최종 결과

작업 디렉터리: `C:\dev\ticketing-service\backend`

```powershell
.\gradlew.bat test
```

이전 인증 구현 작업의 최종 실행 출력:

```text
BUILD SUCCESSFUL in 45s
4 actionable tasks: 3 executed, 1 up-to-date
```

Java 21, Docker Linux 엔진, Testcontainers의 `mysql:8.4`를 사용했다. 인증 테스트는 임의 포트의 실제 Spring Boot 서버와 MockMvc를 함께 사용한다. 테스트 DB는 `@ServiceConnection`으로 연결하며 인증 테스트의 테이블은 Hibernate `ddl-auto=create`로 생성한다.

현재 보관된 XML의 합계는 **19개 실행, 실패 0, 오류 0, 스킵 0**이다.

| 테스트 클래스 | 개수 | XML 기록 시작 시각 (UTC) | 근거 파일 |
| --- | ---: | --- | --- |
| AuthIntegrationTest | 11 | 2026-10-26 11:38:35.505 | `backend/build/test-results/test/TEST-com.dongwan.ticketing.auth.AuthIntegrationTest.xml` |
| PerformanceControllerTest | 5 | 2026-10-26 11:39:00.100 | `backend/build/test-results/test/TEST-com.dongwan.ticketing.performance.controller.PerformanceControllerTest.xml` |
| PerformanceIntegrationTest | 2 | 2026-10-26 11:38:49.975 | `backend/build/test-results/test/TEST-com.dongwan.ticketing.performance.PerformanceIntegrationTest.xml` |
| TicketingApplicationTests | 1 | 2026-10-26 11:38:20.037 | `backend/build/test-results/test/TEST-com.dongwan.ticketing.TicketingApplicationTests.xml` |

실행 결과 HTML: `backend/build/reports/tests/test/index.html`. XML/HTML은 빌드 산출물이므로 후속 실행이나 clean으로 갱신 또는 삭제될 수 있다.

### 인증 테스트의 실제 검증 항목

| 메서드 | 검증 결과 |
| --- | --- |
| `signupHashesPasswordAndIgnoresClaimedIdentityAndRole` | DB 저장 해시 검증, USER 고정, 위조 ID 무시, 해시 비공개 확인 |
| `loginPersistsIdentityRotatesSessionAndLogoutInvalidatesIt` | 세션 유지, ID 교체, 실제 사용자 식별, 이전 CSRF 거부, 로그아웃 무효화 확인 |
| `badPasswordDoesNotAuthenticate` | 잘못된 비밀번호 401 및 이후에도 비회원 상태임을 확인 |
| `userCannotAccessAdminOrMutateBusinessData` | USER의 관리자 GET·등록 POST에 403 반환 확인 |
| `anonymousAccessAndCsrfBoundaries` | 비회원 보호 GET 거부, 공개 GET 허용, CSRF 없는 인증 변경 API 거부 확인 |
| `duplicateUsernameAndInvalidInput` | 중복 사용자명 409, 짧은 비밀번호 400 확인 |
| `corsOnlyAllowsConfiguredFrontendWithCredentials` | localhost preflight 허용과 자격 증명 헤더, 외부 Origin 거부 확인 |
| `realServerIssuesSecureHttpOnlySameSiteSessionCookie` | 실제 서버의 Set-Cookie 속성 확인 |
| `csrfCannotBeTransferredAcrossSessionsAndAuthenticatedWritesStillRequireIt` | 다른 세션의 토큰 거부, 로그인 후 토큰 없는 로그아웃 거부 확인 |
| `evenClaimedPrivilegedAuthorityCannotBypassUnimplementedAdminPolicy` | 테스트로 주입한 ADMIN/SELLER도 관리자 API 거부, X-User-Id/X-Role로 인증되지 않음 확인 |
| `realHttpLoginCookieRoundTripAndLogout` | 실제 HTTP에서 가입→로그인→쿠키 교체→me→로그아웃→이전 쿠키 401 확인 |

### 검증 한계·미실행

- 기존 공연 테스트 7개는 `addFilters=false`이므로 보안 검증 근거가 아니다. 보안 필터를 켠 인증 통합 테스트의 결과와 구분해야 한다.
- 모든 기존 수정·삭제 URL을 개별 호출한 것은 아니다. 전체 차단은 필터 설정에 근거하며 대표 관리자 GET·POST는 테스트로 확인했다.
- 실제 HTTP 테스트는 Cookie 헤더를 직접 전달했다. 브라우저의 Secure/SameSite 적용, Next.js 화면, 로컬 프로필의 브라우저 로그인은 검증하지 않았다.
- 운영 HTTPS·프록시·다중 인스턴스·30분 경과 세션 만료·부하/공격 대응 테스트는 수행하지 않았다.
- `docs/auth-schema.sql`을 실제 기존 DB에 적용하거나 해당 SQL로 만든 스키마와의 통합 테스트는 수행하지 않았다. 테스트는 JPA 생성 스키마를 사용했다.
- 초기 Gradle 실행은 캐시 경로 접근 제한으로 실패했다. 승인된 샌드박스 밖 실행에서 의존성 확인과 최종 테스트가 성공했다. 초기 샌드박스 Docker 확인도 실패했으나, 승인된 실행에서 Linux 엔진을 확인하고 MySQL 테스트를 실행했다.

## 4. 보안상 문제와 남은 과제

다음은 확인된 미구현 사항과 검증 한계이며, 침투 테스트를 통한 취약점 발견 목록은 아니다.

1. **권한 기능은 차단 상태다.** ADMIN/SELLER 및 소유권 정책 구현 전 관리자 업무는 사용할 수 없다. 수동 SQL도 `CHECK (role = 'USER')`로 다른 역할을 금지하므로 향후 역할 도입 시 스키마 변경이 필요하다. JPA 엔티티에는 이 CHECK 선언이 없어 테스트 생성 스키마와 수동 SQL의 제약이 동일하지 않다.
2. **가입·로그인 요청 제한이 없다.** 현재 BCrypt 비용은 12지만 요청 횟수 제한이나 계정 잠금 정책은 구현하지 않았다.
3. **운영 쿠키 설정을 점검해야 한다.** 기본 Secure=true이나 `local` 프로필 또는 `SESSION_COOKIE_SECURE`로 변경 가능하다. 운영 HTTPS와 실제 배포 설정은 검증하지 않았다.
4. **CORS는 개발 Origin으로 고정되어 있다.** 운영 Origin 변경이 필요하며 localhost와 127.0.0.1을 섞는 개발 연동은 지원 설정에 포함하지 않았다.
5. **세션 공유 구성이 없다.** 서버 재시작·다중 서버 세션 연속성 및 사용자 강제 로그아웃 정책은 미구현이다.
6. **계정 수명주기가 없다.** 탈퇴·비밀번호 변경/복구·계정 비활성화 및 기존 세션 회수 정책이 필요하다.
7. **오류 분류가 제한적이다.** AuthService는 모든 `DataIntegrityViolationException`을 사용자명 충돌 409로 변환한다. 실제 원인이 다른 DB 제약 오류인 경우에도 같은 응답이 된다. 오류 원인별 분류는 미구현이다.
8. **공개 공연 승인 정책은 그대로다.** 인증 도입만으로 검수 전 공연의 공개가 차단되지는 않는다.
9. **자동 마이그레이션이 없다.** 수동 SQL은 `CREATE TABLE`이며 반복 적용용 스크립트가 아니다. 기존 테이블 존재 여부와 스키마를 확인한 후 적용해야 한다.

## 5. 다음 작업에 필요한 정보

### API 계약

| 메서드·경로 | 요청·결과 |
| --- | --- |
| GET `/api/v1/auth/csrf` | `{headerName, parameterName, token}` 반환 |
| POST `/api/v1/auth/signup` | JSON `{username, password}`. 성공 201 `{id, username, role}`. 자동 로그인 없음 |
| POST `/api/v1/auth/login` | `application/x-www-form-urlencoded`의 username/password. 성공 204, 실패 401 |
| GET `/api/v1/auth/me` | 인증 사용자 `{id, username, role}`. 비회원 401 |
| POST `/api/v1/auth/logout` | CSRF 헤더 필요. 성공 204 |

사용자명은 소문자 영문·숫자·밑줄 3–50자다. 비밀번호는 공백을 제외한 출력 가능한 ASCII 12–72자다. 비밀번호를 trim하지 않으며 Unicode 비밀번호는 현재 허용하지 않는다.

프론트는 `credentials: 'include'`를 사용하고 CSRF 응답의 `headerName`에 `token`을 넣는다. 로그인 성공 후 및 로그아웃 후 토큰을 다시 받아야 한다. 세션 쿠키는 HttpOnly이므로 JavaScript에서 읽지 않는다. Next.js 서버 측 fetch의 쿠키 전달은 별도로 구현해야 한다.

### DB·실행 준비

- 대상 DB를 확인하고 `docs/auth-schema.sql` 적용 절차를 수행한다. 이번 작업은 기존 DB 적용을 완료하지 않았다.
- 데이터소스는 `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` 등 외부 설정으로 준비한다. 실제 값은 보고서에 기록하지 않는다.
- 로컬 HTTP는 `backend`에서 `.\gradlew.bat bootRun --args='--spring.profiles.active=local'`로 실행한다.
- 테스트 재현은 Docker Linux 엔진 실행 후 `backend`에서 `.\gradlew.bat test`다.
- 상세 연동 예제는 `docs/session-auth.md`에 있다.

### 후속 구현 시 유지할 조건

- 일반 가입으로 USER 외 권한을 만들지 않는다.
- 업무 코드의 사용자 식별은 `AuthenticatedUser.getId()`를 사용하고 요청의 userId·role은 신뢰하지 않는다.
- 새 업무 API는 현재 기본 차단되므로 구현 시 명시적인 접근 규칙과 CSRF·소유권 테스트를 함께 추가한다.
- 권한 정책이 없는 상태에서 기존 관리자 API를 먼저 개방하지 않는다.
- 기존 미커밋 공개 공연·프론트 변경을 인증 구현과 구분해 보존한다.

핵심 학습 원리: 세션 인증은 서버가 보관한 SecurityContext/principal을 신뢰하는 구조이며, CSRF 토큰은 별도로 요청의 정당성을 검사한다. 로그인 상태라는 이유만으로 CSRF 검사나 업무 소유권 검사가 대체되지는 않는다.
