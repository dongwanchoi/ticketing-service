# 현재 DB 및 JPA 도메인 분석 — 1차

분석일: 2026-10-28 (Asia/Seoul). 기준: `dev`, `00a07d7db796e86e3f22f46d8d5bb9e0aa3d11ca`.

## 증거 범위와 제한

- **소스 확인**: 아래 JPA 매핑·서비스·API·테스트 및 저장소 SQL을 정적으로 읽었다.
- **실제 DB 후속 확인 완료(2026-10-28)**: Docker 설정/엔진 접근 거부는 유지되지만 설치된 mysql.exe로 Compose의 `127.0.0.1:3307`에 직접 접속했다. `infra/.env` 값을 프로세스 환경변수로만 전달하고 출력하지 않았다. 아래 「실제 MySQL 후속 검증」이 기존 미확인 판정보다 우선한다.
- actual DB는 `ticketing_service`, MySQL 8.4.11이다. metadata와 비식별 집계만 조회했다. Docker inspect는 불가능하여 접속 서버와 `ticketing-mysql` 컨테이너의 런타임 연결은 별도로 입증하지 못했다. Compose 설정의 DB·포트와 일치하는 로컬 서버를 검증한 결과다.
- DB 생성·변경·삭제·초기화, 서버 시작, seed 및 자동 테스트 실행 없음. 비밀정보·회원 행·비밀번호 해시는 수집하지 않았다.

## 우선 확인한 문서

- [루트 운영 규칙](../../AGENTS.md), [프로젝트 가이드](../../TICKETING_PROJECT_GUIDE.md).
- [인증 설계](../session-auth.md), [회원 수동 DDL](../auth-schema.sql).
- [인증 보고](../../reports/auth-report.md), [프런트 인증 보고](../../reports/frontend-auth-report.md), [기존 시드 실행 기록](../../scripts/README.md).
- 가이드는 Venue→Seat, 회차별 SessionSeat, 공연당 판매 정책 최대 1건, Buyer/Seller/Admin 및 검수, 모의 결제와 중복 예매 방지를 요구한다. 동시성 방식·선점 표현은 현황 확인 후 결정하도록 유보했다. 이번 분석에서 새 ERD를 확정하지 않았다.
- 인증 문서에는 공개 회차 API 추가 전 내용이 남아 있다. 현재 접근 제어 판단은 `SecurityConfig.java`를 우선한다.

## JPA 엔티티 전체 목록

경로 약칭: `P = backend/src/main/java/com/dongwan/ticketing/performance`, `A = backend/src/main/java/com/dongwan/ticketing/auth`.
전체 `@Entity` 검색 결과 7개. 모두 `Long id`, `@Id`, `@GeneratedValue(IDENTITY)`를 사용한다.
SQL 타입은 실측하지 않았으며 Java 타입만 아래에 기록한다. `@Table` 미지정 엔티티의 테이블명 및 camelCase 필드의 물리 컬럼명은 런타임 naming strategy와 DDL 확인이 필요하다.

| 엔티티 / 테이블 선언 | 전체 비-PK 필드와 Java 타입 | 명시한 null/길이 제약 |
|---|---|---|
| `A/domain/AppUser.java` / `app_user` 명시 | username:String, passwordHash:String, role:String | 모두 NOT NULL, 각각 길이 50/100/20; username unique |
| `P/domain/Performance.java` / 미지정 | title:String, description:String, category:Category, ageRating:AgeRating | title/category/ageRating NOT NULL; description nullable; 길이 명시 없음 |
| `P/domain/PerformanceSession.java` / 미지정 | performance:Performance, venue:Venue, startsAt:LocalDateTime | 두 join 및 startsAt NOT NULL |
| `P/domain/Venue.java` / 미지정 | name:String, address:String | 모두 NOT NULL, 길이 명시 없음 |
| `P/domain/Seat.java` / `seat` 명시 | venue:Venue, section:String, rowLabel:String, seatNumber:Integer | 모두 NOT NULL, 문자열 길이 미지정 |
| `P/domain/SessionSeat.java` / `session_seat` 명시 | performanceSession:PerformanceSession, seat:Seat, price:BigDecimal | 모두 NOT NULL; price precision/scale 미지정 |
| `P/domain/PerformanceSale.java` / 미지정 | performance:Performance, salesStartAt:LocalDateTime, salesEndAt:LocalDateTime, status:SaleStatus | performance join NOT NULL/unique; 두 시각 및 status는 nullable=false 선언 없음 |

