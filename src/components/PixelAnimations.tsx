
import { useEffect, useState } from "react";

export function TetrisBlock() {
  const [blocks, setBlocks] = useState<Array<{ id: number; x: number; y: number; opacity: number }>>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // ヘッダーの位置を取得する関数
    const getHeaderPosition = () => {
      const header = document.getElementById("main-header");
      if (!header) {
        // ヘッダーが見つからない場合のログを削除
        return {
          top: 0,
          left: window.innerWidth * 0.1, // 画面幅の10%位置
          right: window.innerWidth * 0.9, // 画面幅の90%位置
          bottom: 60,
          centerY: 30,
        };
      }

      const rect = header.getBoundingClientRect();
      const scrollY = window.scrollY;

      return {
        top: rect.top + scrollY,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom + scrollY,
        centerY: rect.top + scrollY + rect.height / 2,
      };
    };

    const addBlock = () => {
      const headerPos = getHeaderPosition();

      // ヘッダーの幅に基づいてブロック生成範囲を決定
      // ヘッダーの中央部分により狭い範囲で生成
      const headerWidth = headerPos.right - headerPos.left;
      const blockArea = {
        minX: headerPos.left + headerWidth * 0.2, // ヘッダーの20%位置から
        maxX: headerPos.right - headerWidth * 0.2, // ヘッダーの80%位置まで
      };

      const newBlock = {
        id: Date.now() + Math.random(),
        x: blockArea.minX + Math.random() * (blockArea.maxX - blockArea.minX),
        y: -20, // 画面上部から開始
        opacity: 0.9 + Math.random() * 0.1,
      };

      setBlocks((prev) => [...prev, newBlock]);
    };

    // 1.5秒間隔でブロックを生成（少し頻度を上げる）
    const interval = setInterval(addBlock, 1500);
    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    const animate = () => {
      setBlocks((prev) => {
        const header = document.getElementById("main-header");
        let targetY = 60; // デフォルト値

        if (header) {
          const rect = header.getBoundingClientRect();
          targetY = rect.bottom + window.scrollY - 10; // ヘッダーの下端から10px上
        }

        return prev
          .map((block) => {
            const newY = block.y + 2; // 落下速度を少し上げる

            // ターゲットY座標に到達したら積み上げ処理
            if (newY >= targetY - 5) {
              // 同じX座標付近で既に積み上がっているブロックを検索
              const nearbyBlocks = prev.filter(
                (otherBlock) =>
                  otherBlock.id !== block.id &&
                  Math.abs(otherBlock.x - block.x) <= 20 &&
                  Math.abs(otherBlock.y - targetY) <= 30
              );

              // 積み上げ高さを計算
              const stackHeight = nearbyBlocks.length;
              const finalY = targetY - stackHeight * 14; // 14pxずつ上に積み上げ

              return {
                ...block,
                y: finalY,
              };
            }

            return { ...block, y: newY };
          })
          .filter((block) => block.y > -50 && block.y < window.innerHeight + 100);
      });
    };

    const animationInterval = setInterval(animate, 60); // より滑らかなアニメーション
    return () => clearInterval(animationInterval);
  }, []);

  // SSR中は何も表示しない
  if (!mounted) {
    return null;
  }

  return (
    <>
      {blocks.map((block) => (
        <div
          key={block.id}
          className="fixed pointer-events-none"
          style={{
            left: block.x,
            top: block.y,
            width: "12px",
            height: "12px",
            backgroundColor: "#ffffff",
            border: "1px solid #e0e0e0",
            opacity: block.opacity,
            zIndex: 1000, // ヘッダーより前面に表示
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
          }}
        />
      ))}
    </>
  );
}

// デフォルトエクスポート
export default TetrisBlock;
