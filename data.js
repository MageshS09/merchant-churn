/* Static demo data. Dates intentionally include a merchant signed up within seven days. */
const merchants = [
  { id: "m-001", name: "Juniper & Co.", plan: "starter", mrr: 79, signupDate: "2026-07-13", lastLoginDaysAgo: 2, supportTicketsLast30d: 0, npsScore: null, usageTrend30d: 0, paymentFailuresLast90d: 0 },
  { id: "m-002", name: "Northstar Outfitters", plan: "pro", mrr: 1299, signupDate: "2024-02-10", lastLoginDaysAgo: 0, supportTicketsLast30d: 0, npsScore: 10, usageTrend30d: 18, paymentFailuresLast90d: 0 },
  { id: "m-003", name: "Harbor & Pine", plan: "growth", mrr: 349, signupDate: "2025-03-22", lastLoginDaysAgo: 36, supportTicketsLast30d: 9, npsScore: 0, usageTrend30d: -64, paymentFailuresLast90d: 3 },
  { id: "m-004", name: "Lumen Studio", plan: "growth", mrr: 499, signupDate: "2024-11-05", lastLoginDaysAgo: 16, supportTicketsLast30d: 1, npsScore: 8, usageTrend30d: 22, paymentFailuresLast90d: 2 },
  { id: "m-005", name: "Cedar & Finch", plan: "starter", mrr: 99, signupDate: "2025-09-14", lastLoginDaysAgo: 17, supportTicketsLast30d: 4, npsScore: 6, usageTrend30d: -19, paymentFailuresLast90d: 0 },
  { id: "m-006", name: "Wildwell Goods", plan: "pro", mrr: 1599, signupDate: "2023-06-01", lastLoginDaysAgo: 8, supportTicketsLast30d: 6, npsScore: 5, usageTrend30d: -42, paymentFailuresLast90d: 1 },
  { id: "m-007", name: "Morrow Market", plan: "starter", mrr: 129, signupDate: "2025-07-09", lastLoginDaysAgo: 1, supportTicketsLast30d: 0, npsScore: 9, usageTrend30d: 6, paymentFailuresLast90d: 0 },
  { id: "m-008", name: "Atlas Pet Supply", plan: "growth", mrr: 649, signupDate: "2024-08-18", lastLoginDaysAgo: 28, supportTicketsLast30d: 2, npsScore: null, usageTrend30d: -12, paymentFailuresLast90d: 0 },
  { id: "m-009", name: "Saffron Table", plan: "pro", mrr: 999, signupDate: "2023-10-27", lastLoginDaysAgo: 12, supportTicketsLast30d: 5, npsScore: 4, usageTrend30d: -29, paymentFailuresLast90d: 0 },
  { id: "m-010", name: "Brightline Bikes", plan: "growth", mrr: 449, signupDate: "2025-01-31", lastLoginDaysAgo: 3, supportTicketsLast30d: 0, npsScore: 7, usageTrend30d: -4, paymentFailuresLast90d: 0 },
  { id: "m-011", name: "Paper Plane Press", plan: "starter", mrr: 89, signupDate: "2024-04-14", lastLoginDaysAgo: 31, supportTicketsLast30d: 1, npsScore: 7, usageTrend30d: 3, paymentFailuresLast90d: 0 },
  { id: "m-012", name: "Solace Skincare", plan: "pro", mrr: 1899, signupDate: "2023-09-02", lastLoginDaysAgo: 6, supportTicketsLast30d: 8, npsScore: 3, usageTrend30d: -51, paymentFailuresLast90d: 1 },
  { id: "m-013", name: "Copper Kettle", plan: "starter", mrr: 119, signupDate: "2025-06-20", lastLoginDaysAgo: 14, supportTicketsLast30d: 0, npsScore: null, usageTrend30d: 11, paymentFailuresLast90d: 0 },
  { id: "m-014", name: "Ember Athletics", plan: "growth", mrr: 729, signupDate: "2024-01-12", lastLoginDaysAgo: 22, supportTicketsLast30d: 3, npsScore: 8, usageTrend30d: -8, paymentFailuresLast90d: 1 },
  { id: "m-015", name: "Oro Home", plan: "pro", mrr: 2499, signupDate: "2023-05-19", lastLoginDaysAgo: 2, supportTicketsLast30d: 2, npsScore: 9, usageTrend30d: 31, paymentFailuresLast90d: 0 },
  { id: "m-016", name: "Civic Coffee Roasters", plan: "growth", mrr: 579, signupDate: "2025-02-08", lastLoginDaysAgo: 19, supportTicketsLast30d: 7, npsScore: 5, usageTrend30d: -16, paymentFailuresLast90d: 0 },
  { id: "m-017", name: "Tidepool Kids", plan: "starter", mrr: 149, signupDate: "2025-10-03", lastLoginDaysAgo: 5, supportTicketsLast30d: 0, npsScore: 8, usageTrend30d: 9, paymentFailuresLast90d: 0 },
  { id: "m-018", name: "Ridgeway Tools", plan: "pro", mrr: 1099, signupDate: "2024-06-11", lastLoginDaysAgo: 25, supportTicketsLast30d: 4, npsScore: 6, usageTrend30d: -36, paymentFailuresLast90d: 2 },
  { id: "m-019", name: "Daymark Ceramics", plan: "growth", mrr: 389, signupDate: "2025-05-02", lastLoginDaysAgo: 7, supportTicketsLast30d: 2, npsScore: 7, usageTrend30d: 14, paymentFailuresLast90d: 0 }
];