문자열 길이를 명시하지 않은 일반 `@Column`은 JPA 기본 length 255지만, 실제 DB 길이를 확인한 것은 아니다. enum은 모두 STRING 매핑이다. DB가 varchar인지 native enum인지, 시간 정밀도 및 BigDecimal SQL 정밀도는 단정하지 않는다.

| enum | 소스 값 |
|---|---|
| Category | MUSICAL, PLAY, CONCERT |
| AgeRating | ALL, ADULT |
| SaleStatus | PREPARING, OPEN, CLOSED |

## 연관관계 및 무결성 선언

모든 관계는 자식→부모 단방향 LAZY이며 역방향 컬렉션, cascade 및 orphanRemoval 선언이 없다.

| 소유 엔티티 | 대상 / cardinality | JoinColumn |
|---|---|---|
| PerformanceSession | Performance N:1 | performance_id NOT NULL |
| PerformanceSession | Venue N:1 | venue_id NOT NULL |
| Seat | Venue N:1 | venue_id NOT NULL |
| SessionSeat | PerformanceSession N:1 | performance_session_id NOT NULL |
| SessionSeat | Seat N:1 | seat_id NOT NULL |
| PerformanceSale | Performance 1:1 | performance_id NOT NULL UNIQUE |

- `Seat`: `uk_seat_venue_position(venue_id, section, row_label, seat_number)`.
- `SessionSeat`: `uk_session_seat(performance_session_id, seat_id)`.
- `AppUser.username`: 단일 unique. `PerformanceSale.performance_id`: 단일 unique. FK 이름, 참조 동작 및 별도 `@Index`는 선언하지 않았다.
- Sale unique는 공연당 **최대 1건**을 표현한다. 모든 공연에 판매 정책이 반드시 존재한다는 의미는 아니다.
- 관계 선언은 JPA 의도이며 실제 DB FK 존재를 증명하지 않는다. 이 복합 unique는 회차 좌석 등록 중복 방지 의도이지 선점·확정 예매 중복 방지 구현이 아니다.

## 저장소 DDL과 과거 DB 증거

`docs/auth-schema.sql`의 정의만 확인했다. 실행하지 않았다.

| 컬럼/제약 | 저장소 DDL 내용 |
|---|---|
| id | BIGINT NOT NULL AUTO_INCREMENT, PRIMARY KEY |
| username | VARCHAR(50), CHARACTER SET ascii, COLLATE ascii_bin, NOT NULL |
| password_hash | VARCHAR(100) NOT NULL |
| role | VARCHAR(20) NOT NULL |
| uk_app_user_username | UNIQUE(username) |
| ck_app_user_role | CHECK(role = 'USER') |
| 엔진 | InnoDB |

이 DDL의 ascii/ascii_bin 및 CHECK는 AppUser 매핑에 없다. 후속 실측에서 실제 DB에도 해당 collation과 CHECK가 적용됨을 확인했다. 따라서 실제 DB가 JPA 선언보다 강한 조건을 갖는다.

`reports/frontend-auth-report.md`는 과거 app_user 부재를, `scripts/README.md`는 2026-10-26 실행 후 7개 테이블과 app_user 존재를 보고한다. 시점이 다른 기록으로 현재 상태를 대체할 수 없다. 후자의 기록은 performance 23, performance_session 49, performance_sale 22, venue 8, seat 72, session_seat 480, app_user 1이며 **이번 실행의 조회 결과가 아니다**. 현재 MySQL 버전도 미확인이다. Compose의 `mysql:8.4`, 컨테이너명 `ticketing-mysql`, host port 3307은 설정 사실만 확인했다.

## 상태·시각·삭제·이력

