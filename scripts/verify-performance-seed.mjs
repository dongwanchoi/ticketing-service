/** Read-only checks. Optional Chrome checks when PLAYWRIGHT_MODULE_PATH is set. */
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const backend = process.env.BACKEND_API_URL ?? "http://localhost:8080";
const frontend = process.env.FRONTEND_URL ?? "http://localhost:3000";
const response = await fetch(`${backend}/api/v1/performances`);
assert.equal(response.status, 200, "Public list API must work anonymously");
const all = await response.json();
const seeded = all.filter(performance => performance.description?.includes("[ticketing-dev-seed:v1:"));
assert.equal(seeded.length, 20);
assert.equal(new Set(seeded.map(performance => performance.id)).size, 20);
const categories = Object.fromEntries(["CONCERT", "MUSICAL", "PLAY"].map(category => [category, seeded.filter(performance => performance.category === category).length]));
assert.deepEqual(categories, { CONCERT: 8, MUSICAL: 6, PLAY: 6 });
for (const performance of seeded) {
  const saleResponse = await fetch(`${backend}/api/v1/performances/${performance.id}/sale-availability`);
  assert.equal(saleResponse.status, 200);
  assert.equal((await saleResponse.json()).onSale, true, `Sale unavailable: ${performance.id}`);
  const detail = await fetch(`${frontend}/performances/${performance.id}`);
  assert.equal(detail.status, 200, `Detail page error: ${performance.id}`);
  assert.ok((await detail.text()).includes(performance.title), `Title missing in detail: ${performance.id}`);
}
const home = await fetch(frontend);
assert.equal(home.status, 200);
const homeHtml = await home.text();
for (const performance of seeded) assert.ok(homeHtml.includes(performance.title), "Seed title missing in rendered home");
console.log(JSON.stringify({ publicApiCount: all.length, seededCount: seeded.length, categories, availableSales: 20, renderedDetails: 20, allSeedTitlesInHome: true }));

if (process.env.PLAYWRIGHT_MODULE_PATH) {
  const { chromium } = await import(pathToFileURL(`${process.env.PLAYWRIGHT_MODULE_PATH}/index.mjs`).href);
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
  try {
    const page = await browser.newPage(); const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(frontend);
    await page.getByRole("heading", { name: "공연 둘러보기" }).waitFor();
    assert.equal(await page.locator('a[href^="/performances/"]').count(), all.length);
    for (const performance of seeded) {
      await page.getByRole("link", { name: `${performance.title} 공연 상세 보기`, exact: true }).waitFor();
    }
    const poster = page.getByRole("img", { name: "공식 포스터 미등록" }).first();
    assert.notEqual(await poster.evaluate(element => getComputedStyle(element).backgroundImage), "none");
    await page.getByRole("button", { name: "콘서트", exact: true }).click();
    const allConcerts = all.filter(performance => performance.category === "CONCERT");
    assert.equal(await page.locator('a[href^="/performances/"]').count(), allConcerts.length);
    await page.getByRole("searchbox").fill("별빛 현악 사중주");
    const selected = seeded.find(performance => performance.title === "별빛 현악 사중주");
    await page.getByRole("link", { name: `${selected.title} 공연 상세 보기`, exact: true }).click();
    await page.getByRole("heading", { name: selected.title, exact: true }).waitFor();
    await page.getByText("판매 정책상 예매 가능", { exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ chrome: "PASS", visibleCards: all.length, placeholderRendered: true, concertFilter: true, classicalSearch: true, detailNavigation: true }));
  } finally { await browser.close(); }
}
