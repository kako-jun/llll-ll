import { describe, it, expect } from "vitest";
// tetris.js は island（vanilla JS・module.exports ガード）。純粋ロジックだけ取り出して検証する。
// daily-art.test.js と同じく、Vite の CJS interop で module.exports のプロパティを named import できる。
// DOM 配線の IIFE は jsdom 下でも `.panel-header` が無ければ早期 return するので副作用なし。
// 移行元 src/lib/tetris.test.ts と同じ観点を素 JS 版に対して回す（#7）。
import {
  BLOCK_SIZE,
  GRID_HEIGHT,
  MAX_STACK,
  clearRowsAndCollectFalling,
  cloneGrid,
  columnFromClickX,
  computeGridWidth,
  createEmptyGrid,
  findBottomEmptyRow,
  findCompletedRows,
  getStackHeight,
  gridUnitYForRow,
  isOverflowing,
  placeBlock,
  removeBlockAndCascade,
} from "../static/js/tetris.js";

describe("constants", () => {
  it("BLOCK_SIZE が描画と同じ 16", () => {
    expect(BLOCK_SIZE).toBe(16);
  });

  it("MAX_STACK < GRID_HEIGHT（満杯の列は必ず overflow 判定される）", () => {
    expect(GRID_HEIGHT).toBeGreaterThan(MAX_STACK);
  });
});

describe("createEmptyGrid", () => {
  it("width × height の false 配列を返す", () => {
    expect(createEmptyGrid(3, 2)).toEqual([
      [false, false],
      [false, false],
      [false, false],
    ]);
  });

  it("height 既定は GRID_HEIGHT", () => {
    expect(createEmptyGrid(1)[0]).toHaveLength(GRID_HEIGHT);
  });

  it("列配列は独立（片方を変えても他に影響しない）", () => {
    const g = createEmptyGrid(2, 1);
    g[0][0] = true;
    expect(g[1][0]).toBe(false);
  });
});

describe("cloneGrid", () => {
  it("別参照のディープコピーを返す", () => {
    const g = [
      [true, false],
      [false, true],
    ];
    const clone = cloneGrid(g);
    expect(clone).toEqual(g);
    expect(clone).not.toBe(g);
    expect(clone[0]).not.toBe(g[0]);
  });
});

describe("computeGridWidth", () => {
  it("containerWidth / blockSize を floor", () => {
    expect(computeGridWidth(160, 16)).toBe(10);
    expect(computeGridWidth(159, 16)).toBe(9);
  });

  it("非正の入力は 0", () => {
    expect(computeGridWidth(0, 16)).toBe(0);
    expect(computeGridWidth(-10, 16)).toBe(0);
    expect(computeGridWidth(160, 0)).toBe(0);
  });
});

describe("columnFromClickX", () => {
  it("クリック x を列へ", () => {
    expect(columnFromClickX(0, 10, 16)).toBe(0);
    expect(columnFromClickX(15, 10, 16)).toBe(0);
    expect(columnFromClickX(16, 10, 16)).toBe(1);
  });

  it("右端を超えたら最終列にクランプ", () => {
    expect(columnFromClickX(9999, 10, 16)).toBe(9);
  });

  it("負なら 0 にクランプ", () => {
    expect(columnFromClickX(-5, 10, 16)).toBe(0);
  });

  it("列が無ければ -1", () => {
    expect(columnFromClickX(5, 0, 16)).toBe(-1);
  });
});

describe("findBottomEmptyRow", () => {
  const g = [
    [true, false, false, false],
    [true, true, true, true],
    [false, false, false, false],
  ];

  it("最も下の空き row", () => {
    expect(findBottomEmptyRow(g, 0)).toBe(1);
    expect(findBottomEmptyRow(g, 2)).toBe(0);
  });

  it("満杯の列は -1", () => {
    expect(findBottomEmptyRow(g, 1)).toBe(-1);
  });

  it("範囲外は -1", () => {
    expect(findBottomEmptyRow(g, -1)).toBe(-1);
    expect(findBottomEmptyRow(g, 999)).toBe(-1);
  });
});

describe("getStackHeight", () => {
  it("列ごとの埋まり数を数える", () => {
    const g = [
      [true, true, false, false],
      [false, false, false, false],
    ];
    expect(getStackHeight(g, 0)).toBe(2);
    expect(getStackHeight(g, 1)).toBe(0);
  });

  it("範囲外は 0", () => {
    const g = createEmptyGrid(3);
    expect(getStackHeight(g, -1)).toBe(0);
    expect(getStackHeight(g, 99)).toBe(0);
  });
});