| 대상 | 소스에서 확인한 상태/시각 | 없는 표현 또는 미확인 |
|---|---|---|
| 회원 | role 문자열, 생성자는 USER로 고정 | 회원 상태·가입/수정/탈퇴 시각, 역할 이력·판매자 관계 없음 |
| 공연 | category, ageRating | 소유 판매자·검수/공개 상태·검수 시각/이력 없음 |
| 회차 | startsAt(LocalDateTime) | 종료 시각·취소 상태·이력 없음 |
| 판매 정책 | PREPARING/OPEN/CLOSED, salesStartAt/salesEndAt | 상태 전이 이력·버전 없음 |
| 회차 좌석 | price만 관리 | AVAILABLE/HELD/CONFIRMED, 선점 소유자·만료·확정 정보 없음 |
| 모든 엔티티 | IDENTITY ID | createdAt/updatedAt/deletedAt, @Version, JPA 감사 callback/리스너 없음 |
| 선점/예매/결제 | 해당 엔티티·서비스·API 없음 | 실제 DB에 대응 테이블이 없는지는 미확인 |

`PerformanceService.delete`, `PerformanceSessionService.delete`, `SessionSeatService.delete`는 repository 물리 삭제를 호출한다. 논리 삭제나 자식 처리 정책은 없다. 실제 DB FK 동작·트리거·감사 테이블은 미확인이다. 애플리케이션 기본 로그를 불변 감사 이력으로 보지 않는다.

판매 기간 짝·순서는 `PerformanceSaleService.validateSalePeriod`에서 확인한다. `PerformanceSale.isOnSaleAt`는 OPEN이며 양 끝 null이면 true, 기간이 있으면 시작 포함/종료 제외다. 상태·기간 검증이 엔티티 생성자/수정 메서드 자체에는 없어 HTTP 밖 경로와 비정상 기존 데이터까지 보장하지 않는다. 현재 코드 동작과 별개로 기간 미설정 정책은 가이드에서 명시 결정이 유보되어 있다.

판매 판정은 `LocalDateTime.now(Asia/Seoul)`을 사용하고 회차도 offset 없는 LocalDateTime이다. 프런트 `PerformanceSessions.tsx`는 한국 현지 시각으로 표시한다. DB 세션 timezone·서버 timezone·저장 정밀도는 미확인이다. 인증 세션 30분 만료는 좌석 선점 만료와 별개이며 DB 선점 구조가 아니다.

## API·서비스·DB 의존관계

컨트롤러와 서비스는 `P/controller`, `P/service` 및 `A/web`, `A/service`, repository는 각 하위 `repository/`에서 확인했다.

| 기능 | 호출 및 영속 의존 | 현재 접근 경계/재설계 영향 |
|---|---|---|
| 회원 가입·로그인·me·로그아웃·CSRF | AuthController/AuthService, SecurityConfig → AppUserRepository | HTTP 세션·BCrypt; 회원 ID/역할 변경 시 principal 및 DTO 영향 |
| 공개 공연 목록 | PerformancePublicController → PerformanceService → PerformanceRepository | 목록 전체 조회, 검수 필터 없음 |
| 공개 회차 요약 | PerformanceSessionPublicController → PublicPerformanceSessionService → PerformanceSessionRepository | 공연 존재 확인, SessionSeat LEFT JOIN으로 min/max/count, startsAt/id 정렬 |
| 판매 가능 | PerformanceSalePublicController → PerformanceSaleService → PerformanceSaleRepository | 없으면 false, 기간/OPEN 판정; 검수·선점 재검증은 없음 |
| 공연 CRUD | PerformanceController → PerformanceService → PerformanceRepository | admin 경로는 현재 denyAll; 소스 CRUD 존재와 운영 허용을 구분 |
| 회차 CRUD | PerformanceSessionController → PerformanceSessionService → 공연/회차/공연장 repository | 공연 소속 확인, 회차 시작 시각 수정/물리 삭제 |
| 공연장·물리 좌석 | VenueController/SeatController → VenueService/SeatService → Venue/Seat repository | 현재 denyAll; 물리 좌석 고유성 영향 |
| 회차별 좌석·가격 | SessionSeatController → SessionSeatService → 회차/Seat/SessionSeat repository | 공연·회차 소속과 같은 공연장 검사; 현재 denyAll |

정확한 허용 목록은 `config/SecurityConfig.java`: 공개 GET 목록·회차요약·판매가능, 인증 경로와 authenticated me 외 나머지 denyAll. 로그인만으로 개별 좌석 API가 허용되는 것은 아니다. Seller/Admin provisioning과 소유권은 미구현이다.

