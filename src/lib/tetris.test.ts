import { describe, it, expect } from "vitest";
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
  type Grid,
} from "./tetris";

describe("constants", () => {
  it("BLOCK_SIZE matches the value used by the rendered components", () => {
    expect(BLOCK_SIZE).toBe(16);
  });

  it("MAX_STACK is one less than GRID_HEIGHT so a full column triggers overflow", () => {
    // The overflow watcher fires on `count > MAX_STACK`, so a fully-filled
    // column (GRID_HEIGHT blocks) must always be detected as overflow.
    expect(GRID_HEIGHT).toBeGreaterThan(MAX_STACK);
  });
});

describe("createEmptyGrid", () => {
  it("returns a width-by-height array of false", () => {
    const g = createEmptyGrid(3, 2);
    expect(g).toEqual([
      [false, false],
      [false, false],
      [false, false],
    ]);
  });

  it("defaults the height to GRID_HEIGHT", () => {
    expect(createEmptyGrid(1)[0]).toHaveLength(GRID_HEIGHT);
  });

  it("creates independent column arrays (mutating one does not affect another)", () => {
    const g = createEmptyGrid(2, 1);
    g[0][0] = true;
    expect(g[1][0]).toBe(false);
  });
});

describe("cloneGrid", () => {
  it("returns a deep-equal copy that is not the same reference", () => {
    const g: Grid = [
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
  it("divides the container width by the block size and floors", () => {
    expect(computeGridWidth(160, 16)).toBe(10);
    expect(computeGridWidth(159, 16)).toBe(9);
  });

  it("returns 0 for non-positive inputs", () => {
    expect(computeGridWidth(0, 16)).toBe(0);
    expect(computeGridWidth(-10, 16)).toBe(0);
    expect(computeGridWidth(160, 0)).toBe(0);
  });
});

describe("columnFromClickX", () => {
  it("maps the click x to a column index", () => {
    expect(columnFromClickX(0, 10, 16)).toBe(0);
    expect(columnFromClickX(15, 10, 16)).toBe(0);
    expect(columnFromClickX(16, 10, 16)).toBe(1);
  });

  it("clamps to the last column when the click is past the right edge", () => {
    expect(columnFromClickX(9999, 10, 16)).toBe(9);
  });

  it("clamps to 0 when the click is negative", () => {
    expect(columnFromClickX(-5, 10, 16)).toBe(0);
  });

  it("returns -1 when there are no columns", () => {
    expect(columnFromClickX(5, 0, 16)).toBe(-1);
  });
});

describe("findBottomEmptyRow", () => {
  const g: Grid = [
    [true, false, false, false], // col 0: 1 block, next empty = 1
    [true, true, true, true], //  col 1: full → -1
    [false, false, false, false], // col 2: empty → 0
  ];

  it("returns the lowest empty row", () => {
    expect(findBottomEmptyRow(g, 0)).toBe(1);
    expect(findBottomEmptyRow(g, 2)).toBe(0);
  });

  it("returns -1 for a fully-filled column", () => {
    expect(findBottomEmptyRow(g, 1)).toBe(-1);
  });

  it("returns -1 for out-of-range columns", () => {
    expect(findBottomEmptyRow(g, -1)).toBe(-1);
    expect(findBottomEmptyRow(g, 999)).toBe(-1);
  });
});

describe("getStackHeight", () => {
  it("counts filled cells per column", () => {
    const g: Grid = [
      [true, true, false, false],
      [false, false, false, false],
    ];
    expect(getStackHeight(g, 0)).toBe(2);
    expect(getStackHeight(g, 1)).toBe(0);
  });

  it("returns 0 for out-of-range columns", () => {
    const g = createEmptyGrid(3);
    expect(getStackHeight(g, -1)).toBe(0);
    expect(getStackHeight(g, 99)).toBe(0);
  });
});

describe("isOverflowing", () => {
  it("returns true when any column has more than MAX_STACK blocks", () => {
    const g: Grid = [
      [true, true, true, true], // 4 > MAX_STACK (3)
      [false, false, false, false],
    ];
    expect(isOverflowing(g)).toBe(true);
  });

  it("returns false when every column is within MAX_STACK", () => {
    const g: Grid = [
      [true, true, true, false], // 3, within limit
      [true, false, false, false],
    ];
    expect(isOverflowing(g)).toBe(false);
  });
});

describe("findCompletedRows", () => {
  it("returns rows where every column is filled", () => {
    const g: Grid = [
      [true, true, false, false],
      [true, false, false, false],
      [true, true, false, false],
    ];
    // row 0 is full across all 3 cols, row 1 has a gap in col 1
    expect(findCompletedRows(g)).toEqual([0]);
  });

  it("returns multiple rows when multiple are full", () => {
    const g: Grid = [
      [true, true, true, false],
      [true, true, true, false],
    ];
    expect(findCompletedRows(g)).toEqual([0, 1, 2]);
  });

  it("returns [] for an empty grid", () => {
    expect(findCompletedRows([])).toEqual([]);
  });
});

describe("placeBlock", () => {
  it("flips the target cell to true on a clone", () => {
    const g = createEmptyGrid(2);
    const next = placeBlock(g, 0, 0);
    expect(next).not.toBe(g);
    expect(g[0][0]).toBe(false); // original untouched
    expect(next[0][0]).toBe(true);
  });

  it("is a no-op when the slot is already filled", () => {
    const g: Grid = [[true, false, false, false]];
    const next = placeBlock(g, 0, 0);
    expect(next).toBe(g); // same reference (no clone needed)
  });

  it("is a no-op for out-of-range slots", () => {
    const g = createEmptyGrid(2);
    expect(placeBlock(g, -1, 0)).toBe(g);
    expect(placeBlock(g, 99, 0)).toBe(g);
    expect(placeBlock(g, 0, -1)).toBe(g);
    expect(placeBlock(g, 0, 99)).toBe(g);
  });
});

describe("clearRowsAndCollectFalling", () => {
  it("clears the target rows and re-floats blocks that were sitting on top", () => {
    // Col 0: [true, true, false, false] — row 0 is part of the cleared line,
    // row 1 must fall back into play.
    // Col 1: [true, false, false, false] — only the cleared row.
    const g: Grid = [
      [true, true, false, false],
      [true, false, false, false],
    ];
    const { grid, fallingFromClear } = clearRowsAndCollectFalling(g, [0]);
    // After clearing row 0, col 0 still has a true at row 1 but that gets
    // queued as falling, so the resulting grid should be empty.
    expect(grid).toEqual([
      [false, false, false, false],
      [false, false, false, false],
    ]);
    expect(fallingFromClear).toEqual([{ x: 0, previousRow: 1 }]);
  });

  it("does nothing when no rows are passed", () => {
    const g: Grid = [[true, false, false, false]];
    const { grid, fallingFromClear } = clearRowsAndCollectFalling(g, []);
    expect(grid).toBe(g);
    expect(fallingFromClear).toEqual([]);
  });

  it("only re-floats blocks above the cleared lines (sandwiched blocks stay)", () => {
    // Single column with stack: row 0 filled, row 1 empty, row 2 filled, row 3 filled.
    //   row 3: true  ←
    //   row 2: true  ←
    //   row 1: false
    //   row 0: true  ←
    // Clear rows [0, 2] (non-adjacent). Only row 3 sits above a cleared line
    // (row 2), so it must re-float. Row 1 was already empty.
    const g: Grid = [[true, false, true, true]];
    const { grid, fallingFromClear } = clearRowsAndCollectFalling(g, [0, 2]);
    expect(grid).toEqual([[false, false, false, false]]);
    expect(fallingFromClear).toEqual([{ x: 0, previousRow: 3 }]);
  });

  it("handles multi-column, multi-row clears correctly", () => {
    // Cols 0 and 1 both have rows 0,1 filled and row 2,3 empty.
    // Col 2 has rows 0,1,2 filled (row 2 above the cleared block).
    const g: Grid = [
      [true, true, false, false],
      [true, true, false, false],
      [true, true, true, false],
    ];
    // Rows 0 and 1 are fully filled across all columns
    expect(findCompletedRows(g)).toEqual([0, 1]);
    const { grid, fallingFromClear } = clearRowsAndCollectFalling(g, [0, 1]);
    expect(grid).toEqual([
      [false, false, false, false],
      [false, false, false, false],
      [false, false, false, false],
    ]);
    // Only col 2's row 2 must re-float
    expect(fallingFromClear).toEqual([{ x: 2, previousRow: 2 }]);
  });
});

describe("removeBlockAndCascade", () => {
  it("clears the target cell and queues the blocks above it to fall", () => {
    // Col 0: [true, true, true, false] → remove row 0 → row 1, 2 must fall.
    const g: Grid = [[true, true, true, false]];
    const { grid, falling } = removeBlockAndCascade(g, 0, 0);
    expect(grid).toEqual([[false, false, false, false]]);
    expect(falling).toEqual([
      { x: 0, previousRow: 1 },
      { x: 0, previousRow: 2 },
    ]);
  });

  it("does nothing for out-of-range targets", () => {
    const g = createEmptyGrid(2);
    expect(removeBlockAndCascade(g, -1, 0).grid).toBe(g);
    expect(removeBlockAndCascade(g, 0, -1).grid).toBe(g);
    expect(removeBlockAndCascade(g, 99, 0).grid).toBe(g);
    expect(removeBlockAndCascade(g, 0, 99).grid).toBe(g);
  });
});

describe("gridUnitYForRow", () => {
  it("converts a row index to the grid-unit y for a falling block", () => {
    // headerHeight=64, blockSize=16, previousRow=0 → pixelY = 64 - 16*1 = 48
    // → grid units = 48 / 16 = 3
    expect(gridUnitYForRow(0, 64, 16)).toBe(3);
    // previousRow=1 → pixelY = 64 - 32 = 32 → 2
    expect(gridUnitYForRow(1, 64, 16)).toBe(2);
  });

  it("defaults blockSize to BLOCK_SIZE", () => {
    expect(gridUnitYForRow(0, 64)).toBe(3);
  });
});
