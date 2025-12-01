import { useState, useEffect, useCallback, useRef } from "react";

const BLOCK_SIZE = 16;
const GRID_HEIGHT = 4;
const MAX_STACK = 3;

export interface FallingBlock {
  id: number;
  x: number;
  y: number;
}

export interface TetrisGameState {
  grid: boolean[][];
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

export function useTetrisGame(headerId: string): TetrisGameState & TetrisGameActions {
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [gridWidth, setGridWidth] = useState(0);
  const [fallingBlocks, setFallingBlocks] = useState<FallingBlock[]>([]);
  const [disappearingBlocks, setDisappearingBlocks] = useState<FallingBlock[]>([]);
  const [mounted, setMounted] = useState(false);

  // refで最新のgridWidthを保持（useCallback依存を減らす）
  const gridWidthRef = useRef(gridWidth);
  gridWidthRef.current = gridWidth;

  // ヘッダー幅に基づいてグリッドを初期化
  const initializeGrid = useCallback(() => {
    const header = document.getElementById(headerId);
    if (!header) return;

    const headerRect = header.getBoundingClientRect();
    const newGridWidth = Math.floor(headerRect.width / BLOCK_SIZE);

    if (newGridWidth !== gridWidthRef.current) {
      const newGrid: boolean[][] = [];
      for (let x = 0; x < newGridWidth; x++) {
        newGrid[x] = new Array(GRID_HEIGHT).fill(false);
      }
      setGrid(newGrid);
      setGridWidth(newGridWidth);
    }
  }, [headerId]);

  // ブロックを指定位置に追加
  const addBlockAtColumn = useCallback((column: number) => {
    const newFallingBlock: FallingBlock = {
      id: Date.now() + Math.random(),
      x: column,
      y: -2,
    };
    setFallingBlocks((prev) => [...prev, newFallingBlock]);
  }, []);

  // クリック位置からグリッド列を計算
  const getColumnFromClick = useCallback((clickX: number) => {
    const column = Math.floor(clickX / BLOCK_SIZE);
    return Math.max(0, Math.min(column, gridWidthRef.current - 1));
  }, []);

  // グリッドの指定列で一番下の空き位置を取得
  const getBottomEmptyRow = useCallback(
    (column: number) => {
      if (column < 0 || column >= gridWidth) return -1;
      for (let y = 0; y < GRID_HEIGHT; y++) {
        if (!grid[column]?.[y]) {
          return y;
        }
      }
      return -1;
    },
    [grid, gridWidth]
  );

  // 指定列のブロック数を取得
  const getStackHeight = useCallback(
    (column: number) => {
      if (column < 0 || column >= gridWidth) return 0;
      let count = 0;
      for (let y = 0; y < GRID_HEIGHT; y++) {
        if (grid[column]?.[y]) count++;
      }
      return count;
    },
    [grid, gridWidth]
  );

  // ライン消去判定
  const checkAndClearLines = useCallback(() => {
    if (gridWidth === 0) return;

    const header = document.getElementById(headerId);
    const headerHeight = header?.getBoundingClientRect().height || 64;

    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((col) => [...col]);
      const completedRows: number[] = [];

      for (let y = 0; y < GRID_HEIGHT; y++) {
        let isComplete = true;
        for (let x = 0; x < gridWidth; x++) {
          if (!newGrid[x]?.[y]) {
            isComplete = false;
            break;
          }
        }
        if (isComplete) {
          completedRows.push(y);
        }
      }

      if (completedRows.length > 0) {
        completedRows.forEach((row) => {
          for (let x = 0; x < gridWidth; x++) {
            if (newGrid[x]) {
              newGrid[x][row] = false;
            }
          }
        });

        const newFallingBlocks: FallingBlock[] = [];
        for (let x = 0; x < gridWidth; x++) {
          for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
            if (newGrid[x]?.[y]) {
              const linesBelow = completedRows.filter((row) => row < y).length;
              if (linesBelow > 0) {
                const currentPixelY = headerHeight - BLOCK_SIZE * (y + 1);
                newFallingBlocks.push({
                  id: Date.now() + Math.random() + x * 1000 + y,
                  x: x,
                  y: currentPixelY / BLOCK_SIZE,
                });
                newGrid[x][y] = false;
              }
            }
          }
        }

        if (newFallingBlocks.length > 0) {
          setFallingBlocks((prev) => [...prev, ...newFallingBlocks]);
        }
      }

      return newGrid;
    });
  }, [gridWidth, headerId]);

  // 初期化
  useEffect(() => {
    setMounted(true);
    initializeGrid();

    const handleResize = () => initializeGrid();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initializeGrid]);

  // ブロック自動生成タイマー
  useEffect(() => {
    if (gridWidth === 0) return;

    const addRandomBlock = () => {
      const randomColumn = Math.floor(Math.random() * gridWidth);
      addBlockAtColumn(randomColumn);
    };

    const initialTimer = setTimeout(addRandomBlock, 4000);
    const blockInterval = setInterval(addRandomBlock, 42000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(blockInterval);
    };
  }, [gridWidth, addBlockAtColumn]);

  // 落下アニメーション
  useEffect(() => {
    const animate = () => {
      setFallingBlocks((prev) => {
        const header = document.getElementById(headerId);
        if (!header) return prev;

        const headerHeight = header.getBoundingClientRect().height;
        const stillFalling: FallingBlock[] = [];

        prev.forEach((block) => {
          const currentPixelY = block.y * BLOCK_SIZE;
          const nextPixelY = currentPixelY + 1;

          if (nextPixelY < 0) {
            stillFalling.push({ ...block, y: nextPixelY / BLOCK_SIZE });
            return;
          }

          const bottomRow = getBottomEmptyRow(block.x);
          if (bottomRow === -1) return;

          const landingPixelY = headerHeight - BLOCK_SIZE * (bottomRow + 1);

          if (nextPixelY >= landingPixelY) {
            setGrid((prevGrid) => {
              const newGrid = prevGrid.map((col) => [...col]);
              if (newGrid[block.x]) {
                newGrid[block.x][bottomRow] = true;
              }
              setTimeout(() => checkAndClearLines(), 50);
              return newGrid;
            });
          } else {
            stillFalling.push({ ...block, y: nextPixelY / BLOCK_SIZE });
          }
        });

        return stillFalling;
      });
    };

    const animationInterval = setInterval(animate, 33);
    return () => clearInterval(animationInterval);
  }, [getBottomEmptyRow, checkAndClearLines, headerId]);

  // 全消し判定
  useEffect(() => {
    let shouldClear = false;
    for (let x = 0; x < gridWidth; x++) {
      if (getStackHeight(x) > MAX_STACK) {
        shouldClear = true;
        break;
      }
    }

    if (shouldClear) {
      setGrid(() => {
        const newGrid: boolean[][] = [];
        for (let x = 0; x < gridWidth; x++) {
          newGrid[x] = new Array(GRID_HEIGHT).fill(false);
        }
        return newGrid;
      });
      setFallingBlocks([]);
    }
  }, [grid, gridWidth, getStackHeight]);

  // ブロッククリック削除
  const handleBlockClick = useCallback(
    (e: React.MouseEvent, column: number, row: number) => {
      e.stopPropagation();

      const header = document.getElementById(headerId);
      const headerHeight = header?.getBoundingClientRect().height || 64;
      const pixelY = headerHeight - BLOCK_SIZE * (row + 1);

      const disappearingBlock: FallingBlock = {
        id: Date.now() + Math.random(),
        x: column,
        y: pixelY / BLOCK_SIZE,
      };

      setDisappearingBlocks((prev) => [...prev, disappearingBlock]);

      setTimeout(() => {
        setDisappearingBlocks((prev) => prev.filter((b) => b.id !== disappearingBlock.id));

        setGrid((prev) => {
          const newGrid = prev.map((col) => [...col]);

          if (newGrid[column]) {
            newGrid[column][row] = false;

            const newFallingBlocks: FallingBlock[] = [];
            for (let y = row + 1; y < GRID_HEIGHT; y++) {
              if (newGrid[column][y]) {
                const currentPixelY = headerHeight - BLOCK_SIZE * (y + 1);
                newFallingBlocks.push({
                  id: Date.now() + Math.random() + y,
                  x: column,
                  y: currentPixelY / BLOCK_SIZE,
                });
                newGrid[column][y] = false;
              }
            }

            if (newFallingBlocks.length > 0) {
              setFallingBlocks((prevFalling) => [...prevFalling, ...newFallingBlocks]);
            }
          }

          return newGrid;
        });
      }, 400);
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

export { BLOCK_SIZE };