현재 `findPublicSummaries`의 remainingSeatCount는 **등록 SessionSeat 전체 개수**다. 가용/선점/판매완료 상태 필터가 없다. 잔여 재고의 실시간 보장이 아니다. 가격도 모든 등록 좌석의 min/max다.

프런트 `app/page.tsx`는 목록, `app/performances/[performanceId]/page.tsx`는 목록에서 상세 탐색 + 판매 가능, `features/performance/components/PerformanceSessions.tsx`는 회차요약에 의존한다. 따라서 공개 DTO의 sessionId/startsAt/minPrice/maxPrice/remainingSeatCount 의미 변경 시 UI와 브라우저 fixture를 함께 검토해야 한다. 인증 API·AuthProvider 및 관리자 폼도 권한 도입 시 영향받는다.

## 테스트와 스키마의 관계

이번에는 테스트 소스만 조사했으며 실행하지 않았다. 이전 성공 기록을 현재 실행 결과로 재사용하지 않는다.

| 테스트 | 환경/확인 대상 | 보장하지 않는 것 |
|---|---|---|
| AuthIntegrationTest | MySQL Testcontainers + Hibernate create, 실제 보안 체인/HTTP 쿠키·CSRF·BCrypt·가입 중복/권한 차단 | 개발 DB 수동 DDL의 collation/CHECK 및 실제 현재 데이터 |
| PerformanceIntegrationTest | Testcontainers, create, 필터 비활성화, 공연 생성/입력 검증 | 실제 관리자 권한·소유권 |
| PerformanceControllerTest | mock service + 필터 비활성화 | DB 제약·동시성·운영 권한 |
| PublicPerformanceSessionRepositoryIntegrationTest | Testcontainers create, 요약 집계·정렬·빈 회차 | 실제 잔여 재고·현행 DB DDL |
| PerformanceSessionPublicControllerTest | mock service + 보안 경계 | DB 상태·재고 경쟁 |
| PublicPerformanceSessionServiceTest | mock repository, 404/집계 위임 | SQL/제약조건 |
| TicketingApplicationTests | Testcontainers context smoke | 마이그레이션·실제 DB 동일성 |
| frontend/tests 및 SessionBrowserBackend | mock fixture 또는 격리 DB용 실행 코드 존재 | 이번 실행에서는 전부 미실행; 실제 개발 DB 검증 아님 |

100명 동시 선점, 중복 확정, 만료/재선점 경쟁, 결제 실패, 멱등성 및 교차 회차 독립성에 대한 예매 테스트는 없다. Flyway/Liquibase 의존성 및 버전형 마이그레이션 디렉터리는 발견하지 못했다. 기본 application.yaml에는 datasource/ddl-auto가 없으므로 실행 중 외부 설정은 미확인이다.

## 후속 실제 DB 확인 절차 — 이번에는 실행하지 않음

권한을 갖춘 세션에서 대상 DB를 먼저 확인하고 metadata 전용으로 다음을 수집해야 한다. 접속 비밀값·회원 데이터·SHOW CREATE의 민감 comment/default는 문서에 남기지 않는다.

1. `SELECT VERSION(), DATABASE(), @@session.time_zone, @@global.time_zone;`
2. `information_schema.TABLES`: 대상 스키마의 TABLE_NAME/TABLE_TYPE/ENGINE/TABLE_COLLATION.
3. `information_schema.COLUMNS`: ORDINAL_POSITION/COLUMN_NAME/COLUMN_TYPE/IS_NULLABLE/COLUMN_DEFAULT/EXTRA/CHARACTER_SET_NAME/COLLATION_NAME/DATETIME_PRECISION/NUMERIC_PRECISION/NUMERIC_SCALE. default는 비밀값 여부 검토 후 비식별 요약.
4. `TABLE_CONSTRAINTS`, `KEY_COLUMN_USAGE`, `REFERENTIAL_CONSTRAINTS`, `CHECK_CONSTRAINTS`: PK·FK·UNIQUE·CHECK 식 및 enforcement와 참조 규칙.
5. `STATISTICS`: INDEX_NAME/NON_UNIQUE/SEQ_IN_INDEX/COLUMN_NAME/INDEX_TYPE 및 expression/visibility. 별도 인덱스와 제약 기반 인덱스를 구분.
6. 각 테이블 `SHOW CREATE TABLE`을 위 결과와 대조하되 민감정보를 제거한다. `TRIGGERS`, `EVENTS`, `VIEWS`는 이름·존재·목적부터 확인한다.
7. 이후 승인된 읽기 전용 집계로 중복 키·고아 관계·공연장 불일치·판매 기간 비정상·가격 범위를 검사한다. 행 원문은 수집하지 않는다.