describe("isOverflowing", () => {
  it("MAX_STACK 超の列があれば true", () => {
    const g = [
      [true, true, true, true],
      [false, false, false, false],
    ];
    expect(isOverflowing(g)).toBe(true);
  });

  it("全列が範囲内なら false", () => {
    const g = [
      [true, true, true, false],
      [true, false, false, false],
    ];
    expect(isOverflowing(g)).toBe(false);
  });
});

describe("findCompletedRows", () => {
  it("全列が埋まった row を返す", () => {
    const g = [
      [true, true, false, false],
      [true, false, false, false],
      [true, true, false, false],
    ];
    expect(findCompletedRows(g)).toEqual([0]);
  });

  it("複数の満杯 row を返す", () => {
    const g = [
      [true, true, true, false],
      [true, true, true, false],
    ];
    expect(findCompletedRows(g)).toEqual([0, 1, 2]);
  });

  it("空グリッドは []", () => {
    expect(findCompletedRows([])).toEqual([]);
  });
});

describe("placeBlock", () => {
  it("クローン上で対象セルを true に", () => {
    const g = createEmptyGrid(2);
    const next = placeBlock(g, 0, 0);
    expect(next).not.toBe(g);
    expect(g[0][0]).toBe(false);
    expect(next[0][0]).toBe(true);
  });

  it("既に埋まっていれば no-op（同一参照）", () => {
    const g = [[true, false, false, false]];
    expect(placeBlock(g, 0, 0)).toBe(g);
  });

  it("範囲外は no-op", () => {
    const g = createEmptyGrid(2);
    expect(placeBlock(g, -1, 0)).toBe(g);
    expect(placeBlock(g, 99, 0)).toBe(g);
    expect(placeBlock(g, 0, -1)).toBe(g);
    expect(placeBlock(g, 0, 99)).toBe(g);
  });
});

describe("clearRowsAndCollectFalling", () => {
  it("対象 row を消し、上に乗っていたブロックを再落下へ", () => {
    const g = [
      [true, true, false, false],
      [true, false, false, false],
    ];
    const { grid, fallingFromClear } = clearRowsAndCollectFalling(g, [0]);
    expect(grid).toEqual([
      [false, false, false, false],
      [false, false, false, false],
    ]);
    expect(fallingFromClear).toEqual([{ x: 0, previousRow: 1 }]);
  });

  it("rows 空なら何もしない（同一参照）", () => {
    const g = [[true, false, false, false]];
    const { grid, fallingFromClear } = clearRowsAndCollectFalling(g, []);
    expect(grid).toBe(g);
    expect(fallingFromClear).toEqual([]);
  });

  it("消えた行の上だけ再落下（挟まれたブロックは残らず落ちる）", () => {
    const g = [[true, false, true, true]];
    const { grid, fallingFromClear } = clearRowsAndCollectFalling(g, [0, 2]);
    expect(grid).toEqual([[false, false, false, false]]);
    expect(fallingFromClear).toEqual([{ x: 0, previousRow: 3 }]);
  });

  it("多列・多行の消去", () => {
    const g = [
      [true, true, false, false],
      [true, true, false, false],
      [true, true, true, false],
    ];
    expect(findCompletedRows(g)).toEqual([0, 1]);
    const { grid, fallingFromClear } = clearRowsAndCollectFalling(g, [0, 1]);
    expect(grid).toEqual([
      [false, false, false, false],
      [false, false, false, false],
      [false, false, false, false],
    ]);
    expect(fallingFromClear).toEqual([{ x: 2, previousRow: 2 }]);
  });
});

describe("removeBlockAndCascade", () => {
  it("対象セルを消し、上のブロックを落下へ", () => {
    const g = [[true, true, true, false]];
    const { grid, falling } = removeBlockAndCascade(g, 0, 0);
    expect(grid).toEqual([[false, false, false, false]]);
    expect(falling).toEqual([
      { x: 0, previousRow: 1 },
      { x: 0, previousRow: 2 },
    ]);
  });

  it("範囲外は no-op", () => {
    const g = createEmptyGrid(2);
    expect(removeBlockAndCascade(g, -1, 0).grid).toBe(g);
    expect(removeBlockAndCascade(g, 0, -1).grid).toBe(g);
    expect(removeBlockAndCascade(g, 99, 0).grid).toBe(g);
    expect(removeBlockAndCascade(g, 0, 99).grid).toBe(g);
  });
});

describe("gridUnitYForRow", () => {
  it("row インデックスを落下ブロックの grid 単位 y へ", () => {
    expect(gridUnitYForRow(0, 64, 16)).toBe(3);
    expect(gridUnitYForRow(1, 64, 16)).toBe(2);
  });

  it("blockSize 既定は BLOCK_SIZE", () => {
    expect(gridUnitYForRow(0, 64)).toBe(3);
  });
});
