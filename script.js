(() => {
  const { FACTOR_LABELS, FACTOR_MAX, scoreMerchant, factorNames } = window.MerchantScoring;

  // A malformed record is skipped (and reported) instead of being shown with a NaN score.
  const scoredMerchants = merchants.flatMap(merchant => {
    try { return [scoreMerchant(merchant)]; } catch (error) { console.warn(error.message); return []; }
  });
  let filter = "All";
  let descending = true;
  let expandedId = null;
  const body = document.getElementById("merchant-body");

  // Merchant fields are interpolated into innerHTML, so escape them to keep
  // names or other text from the data source from being parsed as markup.
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  }

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
    return Object.entries(merchant.factors).map(([key, points]) => `<div class="breakdown-row"><span>${FACTOR_LABELS[key]}</span><div class="meter"><i style="width:${(points / FACTOR_MAX[key]) * 100}%"></i></div><b>${points} pts</b></div>`).join("");
  }

  function renderTable() {
    const visible = scoredMerchants.filter(m => filter === "All" || m.bucket === filter).sort((a, b) => descending ? b.score - a.score : a.score - b.score);
    document.getElementById("result-count").textContent = `${visible.length} merchant${visible.length === 1 ? "" : "s"} shown`;
    document.getElementById("empty-state").hidden = visible.length !== 0;
    body.innerHTML = visible.map(m => `
      <tr class="merchant-row ${expandedId === m.id ? "is-expanded" : ""}" data-id="${escapeHtml(m.id)}" tabindex="0" aria-expanded="${expandedId === m.id}">
        <td data-label="Merchant"><strong>${escapeHtml(m.name)}</strong><small>Joined ${escapeHtml(m.signupDate)}</small></td>
        <td data-label="Plan"><span class="plan ${escapeHtml(m.plan)}">${escapeHtml(m.plan)}</span></td>
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