초기 분석에서는 위 절차가 미실행이었다. 후속 실행 범위와 아직 남은 제한은 다음과 같다.

## 실제 MySQL 후속 검증 — 2026-10-28

이 절은 앞선 초기 소스 조사에서 「실제 DB 미확인」으로 표시한 항목 중 아래 실측 범위만 갱신한다. 업무 데이터 원문·회원 식별자·비밀번호 해시는 조회하지 않았다. MySQL 클라이언트 세션에서 `START TRANSACTION READ ONLY` 후 SELECT만 실행하고 COMMIT했다. COMMIT은 읽기 트랜잭션 종료이며 데이터 변경은 없다.

### 접근·환경 검증

- `infra/.env`의 MYSQL_DATABASE/USER/PASSWORD/ROOT_PASSWORD가 설정되어 있음을 값 비공개로 확인했다. root 계정은 사용하지 않았다.
- Docker CLI 29.8.1은 실행되지만 config.json과 docker_engine 파이프 접근 거부가 지속된다. 권한·ACL·Docker context를 변경하지 않았다.
- 기존 mysql.exe의 TCP 직접 접속 성공: `127.0.0.1:3307`, schema `ticketing_service`, 서버 8.4.11.
- session/global time_zone은 SYSTEM, system_time_zone은 KST. 앱의 한국 현지시각 사용과 현재 환경은 정합적이지만 UTC 저장 정책을 확정한 것은 아니다.
- 컨테이너 상태·이미지·포트 매핑의 런타임 독립 검증은 Docker 권한 보유 세션에서 `docker inspect ticketing-mysql`의 비밀값 제외 필드 확인이 추가로 필요하다.

### 실제 전체 테이블·컬럼

7개 모두 BASE TABLE, InnoDB, 기본 collation `utf8mb4_0900_ai_ci`. 아래 컬럼 외 추가 컬럼은 조회되지 않았다. 모든 id는 signed bigint PK NOT NULL AUTO_INCREMENT다. COLUMNS의 COLUMN_DEFAULT는 모든 컬럼 NULL로 반환되며 비NULL 기본값은 없었다. NOT NULL 컬럼의 기본값 부재와 nullable 컬럼의 NULL을 구분하려면 SHOW CREATE가 추가로 필요하다.

| 테이블 | 실제 비-PK 컬럼(SQL 타입, null 허용 여부) | 건수 |
|---|---|---:|
| app_user | username varchar(50) NN ascii/ascii_bin; password_hash varchar(100) NN; role varchar(20) NN | 1 |
| performance | description varchar(255) NULL; title varchar(255) NN; age_rating enum('ADULT','ALL') NN; category enum('CONCERT','MUSICAL','PLAY') NN | 23 |
| performance_sale | sales_end_at datetime(6) NULL; sales_start_at datetime(6) NULL; status enum('CLOSED','OPEN','PREPARING') NULL; performance_id bigint NN | 22 |
| performance_session | performance_id bigint NN; starts_at datetime(6) NN; venue_id bigint NN | 49 |
| seat | seat_number int NN; venue_id bigint NN; row_label varchar(255) NN; section varchar(255) NN | 72 |
| session_seat | price decimal(38,2) NN; performance_session_id bigint NN; seat_id bigint NN | 480 |
| venue | address varchar(255) NN; name varchar(255) NN | 8 |

NN = NOT NULL. username 외 문자열·enum은 utf8mb4/utf8mb4_0900_ai_ci다. 선점/예매/결제/감사 테이블이나 상태·만료·버전 컬럼은 이 스키마의 조회 가능한 테이블/컬럼에 없다.

### 실제 PK·UNIQUE·FK·CHECK·인덱스 전수

PK는 7개 모두 `PRIMARY(id)`다. 아래 PK 외 UNIQUE는 4개, FK는 6개다. FK의 UPDATE_RULE/DELETE_RULE은 전부 NO ACTION이다.

