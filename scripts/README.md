# 로컬 공연 더미데이터

Node.js와 Docker CLI를 사용한다. 의존성 설치나 스키마 변경은 없다.

```powershell
# 프로젝트 루트: 기본은 읽기 전용 사전 확인
node scripts/seed-performances.mjs

# 로컬 개발 DB에 신규 데이터만 삽입
node scripts/seed-performances.mjs --apply --local-development

# 백엔드·프론트 실행 후 공개 API 및 렌더링 검증
node scripts/verify-performance-seed.mjs
```

`infra/.env`와 실행 중인 `ticketing-mysql` 컨테이너의 설정 일치, mysql:8.4 이미지,
호스트 3307 포트, 실제 DB명을 확인한다. 다른 연결 대상을 받는 옵션은 없다.
운영 DB나 실제 운영 자격 증명을 이 로컬 컨테이너에 구성하지 않는다.
비밀값은 출력하지 않는다.

시드는 신규 공연 20개(CONCERT 8, MUSICAL 6, PLAY 6), 회차 40개, 판매 정보 20개,
전용 공연장 5개, 물리 좌석 60개, 회차별 가격 좌석 480개를 단일 트랜잭션으로 추가한다.
같은 공연장의 물리 좌석은 각 회차에서 재사용하고 가격은 SessionSeat에 둔다.
모든 공연·장소·주소는 가상이며 각 설명과 장소명에 개발용 표시가 있다.
현재 CLASSIC enum이 없어 클래식 공연 3개는 CONCERT로 분류한다.

최초 실행 한국 날짜 +60일부터 2일 간격으로 공연을 배치하고, 공연마다 이틀의
19:30 회차를 만든다. 판매기간은 최초 실행 시각 전날부터 첫 회차 전날까지다.
시작/종료를 모두 지정하고 OPEN 상태 및 현재 판매기간 정책을 충족한다.
기간·가격·장소는 DB 관계와 별도로 설명에도 표시되어 현재 상세 화면에서 읽을 수 있다.
이미지 필드는 없으므로 기존 CSS 대체 포스터를 사용하며 프론트 디자인은 바꾸지 않는다.

설명 끝의 `[ticketing-dev-seed:v1:NN]`을 재실행 식별자로 사용한다. DB advisory lock으로
이 시드의 동시 실행을 직렬화한다. 전체 시드가 있으면 관계를 검증하고 추가 없이 종료한다.
일부만 있거나 제목/장소명이 충돌하면 기존 데이터를 수정하는 대신 중단한다.
기존 시드 날짜가 지나도 재실행으로 날짜를 갱신하거나 삭제하지 않는다.

기존 모든 테이블의 원래 ID 범위에 대해 행 내용 SHA-256을 전후 비교한다.
구조 해시는 정상 INSERT로 변하는 AUTO_INCREMENT 카운터만 제외해 비교한다.
알 수 없는 테이블/열 구조나 무결성 문제가 발생하면 커밋 전에는 롤백하며,
커밋 후 검증에서 오류가 발생하면 임의 수정·삭제 없이 중단한다.
기존 테이블은 InnoDB여야 하며 UPDATE/DELETE/DDL/외래키 비활성화는 사용하지 않는다.

Chrome 브라우저 검증은 임시 설치된 Playwright가 있을 때 추가 실행할 수 있다.
프로젝트 npm 의존성은 추가하지 않는다.

```powershell
$env:PLAYWRIGHT_MODULE_PATH = '<임시 설치 경로>\node_modules\playwright'
node scripts/verify-performance-seed.mjs
```

검증 스크립트의 기본 주소는 백엔드 localhost:8080, 프론트 localhost:3000이며,
`BACKEND_API_URL`, `FRONTEND_URL`로 검증 대상만 변경할 수 있다.
실행 시점에 판매기간이 지난 경우 판매 가능 검증은 실패한다. 시드는 이를 자동 수정하지 않는다.

## 2026-10-26 실행 결과

대상은 로컬 `ticketing-mysql` 컨테이너의 `ticketing_service` DB(MySQL 8.4.11)다.
dry-run 후 단일 트랜잭션 삽입을 실행했고, 같은 `--apply --local-development` 명령의
재실행에서는 `addedPerformances: 0`, `already-seeded-no-changes`를 확인했다.

| 테이블 | 실행 전 | 신규 추가 | 실행 후 |
| --- | ---: | ---: | ---: |
| performance | 3 | 20 | 23 |
| performance_session | 9 | 40 | 49 |
| performance_sale | 2 | 20 | 22 |
| venue | 3 | 5 | 8 |
| seat | 12 | 60 | 72 |
| session_seat | 0 | 480 | 480 |
| app_user | 1 | 0 | 1 |

신규 공연 ID는 4–23이다. 미래 회차는 한국시간 2026-12-25 19:30부터
2027-02-02 19:30까지이며 좌석 가격은 28,000–130,000원이다.
기존 공연 3개 및 모든 기존 테이블의 기존 행 내용 해시는 동일했다.
AUTO_INCREMENT 카운터를 제외한 기존 테이블 구조 해시도 동일했다.

실제 검증 결과:

```text
publicApiCount=23, seededCount=20
categories={CONCERT:8,MUSICAL:6,PLAY:6}
availableSales=20, renderedDetails=20, allSeedTitlesInHome=true
Chrome: PASS; visibleCards=23; placeholderRendered=true
concertFilter=true; classicalSearch=true; detailNavigation=true
```

Node 구문 검사와 `git diff --check`도 통과했다.
서버 기동 시도는 기존 3000/8080 포트 사용으로 실패했으므로 기존 서버를 중지하거나
교체하지 않고, 이미 실행 중인 서버로 실제 공개 API·HTML·Chrome 검증을 수행했다.
별도 DB 설정·백엔드·프론트·인증 코드는 변경하지 않았다.

현재 상세 화면의 전용 회차·공연장·가격 UI는 기존 API 미연동 안내를 유지한다.
이번 시드는 관계형 데이터를 준비하고 설명에도 일정·장소·가격을 넣었지만,
전용 UI/API 기능을 새로 구현하지는 않았다.
