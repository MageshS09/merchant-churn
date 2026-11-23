const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { scoreMerchant, validateMerchant, getRecommendation, factorNames, FACTOR_MAX } = require("../scoring.js");

const healthy = {
  id: "t-1", name: "Test Shop", plan: "pro", mrr: 100, signupDate: "2024-01-01",
  lastLoginDaysAgo: 0, supportTicketsLast30d: 0, npsScore: 9, usageTrend30d: 5, paymentFailuresLast90d: 0
};
const make = overrides => ({ ...healthy, ...overrides });

test("factor caps add up to 100", () => {
  assert.equal(Object.values(FACTOR_MAX).reduce((a, b) => a + b, 0), 100);
});

test("a healthy merchant scores 0 and is Low with no dominant factors", () => {
  const result = scoreMerchant(healthy);
  assert.equal(result.score, 0);
  assert.equal(result.bucket, "Low");
  assert.deepEqual(result.dominantFactors, []);
});

test("worst case merchant scores exactly 100 and is High", () => {
  const result = scoreMerchant(make({ lastLoginDaysAgo: 90, usageTrend30d: -100, paymentFailuresLast90d: 5, supportTicketsLast30d: 20, npsScore: 0 }));
  assert.equal(result.score, 100);
  assert.equal(result.bucket, "High");
});

test("each factor is capped at its maximum", () => {
  const { factors } = scoreMerchant(make({ lastLoginDaysAgo: 500, usageTrend30d: -500, paymentFailuresLast90d: 99, supportTicketsLast30d: 99, npsScore: 0 }));
  for (const [key, max] of Object.entries(FACTOR_MAX)) assert.equal(factors[key], max, key);
});

test("negative login days are clamped to zero", () => {
  assert.equal(scoreMerchant(make({ lastLoginDaysAgo: -5 })).factors.lastLogin, 0);
});

test("usage growth adds no risk; decline adds half its magnitude", () => {
  assert.equal(scoreMerchant(make({ usageTrend30d: 40 })).factors.usageTrend, 0);
  assert.equal(scoreMerchant(make({ usageTrend30d: -20 })).factors.usageTrend, 10);
});

test("support tickets only count above three, 3 points each", () => {
  assert.equal(scoreMerchant(make({ supportTicketsLast30d: 3 })).factors.supportTickets, 0);
  assert.equal(scoreMerchant(make({ supportTicketsLast30d: 5 })).factors.supportTickets, 6);
});

test("payment failures are 10 points each", () => {
  assert.equal(scoreMerchant(make({ paymentFailuresLast90d: 1 })).factors.paymentFailures, 10);
});

test("NPS: null is neutral (5), 7+ adds nothing, 0 adds the full 10", () => {
  assert.equal(scoreMerchant(make({ npsScore: null })).factors.nps, 5);
  assert.equal(scoreMerchant(make({ npsScore: 7 })).factors.nps, 0);
  assert.equal(scoreMerchant(make({ npsScore: 10 })).factors.nps, 0);
  assert.equal(scoreMerchant(make({ npsScore: 6 })).factors.nps, 1.4);
  assert.equal(scoreMerchant(make({ npsScore: 0 })).factors.nps, 10);
});

test("bucket boundaries: 33 is Low, 33.1+ is Medium, 66 is Medium, above is High", () => {
  // 30 (login) + 3 (support: 4 tickets -> 3 points) = 33
  assert.equal(scoreMerchant(make({ lastLoginDaysAgo: 30, supportTicketsLast30d: 4 })).bucket, "Low");
  assert.equal(scoreMerchant(make({ lastLoginDaysAgo: 30, supportTicketsLast30d: 5 })).bucket, "Medium");
  // 30 (login) + 25 (usage) + 10 (one failed payment) = 65 -> Medium; a weak NPS of 5 adds 2.9 -> 67.9 -> High
  const medium = scoreMerchant(make({ lastLoginDaysAgo: 30, usageTrend30d: -50, paymentFailuresLast90d: 1, npsScore: 9 }));
  assert.equal(medium.score, 65);
  assert.equal(medium.bucket, "Medium");
  assert.equal(scoreMerchant(make({ lastLoginDaysAgo: 30, usageTrend30d: -50, paymentFailuresLast90d: 1, npsScore: 5 })).bucket, "High");
});

