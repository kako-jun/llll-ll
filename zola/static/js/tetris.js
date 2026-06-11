// tetris.js — llll-ll ポータルの「ヘッダ Tetris」の島（vanilla JS・依存なし）。
//
// 設計（Issue #7 / Phase 2）:
//   - React 版 `src/lib/tetris.ts`（純粋ロジック）＋ `useTetrisGame`（状態機械）を素 JS へ移植。
//   - プレイフィールドは header パネルの `.tetris-bg`（inset:0 で panel 全面を覆う）。
//     ブロックは panel 背面（z-index 0）に下から積む。ロゴ/本文は前面（z-index 1）のまま読める。
//   - 操作: panel クリックでその列に投下 / ブロッククリックで消滅（shrinkToCenter）＋上のブロックは落下。
//     自動スポーン / 行揃いで消去 / 列が MAX_STACK 超でリセット。React 版と同挙動。
//   - PE: JS 無効/失敗なら破線帯＋"tetris" ラベルが残るだけ（壊れない）。JS 起動時に `tetris-live` で
//     プレースホルダ表示を消し、実描画へ切替。
//
// グリッド表現は React 版と同じ: grid[column][row]。row 0 が一番下、row GRID_HEIGHT-1 が上。
// 落下ブロックは y を grid 単位で持ち（y * BLOCK_SIZE = ピクセル top）、着地計算と描画で同じ数を使う。

// ── 純粋ロジック（src/lib/tetris.ts と等価。テストから import できるよう純粋関数に保つ）──

const BLOCK_SIZE = 16;
const GRID_HEIGHT = 4;
/** いずれかの列がこの数を超えたらグリッド全体を自動リセットする。 */
const MAX_STACK = 3;

/** width × height の false 二次元配列を作る（grid[column][row]）。 */
function createEmptyGrid(width, height = GRID_HEIGHT) {
  return Array.from({ length: width }, () => new Array(height).fill(false));
}

/** grid のディープコピー（ネスト1段）を返す。 */
function cloneGrid(grid) {
  return grid.map((col) => [...col]);
}

/** containerWidth(px) に収まる列数を blockSize で割って floor する。 */
function computeGridWidth(containerWidth, blockSize = BLOCK_SIZE) {
  if (containerWidth <= 0 || blockSize <= 0) return 0;
  return Math.floor(containerWidth / blockSize);
}

/** クリック x（コンテナ相対）を列インデックスへ。[0, gridWidth-1] にクランプ。列が無ければ -1。 */
function columnFromClickX(clickX, gridWidth, blockSize = BLOCK_SIZE) {
  if (gridWidth <= 0) return -1;
  const column = Math.floor(clickX / blockSize);
  return Math.max(0, Math.min(column, gridWidth - 1));
}

/** column の最も下の空き row を返す（row 0 が下）。満杯/範囲外なら -1。 */
function findBottomEmptyRow(grid, column) {
  if (column < 0 || column >= grid.length) return -1;
  const col = grid[column];
  for (let y = 0; y < col.length; y++) {
    if (!col[y]) return y;
  }
  return -1;
}

/** column に積まれたブロック数を数える。 */
function getStackHeight(grid, column) {
  if (column < 0 || column >= grid.length) return 0;
  return grid[column].reduce((sum, filled) => sum + (filled ? 1 : 0), 0);
}

/** いずれかの列が maxStack を超えたら true。 */
function isOverflowing(grid, maxStack = MAX_STACK) {
  for (let x = 0; x < grid.length; x++) {
    if (getStackHeight(grid, x) > maxStack) return true;
  }
  return false;
}

/** 全列が埋まっている row のインデックス配列を返す。 */
function findCompletedRows(grid) {
  if (grid.length === 0) return [];
  const height = grid[0].length;
  const completed = [];
  for (let y = 0; y < height; y++) {
    let isFull = true;
    for (let x = 0; x < grid.length; x++) {
      if (!grid[x][y]) {
        isFull = false;
        break;
      }
    }
    if (isFull) completed.push(y);
  }
  return completed;
}

