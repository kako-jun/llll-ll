import { useState, useEffect, useCallback, useRef } from "react";
import {
  BLOCK_SIZE,
  GRID_HEIGHT,
  type FallingBlock,
  type Grid,
  clearRowsAndCollectFalling,
  columnFromClickX,
  computeGridWidth,
  createEmptyGrid,
  findBottomEmptyRow,
  findCompletedRows,
  gridUnitYForRow,
  isOverflowing,
  placeBlock,
  removeBlockAndCascade,
} from "@/lib/tetris";

export type { FallingBlock };

export interface TetrisGameState {
  grid: Grid;
  gridWidth: number;
  fallingBlocks: FallingBlock[];
  disappearingBlocks: FallingBlock[];
  mounted: boolean;
}

export interface TetrisGameActions {
  addBlockAtColumn: (column: number) => void;
  getColumnFromClick: (clickX: number) => number;
  handleBlockClick: (e: React.MouseEvent, column: number, row: number) => void;
}

/** ms between animation frames (~30fps is enough for this decoration). */
const ANIMATION_INTERVAL_MS = 33;
/** ms after a block lands before checking for completed rows. */
const CLEAR_CHECK_DELAY_MS = 50;
/** ms a block stays in the disappearing layer (must match the CSS animation). */
const DISAPPEAR_ANIMATION_MS = 400;
/** ms before the first auto-spawned block appears. */
const INITIAL_AUTO_SPAWN_MS = 4000;
/** ms between subsequent auto-spawned blocks. */
const AUTO_SPAWN_INTERVAL_MS = 42000;
/** Initial y of a freshly-spawned block, in grid units (well above the playfield). */
const SPAWN_GRID_Y = -2;

// Module-scoped monotonic id used to key falling-block / disappearing-block
// arrays. Sufficient because we only need uniqueness within a single page load;
// React Strict Mode's double-mount may burn a few ids but never collides.
// Swap to `crypto.randomUUID()` if tests ever need this to be isolated.
let nextBlockId = 1;
function makeBlockId(): number {
  return nextBlockId++;
}

function getHeaderHeight(headerId: string, fallback = 64): number {
  const header = document.getElementById(headerId);
  return header?.getBoundingClientRect().height ?? fallback;
}

