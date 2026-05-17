/**
 * Pure logic for the header Tetris mini-game.
 *
 * The grid is stored as a 2D boolean array indexed `grid[column][row]`.
 * - `column` is 0..gridWidth-1
 * - `row` is 0..GRID_HEIGHT-1, where row 0 is the *bottom* of the stack and
 *   row GRID_HEIGHT-1 is the top.
 *
 * Falling blocks track their vertical position in grid units (pixelY / BLOCK_SIZE)
 * so the same number can be used both for rendering (multiply by BLOCK_SIZE) and
 * for landing calculations.
 */

export const BLOCK_SIZE = 16;
export const GRID_HEIGHT = 4;
/** Auto-clear the whole grid when any column has more than this many blocks. */
export const MAX_STACK = 3;

export interface FallingBlock {
  id: number;
  x: number;
  /** Position in grid units. `y * BLOCK_SIZE` is the rendered pixel-y. */
  y: number;
}

/** A two-dimensional boolean array — `grid[column][row]`. */
export type Grid = boolean[][];

export function createEmptyGrid(width: number, height: number = GRID_HEIGHT): Grid {
  return Array.from({ length: width }, () => new Array(height).fill(false));
}

/** Returns a deep-cloned copy of `grid` (one level of nested arrays). */
export function cloneGrid(grid: Grid): Grid {
  return grid.map((col) => [...col]);
}

/**
 * Compute the grid width that fits inside an element of `containerWidth` px,
 * given a per-block size in pixels.
 */
export function computeGridWidth(containerWidth: number, blockSize: number = BLOCK_SIZE): number {
  if (containerWidth <= 0 || blockSize <= 0) return 0;
  return Math.floor(containerWidth / blockSize);
}

/**
 * Convert a click x-coordinate (relative to the container) to a column index,
 * clamped to `[0, gridWidth - 1]`. Returns `-1` if the grid has no columns.
 */
export function columnFromClickX(
  clickX: number,
  gridWidth: number,
  blockSize: number = BLOCK_SIZE
): number {
  if (gridWidth <= 0) return -1;
  const column = Math.floor(clickX / blockSize);
  return Math.max(0, Math.min(column, gridWidth - 1));
}

/**
 * Return the lowest empty row in `column`, or `-1` if the column is full or
 * out of range. Row 0 is the bottom.
 */
export function findBottomEmptyRow(grid: Grid, column: number): number {
  if (column < 0 || column >= grid.length) return -1;
  const col = grid[column];
  for (let y = 0; y < col.length; y++) {
    if (!col[y]) return y;
  }
  return -1;
}

/** Count the filled cells in `column`. */
export function getStackHeight(grid: Grid, column: number): number {
  if (column < 0 || column >= grid.length) return 0;
  return grid[column].reduce((sum, filled) => sum + (filled ? 1 : 0), 0);
}

/** Return true if any column has more than `MAX_STACK` filled cells. */
export function isOverflowing(grid: Grid, maxStack: number = MAX_STACK): boolean {
  for (let x = 0; x < grid.length; x++) {
    if (getStackHeight(grid, x) > maxStack) return true;
  }
  return false;
}

/** Return the row indices that are fully filled across every column. */
export function findCompletedRows(grid: Grid): number[] {
  if (grid.length === 0) return [];
  const height = grid[0].length;
  const completed: number[] = [];
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

/**
 * Place a block at `(column, row)`. If the slot is out of range, returns the
 * input grid unchanged.
 */
export function placeBlock(grid: Grid, column: number, row: number): Grid {
  if (column < 0 || column >= grid.length) return grid;
  if (row < 0 || row >= grid[column].length) return grid;
  if (grid[column][row]) return grid;
  const next = cloneGrid(grid);
  next[column][row] = true;
  return next;
}

/**
 * Clear all rows in `rows` and lift the blocks that were sitting on top of
 * those rows into "needs to fall again" state.
 *
 * The returned `fallingFromClear` list captures column + the **row index** the
 * block previously occupied; callers translate that to a pixel y when needed.
 */
export function clearRowsAndCollectFalling(
  grid: Grid,
  rows: number[]
): { grid: Grid; fallingFromClear: Array<{ x: number; previousRow: number }> } {
  if (rows.length === 0) return { grid, fallingFromClear: [] };

  const next = cloneGrid(grid);
  for (const row of rows) {
    for (let x = 0; x < next.length; x++) {
      next[x][row] = false;
    }
  }

  const falling: Array<{ x: number; previousRow: number }> = [];
  for (let x = 0; x < next.length; x++) {
    for (let y = next[x].length - 1; y >= 0; y--) {
      // A block needs to fall iff at least one cleared row was below it.
      if (next[x][y] && rows.some((row) => row < y)) {
        falling.push({ x, previousRow: y });
        next[x][y] = false;
      }
    }
  }

  return { grid: next, fallingFromClear: falling };
}

/**
 * Remove the block at `(column, row)` and drop every block that was stacked on
 * top of it back into falling state.
 *
 * The returned `falling` list contains column + previous row indices.
 */
export function removeBlockAndCascade(
  grid: Grid,
  column: number,
  row: number
): { grid: Grid; falling: Array<{ x: number; previousRow: number }> } {
  if (column < 0 || column >= grid.length) return { grid, falling: [] };
  if (row < 0 || row >= grid[column].length) return { grid, falling: [] };

  const next = cloneGrid(grid);
  next[column][row] = false;
  const falling: Array<{ x: number; previousRow: number }> = [];
  for (let y = row + 1; y < next[column].length; y++) {
    if (next[column][y]) {
      falling.push({ x: column, previousRow: y });
      next[column][y] = false;
    }
  }
  return { grid: next, falling };
}

/**
 * Translate a previous row index into the falling-block `y` (grid units) so
 * that the rendered position matches where the block currently sits inside the
 * container.
 *
 * `containerHeight` is the height of the playfield in pixels.
 */
export function gridUnitYForRow(
  previousRow: number,
  containerHeight: number,
  blockSize: number = BLOCK_SIZE
): number {
  return (containerHeight - blockSize * (previousRow + 1)) / blockSize;
}