| 테이블 | 이름 | 종류 및 컬럼/참조 |
|---|---|---|
| app_user | uk_app_user_username | UNIQUE(username) |
| performance_sale | UKt2wm543in83tk2k5vbi1wnvgt | UNIQUE(performance_id) |
| performance_sale | FKl30qy25lfcatwd00lea1setfk | FK performance_id → performance.id |
| performance_session | FKmkyy6hirggrmacpvn0jr70xdk | FK performance_id → performance.id |
| performance_session | FK8in0ygu6mm1tpurt4tfrcb0hh | FK venue_id → venue.id |
| seat | uk_seat_venue_position | UNIQUE(venue_id, section, row_label, seat_number) |
| seat | FKkt7mgkoowgxocqf3844m53i8q | FK venue_id → venue.id |
| session_seat | uk_session_seat | UNIQUE(performance_session_id, seat_id) |
| session_seat | FKgblhs07vlp9e0y722jtoen0pf | FK performance_session_id → performance_session.id |
| session_seat | FKm1jlf1f26lw8ch5dp68aby2ew | FK seat_id → seat.id |
| app_user | ck_app_user_role | CHECK(role = 'USER'), ENFORCED=YES |

인덱스는 총 14개이며 전부 가시 BTREE, 함수식 인덱스는 없다. 7 PK + 4 UNIQUE + 아래 3개 비UNIQUE다. 복합 인덱스는 위 표의 컬럼 순서를 따른다.

| 테이블 | 비UNIQUE 인덱스명 | 키 |
|---|---|---|
| performance_session | FK8in0ygu6mm1tpurt4tfrcb0hh | venue_id |
| performance_session | FKmkyy6hirggrmacpvn0jr70xdk | performance_id |
| session_seat | FKm1jlf1f26lw8ch5dp68aby2ew | seat_id |

다른 CHECK는 조회되지 않았다. 따라서 양수 가격/좌석 번호, 판매 기간 짝·순서, 회차와 물리좌석 공연장 동일성은 현재 DB CHECK로 표현되지 않는다. 독립 FK만으로 공연장 동일성은 보장되지 않는다. 현재 계정에 보이는 TRIGGERS/EVENTS/VIEWS 건수는 각각 0이며 권한 밖 객체 존재까지 부정하지 않는다. SHOW CREATE/GRANTS/실행계획·함수·프로시저·실제 경쟁 실행은 미실행이다.

### JPA 대조 결과

- 7개 엔티티와 실테이블/필드가 대응한다. IDENTITY, nullability, 명시 길이, 6관계, 4 UNIQUE 및 enum 값 집합에서 모순은 발견하지 않았다. 실제 enum 순서는 도메인 정렬 정책으로 간주하지 않는다.
- 실제 username ascii/ascii_bin과 USER-only enforced CHECK는 AppUser에 명시되지 않는다. 수동 auth-schema.sql과 실제 DB는 해당 항목에서 일치하지만 JPA 생성 테스트의 동등성을 보장하지 않는다.
- price는 실제 decimal(38,2), 시각은 datetime(6), enum은 native enum, 일반 문자열은 varchar(255)다. JPA에 가격 정밀도·시간 정밀도·물리 enum 타입이 명시되지 않아 이식성과 스키마 재생성 기준의 명시 후보다.
- status nullable은 실제 DB와 JPA가 일치한다. 반면 요청 DTO @NotNull과는 경계가 다르므로 실제 DB가 업무 규칙을 모두 강제하는 것은 아니다.

### 비식별 무결성 집계 결과

| 항목 | 결과 |
|---|---:|
| 6개 FK 관계별 고아 참조 | 각각 0 |
| 회차-물리좌석 공연장 불일치 | 0 |
| price <= 0 / seat_number <= 0 | 각각 0 |
| 판매 시작/종료 한쪽 null 또는 종료 <= 시작 | 0 |
| sale.status NULL | 0 |
| 회차좌석/물리위치/공연판매 중복 그룹 | 각각 0 |
| 판매 정책 없는 공연 | 1 |

위 값은 단일 읽기 트랜잭션의 조회 시점 관측이다. 판매 정책 없음은 현 서비스에서 판매 불가로 처리하며 자동으로 데이터 손상이라고 분류하지 않는다. 무결성 위반 0건은 향후 모든 쓰기·동시성 시나리오의 안전성을 증명하지 않는다.
