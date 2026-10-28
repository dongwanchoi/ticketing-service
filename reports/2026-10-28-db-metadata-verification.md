# 실제 MySQL 메타데이터 읽기 전용 검증 보고서

## 1. 작업 목표

1차 분석의 실제 DB 미확인 부분을 해소하고 metadata와 JPA를 대조한다. DB·코드·권한 변경 및 새로운 ERD 확정은 하지 않는다.

## 2. 완료한 작업

- AGENTS.md, 기존 분석, Compose 설정과 infra/.env의 필수 항목 설정 유무를 확인했다. 설정값/접속 비밀번호는 출력하지 않았다.
- Docker config.json/엔진 파이프 접근 거부를 재현했다. ACL·그룹·Docker context 변경이나 권한 승격은 수행하지 않았다.
- 기존 mysql.exe로 `127.0.0.1:3307`에 TCP 직접 접속했다. Compose/환경 파일의 대상 DB와 일치하는 `ticketing_service`, MySQL 8.4.11 응답을 확인했다.
- 정보 스키마 TABLES/COLUMNS/TABLE_CONSTRAINTS/KEY_COLUMN_USAGE/REFERENTIAL_CONSTRAINTS/CHECK_CONSTRAINTS/STATISTICS 및 가시 TRIGGERS/EVENTS/VIEWS 건수를 읽었다.
- 별도의 읽기 전용 트랜잭션으로 테이블 건수와 고아·중복·공연장·가격·판매 기간 정합성을 집계했다. 개인정보/회원 행/해시/토큰은 조회하지 않았다.
- 실제 구조·제약을 기존 7개 JPA 엔티티 선언과 대조하고 분석 문서에 실측 결과를 추가했다.

## 3. 변경 파일 및 DB 구조

- docs/database/current-schema-analysis.md: 직접 접근 성공, 실제 전체 컬럼/제약/인덱스/건수와 JPA 대조 추가.
- docs/database/schema-gap-analysis.md: 실제 스키마 기준 확인 사실과 개선 후보 갱신.
- reports/2026-10-28-db-metadata-verification.md: 본 보고서 신규 생성.
- 기존 reports/2026-10-28-db-analysis.md는 당시 미확인 사실을 담은 이력으로 보존했다.
- DB 구조·데이터·앱 코드·설정·AGENTS.md·main 변경 없음. 기존 미커밋 문서 보존, Commit·Push 없음.

## 4. 주요 결정과 근거

- Docker 관리 API 권한 문제와 MySQL TCP 서비스 권한을 구분했다. 기존 자격증명으로 이미 허용된 MySQL 서비스에 접속했으며 시스템 권한을 변경하지 않았다.
- 비밀번호를 CLI 인수에 넣지 않고 해당 자식 프로세스가 상속하는 MYSQL_PWD로 전달했다. 종료 시 이전 환경값을 복원하고 설정 dictionary를 비웠다. 비밀값 포함 환경 파일/로그를 생성하지 않았다.
- DB 명령은 연결 확인 SELECT, START TRANSACTION READ ONLY, metadata/집계 SELECT, COMMIT뿐이었다. 읽기 트랜잭션 종료 외 DDL/DML 및 DB 생성/초기화 명령은 실행하지 않았다.
- Docker inspect가 불가능하므로 실제 접속 서버를 ticketing-mysql 컨테이너로 독립 식별했다고 과장하지 않는다. 설정된 로컬 DB endpoint의 실측으로 기록했다.

## 5. 실제 검증 결과

| 항목 | 결과 |
|---|---|
| Docker | 클라이언트 29.8.1 실행 가능, 설정 파일/엔진 pipe 권한 거부 유지 |
| MySQL TCP | 성공, 서버 8.4.11, schema ticketing_service |
| 시간 | session/global SYSTEM, system KST |
| 구조 | 7 InnoDB 테이블, 7 PK, 6 FK, 4 UNIQUE, 1 enforced CHECK, 14 visible BTREE 인덱스 |
| 제약 | FK UPDATE/DELETE 전부 NO ACTION, role='USER' CHECK 실제 존재 |
| JPA 대조 | 7엔티티 컬럼·관계·nullability·길이·unique 대응, 회원 collation/CHECK JPA 미표현 |
| 실제 정밀도 | price decimal(38,2), 시각 datetime(6), enum은 native enum |
| 건수 | app_user 1, performance 23, sale 22, session 49, seat 72, session_seat 480, venue 8 |
| FK 고아 6종 | 각각 0 |
| 회차-좌석 공연장 불일치, 비양수 가격/좌석번호 | 각각 0 |
| 판매 기간 비정상, NULL 판매 상태 | 각각 0 |
| 회차좌석/물리위치/공연판매 중복 그룹 | 각각 0 |
| 판매 정책 없는 공연 | 1; 현 코드상 판매 불가이며 손상으로 단정하지 않음 |
| 조회 가능한 trigger/event/view | 각각 0; 권한 밖 객체는 미확인 |
| 쓰기 테스트·빌드·브라우저·동시성 실험 | 미실행; metadata/집계 검증까지만 수행 |

## 6. 알려진 문제 및 리스크

- Docker 권한은 해결하지 않았으며 변경하지도 않았다. 컨테이너 상태/포트 매핑의 독립 확인은 Docker 권한을 이미 가진 사용자 세션에서 비밀값을 제외한 inspect가 필요하다. 이번 MySQL 검증 자체는 해당 권한 없이 완료했다.
- 정상 데이터 건수는 현재 관측일 뿐 미래 무결성·동시성 보장이 아니다. 회차-좌석 공연장 일치, 가격 양수, 기간 순서는 DB CHECK로 강제되지 않는다.
- 회원 collation/CHECK는 DB에 있으나 JPA에 없어 Hibernate 생성 테스트 스키마와 차이가 난다.
- 개인정보/계정 권한 원문·SHOW CREATE 원문·실행계획은 수집하지 않았다. 계정 밖 객체 가시성은 미검증이다.

## 7. 미완료 및 다음 작업

- Docker 관리 권한 변경 없이 필요한 경우 기존 권한 보유 세션에서 ticketing-mysql 포트·이미지·상태만 확인한다.
- 정책 결정 후 선점·예매·결제 대안을 비교한다. 이 단계에서는 새 ERD·제약 추가·마이그레이션을 확정하지 않는다.
- 핵심 원리: 실제 데이터에서 위반이 0건이라는 사실과 DB가 향후 모든 위반을 차단한다는 보장은 다르다.

## 8. Git 및 검증 기록

- 시작 브랜치 dev, 기준 커밋 `00a07d7db796e86e3f22f46d8d5bb9e0aa3d11ca`.
- 시작 시 docs/database/와 reports/2026-10-28-db-analysis.md는 이전 작업의 미추적 결과물이었으며 보존했다.
- main 조회 외 변경, 브랜치 전환·커밋·원격 Push·Worktree 동기화 없음.
- 최종 세 문서의 로컬 링크·공백·민감정보 패턴 검사와 실제 환경 파일의 비밀번호 값 미포함 검사가 PASS였다. 검사 과정에서도 해당 값은 출력하지 않았다.
- `git diff --exit-code -- backend frontend infra AGENTS.md`는 0으로 앱/설정 변경 없음을 확인했다. HEAD는 기준 그대로이고 main은 `ba1a37f2cd0a13b295af368ef8ce031ead3961c9`로 유지됐다. 기존 미추적 문서와 신규 보고서만 남았다.
