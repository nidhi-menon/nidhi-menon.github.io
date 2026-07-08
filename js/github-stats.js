(function () {
  const STATS_URL = "https://raw.githubusercontent.com/nidhi-menon/nidhi-gh-stats/main/metrics-history.json";
  const TOP_N = 6;

  // Short repo names to hide without removing from collection.
  const EXCLUDE = new Set([
    // "repo-name",
  ]);

  const ICON_STAR  = `<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>`;
  const ICON_FORK  = `<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>`;
  const ICON_EYE   = `<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.825 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z"/></svg>`;
  const ICON_CLONE = `<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>`;

  // Views/clones are only exposed as rolling 14-day windows by the GitHub API, and those
  // windows overlap across nightly snapshots. To get a lifetime total, dedupe each repo's
  // daily counts by calendar date (across all snapshots) before summing — otherwise dates
  // covered by multiple overlapping windows would be counted more than once.
  function computeLifetimeTotals(snapshots) {
    const perRepo = {}; // name -> { views: {date: count}, clones: {date: count} }
    snapshots.forEach(s => {
      Object.entries(s.repos).forEach(([name, r]) => {
        if (!perRepo[name]) perRepo[name] = { views: {}, clones: {} };
        (r.views_daily || []).forEach(e => { perRepo[name].views[e.date] = e.count; });
        (r.clones_daily || []).forEach(e => { perRepo[name].clones[e.date] = e.count; });
      });
    });
    const totals = {};
    Object.entries(perRepo).forEach(([name, d]) => {
      totals[name] = {
        views_total: Object.values(d.views).reduce((s, v) => s + v, 0),
        clones_total: Object.values(d.clones).reduce((s, v) => s + v, 0),
      };
    });
    return totals;
  }

  function render(data) {
    const latest = data.snapshots[data.snapshots.length - 1];
    const allRepos = Object.entries(latest.repos)
      .filter(([full]) => !EXCLUDE.has(full.split("/")[1]));
    const lifetimeTotals = computeLifetimeTotals(data.snapshots);

    const totalStars    = allRepos.reduce((s, [, r]) => s + r.stars, 0);
    const totalForks    = allRepos.reduce((s, [, r]) => s + r.forks, 0);
    const totalViews    = allRepos.reduce((s, [fullName]) => s + (lifetimeTotals[fullName]?.views_total || 0), 0);
    const totalClones   = allRepos.reduce((s, [fullName]) => s + (lifetimeTotals[fullName]?.clones_total || 0), 0);
    const uniqueVisitors = allRepos.reduce((s, [, r]) => s + (r.unique_visitors_14d || 0), 0);
    const uniqueCloners  = allRepos.reduce((s, [, r]) => s + (r.unique_cloners_14d || 0), 0);

    document.getElementById("gs-kpi-row").innerHTML = `
      <div class="gs-kpi">
        <div class="gs-kpi__value">${totalStars.toLocaleString()}</div>
        <div class="gs-kpi__label">Stars</div>
      </div>
      <div class="gs-kpi">
        <div class="gs-kpi__value">${totalForks.toLocaleString()}</div>
        <div class="gs-kpi__label">Forks</div>
      </div>
      <div class="gs-kpi">
        <div class="gs-kpi__value">${totalViews.toLocaleString()}</div>
        <div class="gs-kpi__label">Views (lifetime)</div>
        <div class="gs-kpi__sub">${uniqueVisitors.toLocaleString()} unique (14d)</div>
      </div>
      <div class="gs-kpi">
        <div class="gs-kpi__value">${totalClones.toLocaleString()}</div>
        <div class="gs-kpi__label">Clones (lifetime)</div>
        <div class="gs-kpi__sub">${uniqueCloners.toLocaleString()} unique (14d)</div>
      </div>
    `;

    const top = [...allRepos]
      .sort(([nameA], [nameB]) => {
        const a = lifetimeTotals[nameA] || { views_total: 0, clones_total: 0 };
        const b = lifetimeTotals[nameB] || { views_total: 0, clones_total: 0 };
        return (b.views_total + b.clones_total) - (a.views_total + a.clones_total);
      })
      .slice(0, TOP_N);

    document.getElementById("gs-grid").innerHTML = top.map(([fullName, r]) => {
      const short = fullName.split("/")[1];
      const lifetime = lifetimeTotals[fullName] || { views_total: 0, clones_total: 0 };
      return `
        <div class="gs-card">
          <a class="gs-card__name" href="https://github.com/${fullName}" target="_blank" rel="noopener">${short}</a>
          <p class="gs-card__desc">${r.description || "No description"}</p>
          <div class="gs-card__stats">
            <span class="gs-card__stat">${ICON_STAR} ${r.stars}</span>
            <span class="gs-card__stat">${ICON_FORK} ${r.forks}</span>
            <span class="gs-card__stat">${ICON_EYE} ${lifetime.views_total}</span>
            <span class="gs-card__stat">${ICON_CLONE} ${lifetime.clones_total}</span>
          </div>
        </div>
      `;
    }).join("");

    document.getElementById("gs-note").textContent =
      `Showing top ${TOP_N} of ${allRepos.length} repos by lifetime activity · Views/clones are lifetime totals since ${data.snapshots[0].date} · Last updated ${latest.date} · Excludes forks, archived, and manually excluded repos`;
  }

  function init() {
    fetch(STATS_URL)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(render)
      .catch(() => {
        document.getElementById("gs-kpi-row").innerHTML =
          `<p class="gs-error">Could not load stats — check back shortly.</p>`;
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