export function useTetrisGame(headerId: string): TetrisGameState & TetrisGameActions {
  const [grid, setGrid] = useState<Grid>([]);
  const [gridWidth, setGridWidth] = useState(0);
  const [fallingBlocks, setFallingBlocks] = useState<FallingBlock[]>([]);
  const [disappearingBlocks, setDisappearingBlocks] = useState<FallingBlock[]>([]);
  const [mounted, setMounted] = useState(false);

  // Refs let the animation loop and click handler read the freshest grid / width
  // without re-creating the interval on every state change.
  const gridRef = useRef(grid);
  gridRef.current = grid;
  const gridWidthRef = useRef(gridWidth);
  gridWidthRef.current = gridWidth;

  // Recompute the grid width to match the header width.
  const initializeGrid = useCallback(() => {
    const header = document.getElementById(headerId);
    if (!header) return;
    const newGridWidth = computeGridWidth(header.getBoundingClientRect().width);
    if (newGridWidth !== gridWidthRef.current) {
      setGrid(createEmptyGrid(newGridWidth));
      setGridWidth(newGridWidth);
    }
  }, [headerId]);

  const addBlockAtColumn = useCallback((column: number) => {
    setFallingBlocks((prev) => [...prev, { id: makeBlockId(), x: column, y: SPAWN_GRID_Y }]);
  }, []);

  const getColumnFromClick = useCallback(
    (clickX: number) => columnFromClickX(clickX, gridWidthRef.current),
    []
  );

  // Mount + resize handling
  useEffect(() => {
    setMounted(true);
    initializeGrid();
    const handleResize = () => initializeGrid();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initializeGrid]);

  // Auto-spawn timer
  useEffect(() => {
    if (gridWidth === 0) return;
    const spawn = () => {
      const column = Math.floor(Math.random() * gridWidthRef.current);
      addBlockAtColumn(column);
    };
    const initialTimer = window.setTimeout(spawn, INITIAL_AUTO_SPAWN_MS);
    const intervalTimer = window.setInterval(spawn, AUTO_SPAWN_INTERVAL_MS);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [gridWidth, addBlockAtColumn]);

  // Falling-block animation. Lands are collected into a single setGrid update
  // *after* the falling-blocks update, instead of nested-setState inside the
  // updater (which double-fires under React Strict Mode).
  useEffect(() => {
    if (gridWidth === 0) return;
    const interval = window.setInterval(() => {
      const headerHeight = getHeaderHeight(headerId);
      const landings: Array<{ column: number; row: number }> = [];

      setFallingBlocks((prev) => {
        const gridSnapshot = gridRef.current;
        const reservedRows = new Map<number, number>(); // column -> next free row this tick
        const stillFalling: FallingBlock[] = [];

        for (const block of prev) {
          const nextPixelY = block.y * BLOCK_SIZE + 1;
          if (nextPixelY < 0) {
            stillFalling.push({ ...block, y: nextPixelY / BLOCK_SIZE });
            continue;
          }

          const baseRow = findBottomEmptyRow(gridSnapshot, block.x);
          if (baseRow === -1) {
            // Column already full — drop the block; the overflow watcher will clear it.
            continue;
          }

          // Two blocks landing on the same column this tick stack instead of overlap.
          const reserved = reservedRows.get(block.x);
          const targetRow = reserved !== undefined ? reserved : baseRow;
          if (targetRow >= GRID_HEIGHT) continue;

          const landingPixelY = headerHeight - BLOCK_SIZE * (targetRow + 1);
          if (nextPixelY >= landingPixelY) {
            landings.push({ column: block.x, row: targetRow });
            reservedRows.set(block.x, targetRow + 1);
          } else {
            stillFalling.push({ ...block, y: nextPixelY / BLOCK_SIZE });
          }
        }

        return stillFalling;
      });

      if (landings.length > 0) {
        setGrid((current) => {
          let next = current;
          for (const { column, row } of landings) {
            next = placeBlock(next, column, row);
          }
          return next;
        });
      }
    }, ANIMATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [gridWidth, headerId]);

  // After the grid changes, check for completed rows (small delay so the
  // player sees the block land first). Reading `grid` (not `gridRef.current`)
  // here makes the dependency explicit and avoids reading a stale ref.
  useEffect(() => {
    if (gridWidth === 0) return;
    const completed = findCompletedRows(grid);
    if (completed.length === 0) return;

    const timer = window.setTimeout(() => {
      const headerHeight = getHeaderHeight(headerId);
      const { grid: next, fallingFromClear } = clearRowsAndCollectFalling(grid, completed);
      setGrid(next);
      if (fallingFromClear.length > 0) {
        setFallingBlocks((prev) => [
          ...prev,
          ...fallingFromClear.map(({ x, previousRow }) => ({
            id: makeBlockId(),
            x,
            y: gridUnitYForRow(previousRow, headerHeight),
          })),
        ]);
      }
    }, CLEAR_CHECK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [grid, gridWidth, headerId]);

  // Overflow: any column with more than MAX_STACK blocks resets the board.
  useEffect(() => {
    if (gridWidth === 0) return;
    if (isOverflowing(grid)) {
      setGrid(createEmptyGrid(gridWidth));
      setFallingBlocks([]);
    }
  }, [grid, gridWidth]);

  const handleBlockClick = useCallback(
    (e: React.MouseEvent, column: number, row: number) => {
      e.stopPropagation();
      const headerHeight = getHeaderHeight(headerId);
      const pixelY = headerHeight - BLOCK_SIZE * (row + 1);
      const disappearingBlock: FallingBlock = {
        id: makeBlockId(),
        x: column,
        y: pixelY / BLOCK_SIZE,
      };
      setDisappearingBlocks((prev) => [...prev, disappearingBlock]);

      window.setTimeout(() => {
        setDisappearingBlocks((prev) => prev.filter((b) => b.id !== disappearingBlock.id));
        const { grid: next, falling } = removeBlockAndCascade(gridRef.current, column, row);
        setGrid(next);
        if (falling.length > 0) {
          setFallingBlocks((prev) => [
            ...prev,
            ...falling.map(({ x, previousRow }) => ({
              id: makeBlockId(),
              x,
              y: gridUnitYForRow(previousRow, headerHeight),
            })),
          ]);
        }
      }, DISAPPEAR_ANIMATION_MS);
    },
    [headerId]
  );

  return {
    grid,
    gridWidth,
    fallingBlocks,
    disappearingBlocks,
    mounted,
    addBlockAtColumn,
    getColumnFromClick,
    handleBlockClick,
  };
}
