// apps-filter.js — llll-ll ポータルの「アプリ一覧フィルタ＆検索」の島（vanilla JS・依存なし）。
//
// 設計（Issue #4 / Phase 1）:
//   - 全カードは Tera が描画済み。この島は「非該当を隠す」一方向だけに作用する。
//   - JS が読めない / 無効でも、input は素の入力欄・チップは無反応で、全カードが見えたまま（PE）。
//   - 判定ロジック cardMatches() は DOM 非依存の純粋関数として切り出し、テストから import できる。
//
// 仕様:
//   - テキスト検索: input 値（小文字・trim）で card.search を部分一致。空なら全通過。
//   - タグフィルタ（AND）: アクティブな全タグを card.tags が含むものだけ通過。
//   - featured トグル: アクティブ時は card.featured===true のカードだけ通過。
//   - All: 全フィルタ解除（タグ非アクティブ・featured 解除・検索クリア）。

/**
 * 1枚のカードがフィルタ条件に合致するかを判定する純粋関数。DOM 非依存。
 *
 * @param {string} search - 検索語（呼び出し側で小文字・trim 済みを想定）。空文字なら検索条件なし。
 * @param {string[]|Set<string>} activeTags - アクティブなタグ（小文字）。AND 条件。空なら条件なし。
 * @param {boolean} featuredOnly - featured のみに絞るか。
 * @param {{tags: string[]|Set<string>, search: string, featured: boolean}} card
 *        - tags: カードの全タグ（小文字）。search: 検索対象文字列（小文字）。featured: 注目フラグ。
 * @returns {boolean} 表示すべきなら true、隠すべきなら false。
 */
function cardMatches(search, activeTags, featuredOnly, card) {
  // featured 絞り込み
  if (featuredOnly && !card.featured) return false;

  // テキスト検索（部分一致）
  if (search && card.search.indexOf(search) === -1) return false;

  // タグ AND 絞り込み
  const cardTags = card.tags instanceof Set ? card.tags : new Set(card.tags);
  const required = activeTags instanceof Set ? activeTags : new Set(activeTags);
  for (const t of required) {
    if (!cardTags.has(t)) return false;
  }

  return true;
}

// テスト用に export（ブラウザでは module ではないので typeof ガード）。
if (typeof module !== "undefined" && module.exports) {
  module.exports = { cardMatches };
}

(function () {
  // テスト時（module 環境）は DOM 配線を走らせない。
  if (typeof document === "undefined") return;

  const root = document.getElementById("apps");
  if (!root) return;

  const searchInput = root.querySelector(".filter-search");
  const cardEls = Array.from(root.querySelectorAll(".card"));
  const noResults = root.querySelector(".no-results");

  const allChip = root.querySelector("[data-filter-all]");
  const featuredChip = root.querySelector("[data-filter-featured]");
  const tagChips = Array.from(root.querySelectorAll(".filter-chip[data-filter-tag]"));

  // 各カードを正規化（DOM 1回だけ読む）。
  const cards = cardEls.map((el) => ({
    el,
    tags: new Set((el.getAttribute("data-tags") || "").split(/\s+/).filter(Boolean)),
    search: (el.getAttribute("data-search") || ""),
    featured: el.getAttribute("data-featured") === "true",
  }));

  function setChipActive(chip, active) {
    chip.classList.toggle("active", active);
    chip.setAttribute("aria-pressed", active ? "true" : "false");
  }

  function isChipActive(chip) {
    return chip.getAttribute("aria-pressed") === "true";
  }

  function apply() {
    const search = (searchInput ? searchInput.value : "").trim().toLowerCase();
    const featuredOnly = featuredChip ? isChipActive(featuredChip) : false;
    const activeTags = new Set(
      tagChips.filter(isChipActive).map((c) => (c.getAttribute("data-filter-tag") || "").toLowerCase())
    );

    // フィルタが1つでも効いていれば All は非アクティブ、何もなければ All アクティブ。
    const anyFilter = featuredOnly || activeTags.size > 0 || search.length > 0;
    if (allChip) setChipActive(allChip, !anyFilter);

    let shown = 0;
    for (const card of cards) {
      const match = cardMatches(search, activeTags, featuredOnly, card);
      card.el.hidden = !match;
      if (match) shown++;
    }
    if (noResults) noResults.hidden = shown !== 0;
  }

  function clearAll() {
    if (searchInput) searchInput.value = "";
    for (const c of tagChips) setChipActive(c, false);
    if (featuredChip) setChipActive(featuredChip, false);
    apply();
  }

  // 配線。
  if (searchInput) searchInput.addEventListener("input", apply);

  for (const chip of tagChips) {
    chip.addEventListener("click", () => {
      setChipActive(chip, !isChipActive(chip));
      apply();
    });
  }

  if (featuredChip) {
    featuredChip.addEventListener("click", () => {
      setChipActive(featuredChip, !isChipActive(featuredChip));
      apply();
    });
  }

  if (allChip) {
    allChip.addEventListener("click", clearAll);
  }

  // カード内のタグクリック → そのタグでフィルタ（#14 kako-jun）。該当フィルタチップを ON にして適用し、
  // フィルタ結果が見えるよう apps セクション先頭へスクロールする。app-popup.js 側はこのクリックを無視する。
  root.addEventListener("click", (e) => {
    const ct = e.target.closest("[data-card-tag], [data-card-featured]");
    if (!ct) return;
    e.preventDefault();
    if (ct.hasAttribute("data-card-featured")) {
      if (featuredChip) setChipActive(featuredChip, true);
    } else {
      const val = (ct.getAttribute("data-card-tag") || "").toLowerCase();
      const chip = tagChips.find((c) => (c.getAttribute("data-filter-tag") || "").toLowerCase() === val);
      if (chip) setChipActive(chip, true);
    }
    apply();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // 初期状態を反映（All アクティブ・全件表示）。
  apply();
})();
