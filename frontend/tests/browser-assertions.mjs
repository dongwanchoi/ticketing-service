import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";

// Activity/Suspense may retain hidden pages. Assert the current, user-visible list.
export function performanceLinks(page) {
  return page.getByRole("region", { name: "공연 둘러보기", exact: true })
    .locator('a[href^="/performances/"]:visible');
}

export async function assertCountEventually(locator, expected, message, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  let actual;
  do {
    actual = await locator.count();
    if (actual === expected) return;
    await setTimeout(50);
  } while (Date.now() < deadline);
  assert.equal(actual, expected, message);
}