/** (column, row) にブロックを置く。範囲外/既に埋まっていれば入力をそのまま返す。 */
function placeBlock(grid, column, row) {
  if (column < 0 || column >= grid.length) return grid;
  if (row < 0 || row >= grid[column].length) return grid;
  if (grid[column][row]) return grid;
  const next = cloneGrid(grid);
  next[column][row] = true;
  return next;
}

/** rows を消し、その上に乗っていたブロックを「再落下」状態として集める。 */
function clearRowsAndCollectFalling(grid, rows) {
  if (rows.length === 0) return { grid, fallingFromClear: [] };

  const next = cloneGrid(grid);
  for (const row of rows) {
    for (let x = 0; x < next.length; x++) {
      next[x][row] = false;
    }
  }

  const falling = [];
  for (let x = 0; x < next.length; x++) {
    for (let y = next[x].length - 1; y >= 0; y--) {
      // 消えた row が1つでも下にあるブロックは落ちる必要がある。
      if (next[x][y] && rows.some((row) => row < y)) {
        falling.push({ x, previousRow: y });
        next[x][y] = false;
      }
    }
  }

  return { grid: next, fallingFromClear: falling };
}

/** (column, row) のブロックを除去し、その上に積まれていたブロックを落下状態へ。 */
function removeBlockAndCascade(grid, column, row) {
  if (column < 0 || column >= grid.length) return { grid, falling: [] };
  if (row < 0 || row >= grid[column].length) return { grid, falling: [] };

  const next = cloneGrid(grid);
  next[column][row] = false;
  const falling = [];
  for (let y = row + 1; y < next[column].length; y++) {
    if (next[column][y]) {
      falling.push({ x: column, previousRow: y });
      next[column][y] = false;
    }
  }
  return { grid: next, falling };
}

/** previousRow（row インデックス）を落下ブロックの y（grid 単位）へ変換する。
 *  containerHeight はプレイフィールドの高さ(px)。 */
function gridUnitYForRow(previousRow, containerHeight, blockSize = BLOCK_SIZE) {
  return (containerHeight - blockSize * (previousRow + 1)) / blockSize;
}

// テスト用に export（ブラウザでは module ではないので typeof ガード）。
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    BLOCK_SIZE,
    GRID_HEIGHT,
    MAX_STACK,
    createEmptyGrid,
    cloneGrid,
    computeGridWidth,
    columnFromClickX,
    findBottomEmptyRow,
    getStackHeight,
    isOverflowing,
    findCompletedRows,
    placeBlock,
    clearRowsAndCollectFalling,
    removeBlockAndCascade,
    gridUnitYForRow,
  };
}

// ── DOM 配線（島本体・useTetrisGame の状態機械を素 JS の setInterval で再現）──

