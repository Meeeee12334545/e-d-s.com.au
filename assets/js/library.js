// Resources: the document library. Filters by range and type, a search box,
// and the first twelve rows until "Show all" is pressed. Searching or
// filtering shows every match.
(() => {
  const lib = document.querySelector(".library");
  if (!lib) return;
  const rows = [...lib.querySelectorAll("tbody tr")];
  const input = lib.querySelector("input[type=search]");
  const groups = [...lib.querySelectorAll("[data-lib-filter]")];
  const count = lib.querySelector(".finder-count");
  const more = lib.querySelector("[data-lib-more]");
  const empty = lib.querySelector(".finder-empty");
  const LIMIT = rows.filter((r) => !r.hidden).length || 12;
  const state = { range: "", type: "", expanded: false };

  function apply() {
    const terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const filtering = Boolean(terms.length || state.range || state.type);
    let matched = 0, shown = 0;
    for (const row of rows) {
      const ok = terms.every((t) => row.dataset.search.includes(t)) && (!state.range || row.dataset.range === state.range) && (!state.type || row.dataset.type === state.type);
      if (ok) matched++;
      const show = ok && (filtering || state.expanded || matched <= LIMIT);
      row.hidden = !show;
      if (show) shown++;
    }
    count.textContent = filtering ? `${matched} of ${rows.length} documents` : shown < rows.length ? `Showing ${shown} of ${rows.length} documents` : `All ${rows.length} documents`;
    more.parentElement.hidden = filtering || state.expanded || rows.length <= LIMIT;
    empty.hidden = matched > 0;
  }
  for (const group of groups) {
    const chips = [...group.querySelectorAll(".fchip")];
    chips.forEach((chip) =>
      chip.addEventListener("click", () => {
        state[group.dataset.libFilter] = chip.dataset.value;
        chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
        apply();
      })
    );
  }
  input.addEventListener("input", apply);
  more.addEventListener("click", () => {
    state.expanded = true;
    apply();
    rows.find((r) => !r.hidden && rows.indexOf(r) >= LIMIT)?.querySelector("a")?.focus({ preventScroll: true });
  });
  lib.querySelector("[data-lib-reset]").addEventListener("click", () => {
    input.value = "";
    groups.forEach((g) => g.querySelector(".fchip").click());
    input.focus();
  });
})();