test("scores just past each boundary land in the next bucket", () => {
  const justOver33 = scoreMerchant(make({ lastLoginDaysAgo: 29, npsScore: 4 })); // 29 + 4.3 = 33.3
  assert.equal(justOver33.score, 33.3);
  assert.equal(justOver33.bucket, "Medium");
  const justOver66 = scoreMerchant(make({ lastLoginDaysAgo: 30, usageTrend30d: -50, paymentFailuresLast90d: 1, npsScore: 6 })); // 65 + 1.4
  assert.equal(justOver66.score, 66.4);
  assert.equal(justOver66.bucket, "High");
});

test("dominant factors include everything within 5 points of the top factor", () => {
  // inactivity 20, usage decline 17, payment failures 10 -> only the first two are within 5 of the top
  const result = scoreMerchant(make({ lastLoginDaysAgo: 20, usageTrend30d: -34, paymentFailuresLast90d: 1 }));
  assert.deepEqual(result.dominantFactors, ["lastLogin", "usageTrend"]);
});

test("recommendations follow bucket and factor priority", () => {
  assert.match(getRecommendation("Low", ["lastLogin"]), /^No action needed/);
  assert.match(getRecommendation("Medium", []), /^Send proactive check-in/);
  assert.match(getRecommendation("High", ["usageTrend", "paymentFailures"]), /^Urgent: resolve billing/);
  assert.match(getRecommendation("High", ["usageTrend"]), /^Schedule a check-in call/);
  assert.match(getRecommendation("High", ["supportTickets"]), /^Escalate to senior support/);
  assert.match(getRecommendation("High", ["lastLogin"]), /^Urgent: arrange a personalized/);
});

test("focus note only appears with more than one dominant factor", () => {
  assert.doesNotMatch(getRecommendation("Medium", ["lastLogin"]), /Focus on/);
  assert.match(getRecommendation("Medium", ["nps", "lastLogin"]), /Focus on NPS sentiment and inactivity\.$/);
  assert.equal(factorNames(["usageTrend", "supportTickets"]), "usage decline and support friction");
});

test("validateMerchant accepts good records and reports every problem in bad ones", () => {
  assert.deepEqual(validateMerchant(healthy), []);
  assert.deepEqual(validateMerchant(make({ npsScore: null })), []);
  assert.ok(validateMerchant(null).length > 0);
  const problems = validateMerchant({ id: "", name: 5, mrr: "100" });
  assert.ok(problems.length >= 4);
});

test("invalid inputs are rejected instead of producing NaN scores", () => {
  for (const bad of [make({ lastLoginDaysAgo: undefined }), make({ usageTrend30d: NaN }), make({ npsScore: 11 }), make({ npsScore: -1 }), make({ mrr: Infinity }), {}]) {
    assert.throws(() => scoreMerchant(bad), /Invalid merchant/);
  }
});

test("scoring does not mutate its input", () => {
  const input = make({});
  const snapshot = JSON.stringify(input);
  scoreMerchant(input);
  assert.equal(JSON.stringify(input), snapshot);
});

test("bundled sample data: every record is valid and scores stay within 0-100", () => {
  const sandbox = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "data.js"), "utf8") + ";this.merchants = merchants;", sandbox);
  assert.ok(sandbox.merchants.length > 0);
  const ids = new Set();
  for (const merchant of sandbox.merchants) {
    assert.deepEqual(validateMerchant(merchant), [], merchant.id);
    assert.ok(!ids.has(merchant.id), `duplicate id ${merchant.id}`);
    ids.add(merchant.id);
    const { score } = scoreMerchant(merchant);
    assert.ok(score >= 0 && score <= 100);
  }
});
