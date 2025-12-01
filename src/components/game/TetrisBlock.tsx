import { memo } from "react";
import { BLOCK_SIZE } from "@/hooks/useTetrisGame";

interface TetrisBlockProps {
  x: number;
  y: number;
  onClick?: (e: React.MouseEvent) => void;
  isDisappearing?: boolean;
  zIndex?: number;
}

export const TetrisBlock = memo(function TetrisBlock({
  x,
  y,
  onClick,
  isDisappearing = false,
  zIndex = 20,
}: TetrisBlockProps) {
  const pixelX = x * BLOCK_SIZE;
  const pixelY = y * BLOCK_SIZE;

  return (
    <div
      data-block="true"
      onClick={onClick}
      style={{
        position: "absolute",
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        width: `${BLOCK_SIZE}px`,
        height: `${BLOCK_SIZE}px`,
        backgroundColor: "var(--text-accent)",
        cursor: onClick ? "pointer" : "default",
        transition: onClick ? "opacity 0.2s ease" : undefined,
        zIndex,
        ...(isDisappearing && {
          animation: "shrinkToCenter 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
          transformOrigin: "center center",
        }),
      }}
      onMouseEnter={onClick ? (e) => (e.currentTarget.style.opacity = "0.7") : undefined}
      onMouseLeave={onClick ? (e) => (e.currentTarget.style.opacity = "1") : undefined}
    />
  );
});

interface TetrisBlockGridProps {
  grid: boolean[][];
  headerHeight: number;
  onBlockClick: (e: React.MouseEvent, x: number, y: number) => void;
}

export const TetrisBlockGrid = memo(function TetrisBlockGrid({
  grid,
  headerHeight,
  onBlockClick,
}: TetrisBlockGridProps) {
  return (
    <>
      {grid.map((column, x) =>
        column.map((hasBlock, y) => {
          if (!hasBlock) return null;
          const pixelY = headerHeight - BLOCK_SIZE * (y + 1);
          return (
            <TetrisBlock
              key={`${x}-${y}`}
              x={x}
              y={pixelY / BLOCK_SIZE}
              onClick={(e) => onBlockClick(e, x, y)}
              zIndex={20}
            />
          );
        })
      )}
    </>
  );
});

interface FallingBlocksProps {
  blocks: { id: number; x: number; y: number }[];
  isDisappearing?: boolean;
}

export const FallingBlocks = memo(function FallingBlocks({
  blocks,
  isDisappearing = false,
}: FallingBlocksProps) {
  return (
    <>
      {blocks.map((block) => (
        <TetrisBlock
          key={block.id}
          x={block.x}
          y={block.y}
          isDisappearing={isDisappearing}
          zIndex={isDisappearing ? 21 : 19}
        />
      ))}
    </>
  );
});
