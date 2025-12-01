import { Language } from "@/types";
import { useTranslation } from "@/lib/i18n";
import { useTetrisGame } from "@/hooks/useTetrisGame";
import { HEADER_ID } from "@/constants";
import { TetrisBlockGrid, FallingBlocks } from "@/components/game";

interface HeaderProps {
  language: Language;
}

export default function Header({ language }: HeaderProps) {
  const t = useTranslation(language);
  const {
    grid,
    gridWidth,
    fallingBlocks,
    disappearingBlocks,
    mounted,
    addBlockAtColumn,
    getColumnFromClick,
    handleBlockClick,
  } = useTetrisGame(HEADER_ID);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHeaderClick = (e: React.MouseEvent<HTMLElement>) => {
    const header = e.currentTarget;
    const rect = header.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // h1タイトルクリックはスクロール
    if ((e.target as HTMLElement).tagName === "H1") {
      scrollToTop();
      return;
    }

    // ブロッククリックは無視（ブロック側で処理）
    if ((e.target as HTMLElement).dataset.block === "true") {
      return;
    }

    const column = getColumnFromClick(x);
    addBlockAtColumn(column);
  };

  const headerStyle: React.CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 50,
    backgroundColor: "var(--bg-primary)",
    borderBottom: "1px solid var(--border-color)",
    padding: "0.5rem 0",
    transition: "background-color 0.3s ease, border-color 0.3s ease",
  };

  const titleContainerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "baseline",
    gap: "0.5rem",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "1.25rem",
    fontWeight: "bold",
    color: "var(--text-accent)",
    margin: 0,
    cursor: "pointer",
    userSelect: "none",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "0.65rem",
    color: "var(--text-accent)",
    userSelect: "none",
    opacity: 0.8,
  };

  // 初期化前またはSSR中
  if (gridWidth === 0 || !mounted) {
    return (
      <header id={HEADER_ID} style={headerStyle}>
        <div className="container">
          <div style={titleContainerStyle}>
            <h1 onClick={scrollToTop} className="logo-font" style={titleStyle}>
              llll-ll
            </h1>
            <span style={subtitleStyle}>{t.siteSubtitle}</span>
          </div>
        </div>
      </header>
    );
  }

  const header = document.getElementById(HEADER_ID);
  const headerHeight = header?.getBoundingClientRect().height || 64;

  return (
    <header
      id={HEADER_ID}
      onClick={handleHeaderClick}
      style={{
        ...headerStyle,
        overflow: "hidden",
        cursor: "crosshair",
      }}
    >
      <div className="container">
        <div style={titleContainerStyle}>
          <h1 className="logo-font" style={titleStyle}>
            llll-ll
          </h1>
          <span style={subtitleStyle}>{t.siteSubtitle}</span>
        </div>
      </div>

      {/* 固定ブロック */}
      <TetrisBlockGrid grid={grid} headerHeight={headerHeight} onBlockClick={handleBlockClick} />

      {/* 落下中ブロック */}
      <FallingBlocks blocks={fallingBlocks} />

      {/* 消えるブロック */}
      <FallingBlocks blocks={disappearingBlocks} isDisappearing />
    </header>
  );
}
