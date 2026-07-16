(() => {
  const FACTOR_LABELS = {
    lastLogin: "Inactivity", usageTrend: "Usage decline", paymentFailures: "Payment failures", supportTickets: "Support friction", nps: "NPS sentiment"
  };

  function round(value) { return Math.round(value * 10) / 10; }

  function scoreMerchant(merchant) {
    const factors = {
      lastLogin: Math.min(30, Math.max(0, merchant.lastLoginDaysAgo)),
      usageTrend: merchant.usageTrend30d < 0 ? Math.min(25, Math.abs(merchant.usageTrend30d) / 2) : 0,
      paymentFailures: Math.min(20, merchant.paymentFailuresLast90d * 10),
      supportTickets: merchant.supportTicketsLast30d > 3 ? Math.min(15, (merchant.supportTicketsLast30d - 3) * 3) : 0,
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

  function factorNames(keys) { return keys.map(key => FACTOR_LABELS[key] === "NPS sentiment" ? "NPS sentiment" : FACTOR_LABELS[key].toLowerCase()).join(" and "); }

  function getRecommendation(bucket, dominantFactors) {
    const focus = dominantFactors.length > 1 ? ` Focus on ${factorNames(dominantFactors)}.` : "";
    if (bucket === "Low") return "No action needed, include in quarterly review" + focus;
    if (bucket === "Medium") return "Send proactive check-in email, monitor for 2 weeks" + focus;
    if (dominantFactors.includes("paymentFailures")) return "Urgent: resolve billing, personal outreach within 24h" + focus;
    if (dominantFactors.includes("usageTrend")) return "Schedule a check-in call, offer feature walkthrough" + focus;
    if (dominantFactors.includes("supportTickets")) return "Escalate to senior support, review ticket history" + focus;
    return "Urgent: arrange a personalized re-engagement check-in within 24h" + focus;
  }

  const scoredMerchants = merchants.map(scoreMerchant);
  let filter = "All";
  let descending = true;
  let expandedId = null;
  const body = document.getElementById("merchant-body");

  function money(value) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }
  function trend(value) { return `${value > 0 ? "+" : ""}${value}%`; }
  function scoreClass(bucket) { return bucket.toLowerCase(); }

  function renderSummary() {
    document.getElementById("total-count").textContent = scoredMerchants.length;
    ["Low", "Medium", "High"].forEach(bucket => {
      document.getElementById(`${bucket.toLowerCase()}-count`).textContent = scoredMerchants.filter(m => m.bucket === bucket).length;
    });
  }

  function breakdownRows(merchant) {
    return Object.entries(merchant.factors).map(([key, points]) => `<div class="breakdown-row"><span>${FACTOR_LABELS[key]}</span><div class="meter"><i style="width:${(points / ({lastLogin:30,usageTrend:25,paymentFailures:20,supportTickets:15,nps:10}[key])) * 100}%"></i></div><b>${points} pts</b></div>`).join("");
  }

  function renderTable() {
    const visible = scoredMerchants.filter(m => filter === "All" || m.bucket === filter).sort((a, b) => descending ? b.score - a.score : a.score - b.score);
    document.getElementById("result-count").textContent = `${visible.length} merchant${visible.length === 1 ? "" : "s"} shown`;
    document.getElementById("empty-state").hidden = visible.length !== 0;
    body.innerHTML = visible.map(m => `
      <tr class="merchant-row ${expandedId === m.id ? "is-expanded" : ""}" data-id="${m.id}" tabindex="0" aria-expanded="${expandedId === m.id}">
        <td data-label="Merchant"><strong>${m.name}</strong><small>Joined ${m.signupDate}</small></td>
        <td data-label="Plan"><span class="plan ${m.plan}">${m.plan}</span></td>
        <td data-label="MRR">${money(m.mrr)}</td>
        <td data-label="Last login">${m.lastLoginDaysAgo === 0 ? "Today" : `${m.lastLoginDaysAgo}d ago`}</td>
        <td data-label="Usage, 30d" class="${m.usageTrend30d < 0 ? "negative" : "positive"}">${trend(m.usageTrend30d)}</td>
        <td data-label="Risk"><span class="badge ${scoreClass(m.bucket)}">${m.bucket}</span></td>
        <td data-label="Score"><strong>${m.score}</strong><span class="out-of">/100</span></td>
      </tr>
      ${expandedId === m.id ? `<tr class="detail-row"><td colspan="7"><div class="details"><section><h3>Score breakdown</h3>${breakdownRows(m)}</section><section><h3>Risk focus</h3><p><strong>${m.dominantFactors.length ? factorNames(m.dominantFactors) : "No active risk signals"}</strong></p><h3>Recommended action</h3><p>${m.recommendation}</p></section></div></td></tr>` : ""}
    `).join("");
  }

  body.addEventListener("click", event => { const row = event.target.closest(".merchant-row"); if (row) { expandedId = expandedId === row.dataset.id ? null : row.dataset.id; renderTable(); } });
  body.addEventListener("keydown", event => { if ((event.key === "Enter" || event.key === " ") && event.target.matches(".merchant-row")) { event.preventDefault(); event.target.click(); } });
  document.getElementById("risk-filter").addEventListener("change", event => { filter = event.target.value; expandedId = null; renderTable(); });
  document.getElementById("sort-risk").addEventListener("click", () => { descending = !descending; document.querySelector("#sort-risk span").textContent = descending ? "↓" : "↑"; renderTable(); });

  // Exposed for transparent scoring checks or reuse without a module loader.
  window.scoreMerchant = scoreMerchant;
  window.scoredMerchants = scoredMerchants;
  renderSummary();
  renderTable();
})();