(function () {
  // テスト時（module 環境）は DOM 配線を走らせない。
  if (typeof document === "undefined") return;

  // useTetrisGame の定数（ms）。
  const ANIMATION_INTERVAL_MS = 33; // ~30fps。装飾なのでこれで十分。
  const CLEAR_CHECK_DELAY_MS = 50; // 着地後、行揃いチェックまでの間（着地が見える）。
  const DISAPPEAR_ANIMATION_MS = 400; // 消滅レイヤに留まる時間（CSS と一致させる）。
  const INITIAL_AUTO_SPAWN_MS = 4000; // 最初の自動スポーンまで。
  const AUTO_SPAWN_INTERVAL_MS = 42000; // 以降の自動スポーン間隔。
  // 新規ブロックは積み帯（最下段 GRID_HEIGHT 行＝下 64px）の1段上から落とす。
  // React 版はヘッダ高さ＝積み帯高さだったため固定 -2 でよかったが、こちらは panel が高い（~215px）。
  // パネル全高を漂わせると本文上を 7s かけて横切り間延びするので、帯の直上から短く（~2s）落とす。

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () {
    const panel = document.querySelector(".panel-header");
    const field = panel && panel.querySelector(".tetris-bg");
    if (!panel || !field) return; // PE: 無ければ何もしない。

    // 起動: プレースホルダ表示（破線・"tetris" ラベル）を消して実描画に切替。
    field.classList.add("tetris-live");
    // 装飾なので支援技術からは隠す（中の本文 logo/prose は .tetris-bg の外なので影響しない）。
    field.setAttribute("aria-hidden", "true");

    // ブロックを置く2レイヤ（固定＋落下を staticLayer、消滅を別 layer）。
    const staticLayer = document.createElement("div");
    staticLayer.className = "tetris-layer";
    field.appendChild(staticLayer);
    const fxLayer = document.createElement("div");
    fxLayer.className = "tetris-layer tetris-layer-fx";
    field.appendChild(fxLayer);

    let grid = [];
    let gridWidth = 0;
    let falling = []; // { id, x, y(grid単位) }
    let nextId = 1;

    function fieldHeight() {
      return field.getBoundingClientRect().height || GRID_HEIGHT * BLOCK_SIZE;
    }

    function initGrid() {
      const w = computeGridWidth(field.getBoundingClientRect().width);
      if (w !== gridWidth) {
        gridWidth = w;
        grid = createEmptyGrid(gridWidth);
        falling = [];
        render();
      }
    }

    // ── 描画 ── 固定グリッド＋落下中ブロックを作り直す。
    //   消滅アニメ中のブロックは fxLayer に独立して存在し、ここでは触らない。
    //   固定ブロックには (col,row) を data 属性で持たせ、クリック消去は逆算でなくこれを読む（高さ変化に強い）。
    function render() {
      const h = fieldHeight();
      const frag = document.createDocumentFragment();
      for (let x = 0; x < grid.length; x++) {
        for (let y = 0; y < grid[x].length; y++) {
          if (!grid[x][y]) continue;
          const pixelTop = h - BLOCK_SIZE * (y + 1);
          frag.appendChild(makeBlock(x * BLOCK_SIZE, pixelTop, x, y));
        }
      }
      // 落下中ブロックは非インタラクティブ（クリックは下の field に透過＝投下になる。React 版と同じ）。
      for (const b of falling) {
        frag.appendChild(makeBlock(b.x * BLOCK_SIZE, b.y * BLOCK_SIZE));
      }
      staticLayer.replaceChildren(frag);
    }

    // col/row を渡したものだけ「固定ブロック＝クリックで消せる」にする（data-block + data-col/row）。
    function makeBlock(left, top, col, row) {
      const el = document.createElement("div");
      el.className = "tetris-block";
      el.style.left = left + "px";
      el.style.top = top + "px";
      if (col !== undefined) {
        el.dataset.block = "true";
        el.dataset.col = col;
        el.dataset.row = row;
      }
      return el;
    }

    // 積み帯の1段上（pixelTop = h - BLOCK_SIZE*(GRID_HEIGHT+1)）を grid 単位にした初期 y。
    // h が小さい（モバイルで panel が低い）と負になり、従来どおり視界の上から落ちる。
    function spawnGridY() {
      return (fieldHeight() - BLOCK_SIZE * (GRID_HEIGHT + 1)) / BLOCK_SIZE;
    }

    function spawn(column) {
      if (column < 0 || column >= gridWidth) return;
      falling.push({ id: nextId++, x: column, y: spawnGridY() });
    }

    // ── 落下アニメ（useTetrisGame の falling-block ループ相当）──
    function tick() {
      if (gridWidth === 0) return;
      // 動くもの（落下中ブロック）が無ければ何もしない。固定ブロックは静止しているので毎フレーム
      // 描き直す必要は無く、reflow も DOM 再生成も避ける（装飾の常時アイドルを軽くする）。
      // 高さ変化への追従は下の ResizeObserver が担う。
      if (falling.length === 0) return;
      const h = fieldHeight();
      const landings = [];
      const reserved = new Map(); // column -> このtickで次に空く row
      const stillFalling = [];

      for (const block of falling) {
        const nextPixelY = block.y * BLOCK_SIZE + 1;
        if (nextPixelY < 0) {
          stillFalling.push({ ...block, y: nextPixelY / BLOCK_SIZE });
          continue;
        }
        const baseRow = findBottomEmptyRow(grid, block.x);
        if (baseRow === -1) continue; // 列が満杯 → 捨てる。overflow 監視がリセットする。

        const res = reserved.get(block.x);
        const targetRow = res !== undefined ? res : baseRow;
        if (targetRow >= GRID_HEIGHT) continue;

        const landingPixelY = h - BLOCK_SIZE * (targetRow + 1);
        if (nextPixelY >= landingPixelY) {
          landings.push({ column: block.x, row: targetRow });
          reserved.set(block.x, targetRow + 1);
        } else {
          stillFalling.push({ ...block, y: nextPixelY / BLOCK_SIZE });
        }
      }
      falling = stillFalling;

      if (landings.length > 0) {
        for (const { column, row } of landings) {
          grid = placeBlock(grid, column, row);
        }
        afterGridChange();
      }
      render();
    }

    // grid 変化後: 行揃いチェック（着地が見えるよう少し遅延）＋ overflow リセット。
    let clearTimer = null;
    function afterGridChange() {
      if (isOverflowing(grid)) {
        grid = createEmptyGrid(gridWidth);
        falling = [];
        return;
      }
      const completed = findCompletedRows(grid);
      if (completed.length === 0) return;
      if (clearTimer) clearTimeout(clearTimer);
      clearTimer = setTimeout(() => {
        clearTimer = null;
        const h = fieldHeight();
        const res = clearRowsAndCollectFalling(grid, findCompletedRows(grid));
        grid = res.grid;
        for (const { x, previousRow } of res.fallingFromClear) {
          falling.push({ id: nextId++, x, y: gridUnitYForRow(previousRow, h) });
        }
        render();
      }, CLEAR_CHECK_DELAY_MS);
    }

    // ── クリック: ブロックなら消滅、空きなら投下 ──
    function onClick(e) {
      // ロゴ/タグライン/本文（前面 z-index 1）やリンクのクリックはゲームにしない。
      const t = e.target;
      if (t.closest("a, .logo, .tagline, .header-prose")) return;

      if (t.dataset && t.dataset.block === "true") {
        removeAt(t);
        return;
      }
      const rect = field.getBoundingClientRect();
      const column = columnFromClickX(e.clientX - rect.left, gridWidth);
      spawn(column);
    }

    // クリックされた固定ブロックを消す。位置は data-col/data-row から読む（高さ逆算しない＝高さ変化に強い）。
    function removeAt(el) {
      const h = fieldHeight();
      const x = parseInt(el.dataset.col, 10);
      const row = parseInt(el.dataset.row, 10);
      if (Number.isNaN(x) || Number.isNaN(row) || !grid[x] || !grid[x][row]) return; // 不整合は無視。

      // 消滅アニメ用の独立ブロックを fxLayer に出す（render に消されない）。
      const fx = makeBlock(x * BLOCK_SIZE, h - BLOCK_SIZE * (row + 1));
      fx.classList.add("tetris-block-fx");
      fxLayer.appendChild(fx);
      setTimeout(() => fx.remove(), DISAPPEAR_ANIMATION_MS);

      const res = removeBlockAndCascade(grid, x, row);
      grid = res.grid;
      for (const { x: fx2, previousRow } of res.falling) {
        falling.push({ id: nextId++, x: fx2, y: gridUnitYForRow(previousRow, h) });
      }
      render();
    }

    // ── 起動 ──
    panel.addEventListener("click", onClick);
    panel.style.cursor = "crosshair";
    window.addEventListener("resize", initGrid);
    // field のサイズが変わったら固定ブロックを下端へ貼り直す（mypace/daily の非同期ロードで panel 高が
    // 変わっても追従する。毎フレーム render しない代わりの追従手段）。幅変化は initGrid（resize）が拾う。
    if (typeof ResizeObserver === "function") {
      let lastH = -1;
      const ro = new ResizeObserver(function () {
        const h = Math.round(field.getBoundingClientRect().height);
        if (h !== lastH) {
          lastH = h;
          render();
        }
      });
      ro.observe(field);
    }
    initGrid();
    setInterval(tick, ANIMATION_INTERVAL_MS);

    // 自動スポーンは「自発的に動く」演出。prefers-reduced-motion 時は出さない（クリック投下は残す）。
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) {
      setTimeout(function autoSpawn() {
        spawn(Math.floor(Math.random() * gridWidth));
      }, INITIAL_AUTO_SPAWN_MS);
      setInterval(function () {
        spawn(Math.floor(Math.random() * gridWidth));
      }, AUTO_SPAWN_INTERVAL_MS);
    }
  });
})();
