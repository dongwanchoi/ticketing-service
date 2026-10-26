/** Local Docker MySQL only. Dry-run by default; --apply --local-development inserts once. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createInterface } from "node:readline";
import assert from "node:assert/strict";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const containerName = "ticketing-mysql";
const prefix = "[ticketing-dev-seed:v1:";
const apply = process.argv.includes("--apply");
if (process.argv.some(arg => arg.startsWith("--") && !["--apply", "--local-development"].includes(arg))) {
  throw new Error("Only --apply and --local-development are supported");
}
if (apply && !process.argv.includes("--local-development")) throw new Error("Explicit --local-development is required");

const venues = [
  { name: "모먼트 드림홀 [DEV-SEED-v1]", address: "서울특별시 가상구 별빛로 101 (개발용 가상 공연장)" },
  { name: "달빛 스테이지 [DEV-SEED-v1]", address: "서울특별시 가상구 달빛길 202 (개발용 가상 공연장)" },
  { name: "푸른숲 아트센터 [DEV-SEED-v1]", address: "부산광역시 가상구 숲길 303 (개발용 가상 공연장)" },
  { name: "은하수 소극장 [DEV-SEED-v1]", address: "대전광역시 가상구 은하로 404 (개발용 가상 공연장)" },
  { name: "바람결 콘서트홀 [DEV-SEED-v1]", address: "광주광역시 가상구 바람길 505 (개발용 가상 공연장)" },
];
// CLASSIC is not a supported DB/JPA enum. Classical concerts intentionally use CONCERT.
const performances = [
  ["네온 시티 라이브", "CONCERT", "ALL", 65000, "도시의 밤을 수놓는 가상 밴드의 신스팝 콘서트. 빛과 리듬이 만나는 무대를 즐겨 보세요."],
  ["파도 위의 멜로디", "CONCERT", "ALL", 45000, "어쿠스틱 기타와 따뜻한 목소리가 전하는 바다의 이야기. 잔잔한 인디 음악 여행입니다."],
  ["미드나잇 재즈 클럽", "CONCERT", "ADULT", 70000, "가상의 재즈 트리오가 들려주는 깊은 밤의 즉흥 연주. 성인 관객을 위한 음악 공연입니다."],
  ["푸른 행성 록 페스티벌", "CONCERT", "ALL", 90000, "세 팀의 가상 록 밴드가 선보이는 열정적인 합동 공연. 강렬한 기타 사운드를 만나 보세요."],
  ["겨울 우체국 어쿠스틱", "CONCERT", "ALL", 35000, "보내지 못한 편지를 노래로 전하는 포근한 어쿠스틱 공연. 작은 일상의 온기를 담았습니다."],
  ["별빛 현악 사중주", "CONCERT", "ALL", 50000, "클래식 실내악을 주제로 한 가상 현악 사중주 공연. 네 악기가 나누는 섬세한 대화를 감상하세요."],
  ["겨울의 피아노 편지", "CONCERT", "ALL", 60000, "서정적인 피아노 선율로 계절을 그리는 가상 클래식 리사이틀. 고요한 음악의 시간을 선물합니다."],
  ["오케스트라의 시간 여행", "CONCERT", "ALL", 110000, "가상 오케스트라와 함께 떠나는 클래식 음악 여행. 풍성한 현악과 관악의 어울림을 느껴 보세요."],
  ["시간을 걷는 도서관", "MUSICAL", "ALL", 85000, "책 속 시간을 여행하는 사서의 모험을 담은 창작 뮤지컬. 잊힌 이야기가 노래로 깨어납니다."],
  ["달을 수선하는 사람들", "MUSICAL", "ALL", 75000, "금이 간 달을 고치는 작은 마을의 특별한 밤. 상상력과 따뜻한 합창이 어우러진 창작 무대입니다."],
  ["별을 만드는 공장", "MUSICAL", "ALL", 95000, "꿈을 잃은 별 제작자가 다시 빛을 찾는 여정. 환상적인 세계와 역동적인 군무를 만나세요."],
  ["오래된 역의 마지막 열차", "MUSICAL", "ALL", 80000, "폐역을 앞둔 기차역에서 만난 사람들의 사연. 이별과 새로운 출발을 노래하는 창작 뮤지컬입니다."],
  ["도시의 그림자", "MUSICAL", "ADULT", 105000, "가상의 도시에서 비밀을 추적하는 인물들의 이야기. 성인 관객을 위한 긴장감 있는 창작 뮤지컬입니다."],
  ["종이비행기의 약속", "MUSICAL", "ALL", 55000, "어린 시절의 약속을 찾아 떠나는 친구들. 가족이 함께 즐길 수 있는 밝은 창작 뮤지컬입니다."],
  ["우리 집 옥상의 작은 정원", "PLAY", "ALL", 30000, "옥상 정원을 함께 가꾸며 마음을 여는 이웃들의 이야기. 웃음과 위로가 있는 생활 연극입니다."],
  ["비 오는 날의 사진관", "PLAY", "ALL", 35000, "낯선 사진관에서 마주한 잊힌 기억들. 평범한 순간의 소중함을 전하는 창작 연극입니다."],
  ["마지막 퍼즐 조각", "PLAY", "ADULT", 45000, "닫힌 방에 모인 사람들이 하나의 사건을 재구성합니다. 성인 관객을 위한 가상 심리 추리극입니다."],
  ["토요일의 작은 식탁", "PLAY", "ALL", 32000, "매주 토요일 같은 식탁에 모이는 가족과 친구들. 서로 다른 일상이 만나는 따뜻한 코미디입니다."],
  ["평행선 위의 두 사람", "PLAY", "ADULT", 40000, "같은 시간을 다르게 기억하는 두 사람의 대화. 관계와 선택을 돌아보는 성인 대상 창작 연극입니다."],
  ["바람이 머무는 우체통", "PLAY", "ALL", 28000, "오래된 우체통에 도착한 편지 한 장이 마을을 바꿉니다. 작은 용기를 응원하는 가상 창작극입니다."],
].map(([title, category, age, price, synopsis], index) => ({
  title, category, age, price, synopsis, venue: index % venues.length,
  marker: `${prefix}${String(index + 1).padStart(2, "0")}]`,
}));

const sqlString = value => `CONVERT(0x${Buffer.from(String(value), "utf8").toString("hex")} USING utf8mb4)`;
const hash = text => createHash("sha256").update(text).digest("hex");
const quoteId = name => { assert.match(name, /^[a-zA-Z0-9_]+$/); return `\`${name}\``; };

function verifyLocalContainer() {
  const expected = Object.fromEntries(readFileSync(resolve(root, "infra/.env"), "utf8")
    .split(/\r?\n/).filter(line => /^MYSQL_[A-Z_]+=/.test(line)).map(line => {
      const position = line.indexOf("=");
      return [line.slice(0, position), line.slice(position + 1).trim().replace(/^(["'])(.*)\1$/, "$2")];
    }));
  let info;
  try { info = JSON.parse(execFileSync("docker", ["inspect", containerName], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }))[0]; }
  catch { throw new Error("Cannot inspect the local ticketing-mysql container"); }
  const actual = Object.fromEntries(info.Config.Env.map(line => {
    const position = line.indexOf("="); return [line.slice(0, position), line.slice(position + 1)];
  }));
  for (const key of ["MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_ROOT_PASSWORD"]) {
    assert.ok(expected[key] && expected[key] === actual[key], "Local .env/container mismatch; stopped (values hidden)");
  }
  assert.equal(info.Config.Image, "mysql:8.4", "Unexpected image; stopped");
  assert.ok(info.State.Running, "MySQL container is not running");
  assert.ok(info.NetworkSettings.Ports["3306/tcp"]?.some(port => port.HostPort === "3307"), "Unexpected local port; stopped");
  return expected.MYSQL_DATABASE;
}

class Mysql {
  constructor() {
    this.index = 0; this.pending = null; this.stderr = ""; this.closed = false;
    this.child = spawn("docker", ["exec", "-i", containerName, "sh", "-c",
      'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql -u"$MYSQL_USER" "$MYSQL_DATABASE" --default-character-set=utf8mb4 --batch --skip-column-names --unbuffered'],
    { stdio: ["pipe", "pipe", "pipe"] });
    createInterface({ input: this.child.stdout }).on("line", line => {
      if (!this.pending) return;
      if (line === this.pending.marker) {
        const pending = this.pending; this.pending = null;
        clearTimeout(pending.timer); pending.resolve(pending.lines);
      } else this.pending.lines.push(line);
    });
    this.child.stderr.on("data", data => { this.stderr += data.toString(); });
    const fail = () => {
      this.closed = true;
      if (this.pending) {
        clearTimeout(this.pending.timer);
        this.pending.reject(new Error(`MySQL command failed; transaction closed. ${this.stderr.match(/ERROR \d+ \([A-Z0-9]+\)/)?.[0] ?? "No secret values logged."}`));
        this.pending = null;
      }
    };
    this.child.on("error", fail); this.child.on("close", fail);
    this.child.stdin.on("error", fail);
  }
  query(sql) {
    if (this.closed || this.child.stdin.destroyed) return Promise.reject(new Error("MySQL connection is closed"));
    assert.equal(this.pending, null);
    return new Promise((resolveQuery, reject) => {
      const marker = `__seed_result_${++this.index}__`;
      const timer = setTimeout(() => { this.child.kill(); reject(new Error("MySQL query timed out; stopped")); }, 30_000);
      this.pending = { marker, lines: [], resolve: resolveQuery, reject, timer };
      this.child.stdin.write(`${sql}\nSELECT '${marker}';\n`);
    });
  }
  close() { this.child.stdin.end(); }
}

async function snapshot(db) {
  const names = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE' ORDER BY table_name;");
  const result = {};
  for (const name of names) {
    const table = quoteId(name);
    const [stats] = await db.query(`SELECT COUNT(*), COALESCE(MAX(id),0) FROM ${table};`);
    const [count, maxId] = stats.split("\t").map(Number);
    const rows = await db.query(`SELECT * FROM ${table} WHERE id<=${maxId} ORDER BY id;`);
    const ddl = await db.query(`SHOW CREATE TABLE ${table};`);
    result[name] = { count, maxId, dataHash: hash(rows.join("\n")), schemaHash: hash(ddl.join("\n").replace(/AUTO_INCREMENT=\d+/g, "AUTO_INCREMENT=<counter>")) };
  }
  return result;
}

async function preserve(db, before) {
  const names = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE' ORDER BY table_name;");
  assert.deepEqual(names, Object.keys(before), "Unexpected schema/table change; stopped");
  for (const [name, original] of Object.entries(before)) {
    const rows = await db.query(`SELECT * FROM ${quoteId(name)} WHERE id<=${original.maxId} ORDER BY id;`);
    assert.equal(hash(rows.join("\n")), original.dataHash, `Existing data changed in ${name}; stopped`);
    const ddl = await db.query(`SHOW CREATE TABLE ${quoteId(name)};`);
    assert.equal(hash(ddl.join("\n").replace(/AUTO_INCREMENT=\d+/g, "AUTO_INCREMENT=<counter>")), original.schemaHash, `Schema changed in ${name}; stopped`);
  }
}

const expectedColumns = {
  performance: ["id", "description", "title", "age_rating", "category"],
  performance_session: ["id", "performance_id", "starts_at", "venue_id"],
  performance_sale: ["id", "sales_end_at", "sales_start_at", "status", "performance_id"],
  venue: ["id", "address", "name"], seat: ["seat_number", "id", "venue_id", "row_label", "section"],
  session_seat: ["id", "price", "performance_session_id", "seat_id"],
};

async function validateSeed(db) {
  const ids = [];
  for (const performance of performances) {
    const rows = await db.query(`SELECT id,title,category,age_rating FROM performance WHERE RIGHT(description,${performance.marker.length})=${sqlString(performance.marker)};`);
    assert.equal(rows.length, 1, "Missing or duplicated seed marker; no automatic repair performed");
    const [id, title, category, age] = rows[0].split("\t");
    assert.equal(title, performance.title); assert.equal(category, performance.category); assert.equal(age, performance.age);
    ids.push(Number(id));
    const [sale] = await db.query(`SELECT COUNT(*) FROM performance_sale WHERE performance_id=${id} AND status='OPEN' AND sales_start_at IS NOT NULL AND sales_end_at>sales_start_at;`);
    assert.equal(Number(sale), 1, "Seed sale policy mismatch; stopped");
    const sessions = await db.query(`SELECT id,venue_id FROM performance_session WHERE performance_id=${id};`);
    assert.equal(sessions.length, 2, "Seed sessions mismatch; stopped");
    for (const session of sessions) {
      const [sessionId, venueId] = session.split("\t");
      const [row] = await db.query(`SELECT COUNT(*),MIN(ss.price),MAX(ss.price),SUM(s.venue_id<>${venueId}) FROM session_seat ss JOIN seat s ON s.id=ss.seat_id WHERE ss.performance_session_id=${sessionId};`);
      assert.deepEqual(row.split("\t").map(Number), [12, performance.price, performance.price + 20000, 0], "Seed seat/price/venue mismatch; stopped");
    }
  }
  return ids;
}

async function main() {
  const expectedDatabase = verifyLocalContainer();
  const db = new Mysql(); let transaction = false; let committed = false;
  try {
    const [target] = await db.query("SELECT DATABASE(),VERSION();");
    assert.equal(target.split("\t")[0], expectedDatabase, "Unexpected database; stopped");
    console.log(JSON.stringify({ targetDatabase: expectedDatabase, container: containerName, environment: "local-development", apply }));
    const [locked] = await db.query("SELECT GET_LOCK('ticketing_dev_performances_seed_v1',10);");
    assert.equal(locked, "1", "Another seed process holds the lock; stopped");
    await db.query("SET time_zone='+09:00';");
    for (const [table, columns] of Object.entries(expectedColumns)) {
      const actual = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=${sqlString(table)} ORDER BY ordinal_position;`);
      assert.deepEqual(actual, columns, `Unexpected ${table} schema; stopped`);
      const [engine] = await db.query(`SELECT engine FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=${sqlString(table)};`);
      assert.equal(engine, "InnoDB", `Transactional InnoDB is required for ${table}; stopped`);
    }
    const before = await snapshot(db);
    const markers = await db.query(`SELECT id FROM performance WHERE INSTR(description,${sqlString(prefix)})>0;`);
    if (markers.length) {
      assert.equal(markers.length, 20, "Partial/unknown seed detected; stopped without repairs or inserts");
      const ids = await validateSeed(db);
      await preserve(db, before);
      console.log(JSON.stringify({ addedPerformances: 0, existingSeedPerformances: 20, ids, result: "already-seeded-no-changes", existingDataPreserved: true }));
      return;
    }
    for (const performance of performances) {
      const [collision] = await db.query(`SELECT COUNT(*) FROM performance WHERE title=${sqlString(performance.title)};`);
      assert.equal(collision, "0", "A seed title already belongs to non-seed data; stopped");
    }
    for (const venue of venues) {
      const [collision] = await db.query(`SELECT COUNT(*) FROM venue WHERE name=${sqlString(venue.name)};`);
      assert.equal(collision, "0", "Seed venue name collision; stopped");
    }
    console.log(JSON.stringify({ existingRows: Object.fromEntries(Object.entries(before).map(([name, value]) => [name, value.count])),
      planned: { performances: 20, sessions: 40, sales: 20, venues: 5, seats: 60, sessionSeats: 480 } }));
    if (!apply) { console.log("DRY RUN: no data written. Use --apply --local-development to insert."); return; }
    await db.query("START TRANSACTION;"); transaction = true;
    const [baseDay] = await db.query("SELECT DATE_FORMAT(DATE_ADD(CURRENT_DATE(),INTERVAL 60 DAY),'%Y-%m-%d');");
    for (let i = 0; i < venues.length; i++) {
      const venue = venues[i];
      const [venueId] = await db.query(`INSERT INTO venue(name,address) VALUES(${sqlString(venue.name)},${sqlString(venue.address)}); SELECT LAST_INSERT_ID();`);
      venue.id = Number(venueId);
      for (const row of ["A", "B"]) for (let number = 1; number <= 6; number++) {
        await db.query(`INSERT INTO seat(venue_id,section,row_label,seat_number) VALUES(${venue.id},${sqlString(row === "A" ? "R" : "S")},${sqlString(row)},${number});`);
      }
    }
    for (let i = 0; i < performances.length; i++) {
      const performance = performances[i]; const venue = venues[performance.venue];
      const date = new Date(`${baseDay}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + i * 2);
      const firstDay = date.toISOString().slice(0, 10);
      date.setUTCDate(date.getUTCDate() + 1); const secondDay = date.toISOString().slice(0, 10);
      const description = `${performance.synopsis} 개발용 가상 공연입니다. ${firstDay}·${secondDay} 19:30 / ${venue.name.replace(" [DEV-SEED-v1]", "")} / S석 ${performance.price.toLocaleString("ko-KR")}원, R석 ${(performance.price + 20000).toLocaleString("ko-KR")}원. ${performance.marker}`;
      assert.ok([...description].length <= 255, "Description exceeds current schema length");
      const [performanceId] = await db.query(`INSERT INTO performance(title,description,category,age_rating) VALUES(${sqlString(performance.title)},${sqlString(description)},${sqlString(performance.category)},${sqlString(performance.age)}); SELECT LAST_INSERT_ID();`);
      await db.query(`INSERT INTO performance_sale(performance_id,status,sales_start_at,sales_end_at) VALUES(${performanceId},'OPEN',DATE_SUB(CURRENT_TIMESTAMP(),INTERVAL 1 DAY),DATE_SUB(${sqlString(firstDay + " 19:30:00")},INTERVAL 1 DAY));`);
      for (const day of [firstDay, secondDay]) {
        const [sessionId] = await db.query(`INSERT INTO performance_session(performance_id,venue_id,starts_at) VALUES(${performanceId},${venue.id},${sqlString(day + " 19:30:00")}); SELECT LAST_INSERT_ID();`);
        await db.query(`INSERT INTO session_seat(performance_session_id,seat_id,price) SELECT ${sessionId},id,${performance.price}+CASE WHEN section='R' THEN 20000 ELSE 0 END FROM seat WHERE venue_id=${venue.id};`);
      }
    }
    const ids = await validateSeed(db);
    const [futureSessions] = await db.query(`SELECT COUNT(*) FROM performance_session WHERE performance_id IN (${ids.join(",")}) AND starts_at>CURRENT_TIMESTAMP();`);
    assert.equal(futureSessions, "40", "Not all new sessions are in the future");
    const [openSales] = await db.query(`SELECT COUNT(*) FROM performance_sale WHERE performance_id IN (${ids.join(",")}) AND status='OPEN' AND sales_start_at<=CURRENT_TIMESTAMP() AND sales_end_at>CURRENT_TIMESTAMP();`);
    assert.equal(openSales, "20", "New sale policies are not currently open");
    await preserve(db, before);
    const expectedDeltas = { performance: 20, performance_session: 40, performance_sale: 20, venue: 5, seat: 60, session_seat: 480 };
    for (const [table, old] of Object.entries(before)) {
      const [count] = await db.query(`SELECT COUNT(*) FROM ${quoteId(table)};`);
      assert.equal(Number(count), old.count + (expectedDeltas[table] ?? 0), `Unexpected inserted count in ${table}; rolling back`);
    }
    await db.query("COMMIT;"); transaction = false; committed = true;
    await preserve(db, before);
    console.log(JSON.stringify({ addedPerformances: 20, addedSessions: 40, addedSales: 20, addedVenues: 5,
      addedSeats: 60, addedSessionSeats: 480, ids, firstSession: `${baseDay} 19:30:00 Asia/Seoul`,
      existingDataPreserved: true, schemaUnchanged: true, result: "committed" }));
  } catch (error) {
    if (transaction) await db.query("ROLLBACK;").catch(() => {});
    console.error(`STOP: ${error.message}. ${committed ? "Commit already completed; no automatic repair/deletion attempted." : "No transaction committed."}`);
    process.exitCode = 1;
  } finally {
    await db.query("SELECT RELEASE_LOCK('ticketing_dev_performances_seed_v1');").catch(() => {});
    db.close();
  }
}
main().catch(() => { console.error("STOP: local environment verification failed; values hidden. No inserts performed."); process.exitCode = 1; });
