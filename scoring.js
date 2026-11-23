/* Churn-risk scoring: pure functions with no DOM access, so they can be loaded
 * in the browser (window.MerchantScoring) and unit-tested in Node (require). */
(function (root) {
  const FACTOR_LABELS = {
    lastLogin: "Inactivity", usageTrend: "Usage decline", paymentFailures: "Payment failures", supportTickets: "Support friction", nps: "NPS sentiment"
  };

  // Maximum points each factor can contribute; together they add up to 100.
  const FACTOR_MAX = { lastLogin: 30, usageTrend: 25, paymentFailures: 20, supportTickets: 15, nps: 10 };

  const NUMERIC_FIELDS = ["mrr", "lastLoginDaysAgo", "supportTicketsLast30d", "usageTrend30d", "paymentFailuresLast90d"];

  function round(value) { return Math.round(value * 10) / 10; }

  /** Returns a list of problems with a merchant record (empty when valid). */
  function validateMerchant(merchant) {
    if (!merchant || typeof merchant !== "object") return ["merchant must be an object"];
    const problems = [];
    if (typeof merchant.id !== "string" || merchant.id === "") problems.push("id must be a non-empty string");
    if (typeof merchant.name !== "string" || merchant.name === "") problems.push("name must be a non-empty string");
    NUMERIC_FIELDS.forEach(field => {
      if (typeof merchant[field] !== "number" || !Number.isFinite(merchant[field])) problems.push(`${field} must be a finite number`);
    });
    const nps = merchant.npsScore;
    if (nps !== null && (typeof nps !== "number" || !Number.isFinite(nps) || nps < 0 || nps > 10)) {
      problems.push("npsScore must be null or a number from 0 to 10");
    }
    return problems;
  }

  function factorNames(keys) {
    return keys.map(key => (key === "nps" ? FACTOR_LABELS[key] : FACTOR_LABELS[key].toLowerCase())).join(" and ");
  }

  function getRecommendation(bucket, dominantFactors) {
    const focus = dominantFactors.length > 1 ? ` Focus on ${factorNames(dominantFactors)}.` : "";
    if (bucket === "Low") return "No action needed, include in quarterly review" + focus;
    if (bucket === "Medium") return "Send proactive check-in email, monitor for 2 weeks" + focus;
    if (dominantFactors.includes("paymentFailures")) return "Urgent: resolve billing, personal outreach within 24h" + focus;
    if (dominantFactors.includes("usageTrend")) return "Schedule a check-in call, offer feature walkthrough" + focus;
    if (dominantFactors.includes("supportTickets")) return "Escalate to senior support, review ticket history" + focus;
    return "Urgent: arrange a personalized re-engagement check-in within 24h" + focus;
  }

  /** Scores one merchant 0-100 and buckets it Low (<=33), Medium (<=66) or High. */
  function scoreMerchant(merchant) {
    const problems = validateMerchant(merchant);
    if (problems.length) throw new Error(`Invalid merchant${merchant && merchant.id ? ` ${merchant.id}` : ""}: ${problems.join("; ")}`);

    const factors = {
      lastLogin: Math.min(FACTOR_MAX.lastLogin, Math.max(0, merchant.lastLoginDaysAgo)),
      usageTrend: merchant.usageTrend30d < 0 ? Math.min(FACTOR_MAX.usageTrend, Math.abs(merchant.usageTrend30d) / 2) : 0,
      paymentFailures: Math.min(FACTOR_MAX.paymentFailures, merchant.paymentFailuresLast90d * 10),
      supportTickets: merchant.supportTicketsLast30d > 3 ? Math.min(FACTOR_MAX.supportTickets, (merchant.supportTicketsLast30d - 3) * 3) : 0,
      nps: merchant.npsScore === null ? 5 : merchant.npsScore <= 6 ? ((7 - merchant.npsScore) * 10) / 7 : 0
    };
    Object.keys(factors).forEach(key => { factors[key] = round(factors[key]); });
    const score = Math.min(100, round(Object.values(factors).reduce((sum, points) => sum + points, 0)));
    const bucket = score <= 33 ? "Low" : score <= 66 ? "Medium" : "High";
    const ordered = Object.entries(factors).sort((a, b) => b[1] - a[1]);
    const dominantFactors = ordered.filter(([, points]) => ordered[0][1] - points <= 5 && points > 0).map(([key]) => key);
    const recommendation = getRecommendation(bucket, dominantFactors);
    return { ...merchant, score, bucket, factors, dominantFactors, recommendation };
  }

  const api = { FACTOR_LABELS, FACTOR_MAX, validateMerchant, scoreMerchant, getRecommendation, factorNames };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MerchantScoring = api;
})(typeof window !== "undefined" ? window : globalThis);
