"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import ArrowIcon from "@/components/ArrowIcon";
import BackgroundDots from "@/components/BackgroundDots";

export default function NotFound() {
  const { language, changeLanguage } = useLanguage();
  const { theme, toggleTheme, mounted } = useTheme();
  const t = useTranslation(language);

  // ミニゲーム用の状態
  const [gameStarted, setGameStarted] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [gridNumbers, setGridNumbers] = useState<number[]>([]);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [rankingSubmitted, setRankingSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // ゲーム初期化
  const initializeGame = () => {
    const numbers = Array.from({ length: 16 }, (_, i) => i + 1);
    const shuffled = numbers.sort(() => Math.random() - 0.5);
    setGridNumbers(shuffled);
    setCurrentNumber(1);
    setGameStarted(true);
    setGameCompleted(false);
    setStartTime(Date.now());
    setEndTime(0);
  };

  // 数字クリック処理
  const handleNumberClick = (clickedNumber: number) => {
    if (clickedNumber === currentNumber) {
      if (currentNumber === 16) {
        const completionTime = Date.now();
        setGameCompleted(true);
        setEndTime(completionTime);
        // ゲーム完了時に自動でランキング送信
        autoSubmitToRanking(completionTime - startTime);
      } else {
        setCurrentNumber(currentNumber + 1);
      }
    }
  };

  // ゲームリセット
  const resetGame = () => {
    setGameStarted(false);
    setCurrentNumber(1);
    setGridNumbers([]);
    setGameCompleted(false);
    setStartTime(0);
    setEndTime(0);
    setRankingSubmitted(false);
    setSubmitMessage('');
  };

  // プレイヤー名生成（IP+UserAgentベース）
  const generatePlayerName = (): string => {
    const adjectives = ['Swift', 'Clever', 'Brave', 'Quick', 'Smart', 'Fast', 'Sharp', 'Wise', 'Cool', 'Super'];
    const animals = ['Fox', 'Eagle', 'Tiger', 'Wolf', 'Lion', 'Hawk', 'Bear', 'Cat', 'Dog', 'Owl'];
    
    // IP+UserAgentの代わりにnavigatorのプロパティを使用してハッシュ生成
    const userString = `${navigator.userAgent}-${navigator.language}-${screen.width}x${screen.height}`;
    let hash = 0;
    for (let i = 0; i < userString.length; i++) {
      const char = userString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    
    const adjIndex = Math.abs(hash) % adjectives.length;
    const animalIndex = Math.abs(hash >> 8) % animals.length;
    const number = (Math.abs(hash >> 16) % 999) + 1;
    
    return `${adjectives[adjIndex]}${animals[animalIndex]}${number}`;
  };

  // 自動ランキング送信
  const autoSubmitToRanking = async (timeInMs: number) => {
    const playerName = generatePlayerName();
    const timeInSeconds = (timeInMs / 1000).toFixed(2);
    const displayScore = `${timeInSeconds}s`;
    
    const rankingId = "llll-ll-a235b610";
    
    try {
      // 正しいAPI呼び出し: 数値（ソート用）と文字列（表示用）の両方を送信
      await fetch(`https://nostalgic.llll-ll.com/api/ranking?action=submit&id=${rankingId}&name=${encodeURIComponent(playerName)}&score=${timeInMs}&displayScore=${encodeURIComponent(displayScore)}`);
      setRankingSubmitted(true);
    } catch (error) {
      // エラーも静かに無視
      console.debug('Ranking submission failed, but continuing...', error);
    }
  };
  // 数字を言葉で表現するマッピング
  const numberWords = {
    en: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen"],
    ja: ["壱", "弐", "参", "肆", "伍", "陸", "漆", "捌", "玖", "拾", "拾壱", "拾弐", "拾参", "拾肆", "拾伍", "拾陸"],
    zh: ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三", "十四", "十五", "十六"],
    es: ["uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis"],
  };

  const notFoundMessages = {
    en: {
      title: "404 - Page Not Found",
      message: "The page you are looking for could not be found.",
      backHome: "Back to Home",
      gameTitle: "Mini Game: Click in order!",
      gameStart: "Start Game",
      gameReset: "Reset",
      gameCompleted: "Completed!",
      gameTime: "Time:",
      gameNext: "Next:",
    },
    ja: {
      title: "404 - ページが見つかりません",
      message: "お探しのページは見つかりませんでした。",
      backHome: "ホームに戻る",
      gameTitle: "ミニゲーム: 順番にクリック！",
      gameStart: "ゲーム開始",
      gameReset: "リセット",
      gameCompleted: "クリア！",
      gameTime: "タイム:",
      gameNext: "次:",
    },
    zh: {
      title: "404 - 页面未找到",
      message: "您查找的页面未找到。",
      backHome: "返回首页",
      gameTitle: "小游戏：按顺序点击！",
      gameStart: "开始游戏",
      gameReset: "重置",
      gameCompleted: "完成！",
      gameTime: "时间:",
      gameNext: "下一个:",
    },
    es: {
      title: "404 - Página No Encontrada",
      message: "La página que buscas no se pudo encontrar.",
      backHome: "Volver al Inicio",
      gameTitle: "Mini Juego: ¡Haz clic en orden!",
      gameStart: "Iniciar Juego",
      gameReset: "Reiniciar",
      gameCompleted: "¡Completado!",
      gameTime: "Tiempo:",
      gameNext: "Siguiente:",
    },
  };

  const messages = notFoundMessages[language] || notFoundMessages["en"];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--background-color)",
        color: "var(--text-color)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* 言語選択 */}
      <div style={{ marginBottom: "2rem", position: "relative", zIndex: 10 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={() => {
              changeLanguage("en");
            }}
            style={{
              background: "none",
              border: "none",
              color: language === "en" ? "var(--primary-color)" : "var(--link-color)",
              textDecoration: "none",
              fontSize: "0.9rem",
              cursor: "pointer",
              fontFamily: "'Noto Sans', sans-serif",
              fontWeight: language === "en" ? "bold" : "normal",
              width: "60px",
              textAlign: "center",
              flexShrink: 0,
            }}
          >
            English
          </button>
          <span
            style={{
              color: "var(--muted-text)",
              width: "10px",
              textAlign: "center",
              display: "inline-block",
              fontFamily: "'Noto Sans', sans-serif",
              flexShrink: 0,
            }}
          >
            |
          </span>
          <button
            onClick={() => {
              changeLanguage("ja");
            }}
            style={{
              background: "none",
              border: "none",
              color: language === "ja" ? "var(--primary-color)" : "var(--link-color)",
              textDecoration: "none",
              fontSize: "0.9rem",
              cursor: "pointer",
              fontFamily: "'Noto Sans', sans-serif",
              fontWeight: language === "ja" ? "bold" : "normal",
              width: "60px",
              textAlign: "center",
              flexShrink: 0,
            }}
          >
            日本語
          </button>
          <span
            style={{
              color: "var(--muted-text)",
              width: "10px",
              textAlign: "center",
              display: "inline-block",
              fontFamily: "'Noto Sans', sans-serif",
              flexShrink: 0,
            }}
          >
            |
          </span>
          <button
            onClick={() => {
              changeLanguage("zh");
            }}
            style={{
              background: "none",
              border: "none",
              color: language === "zh" ? "var(--primary-color)" : "var(--link-color)",
              textDecoration: "none",
              fontSize: "0.9rem",
              cursor: "pointer",
              fontFamily: "'Noto Sans', sans-serif",
              fontWeight: language === "zh" ? "bold" : "normal",
              width: "60px",
              textAlign: "center",
              flexShrink: 0,
            }}
          >
            中文
          </button>
          <span
            style={{
              color: "var(--muted-text)",
              width: "10px",
              textAlign: "center",
              display: "inline-block",
              fontFamily: "'Noto Sans', sans-serif",
              flexShrink: 0,
            }}
          >
            |
          </span>
          <button
            onClick={() => {
              changeLanguage("es");
            }}
            style={{
              background: "none",
              border: "none",
              color: language === "es" ? "var(--primary-color)" : "var(--link-color)",
              textDecoration: "none",
              fontSize: "0.9rem",
              cursor: "pointer",
              fontFamily: "'Noto Sans', sans-serif",
              fontWeight: language === "es" ? "bold" : "normal",
              width: "60px",
              textAlign: "center",
              flexShrink: 0,
            }}
          >
            Español
          </button>
        </div>
        {/* テーマ切り替えスイッチ */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "1rem",
          }}
        >
          <button
            onClick={() => {
              // ダークテーマの時のみライトテーマに切り替え
              if (theme === "dark") {
                toggleTheme();
              }
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted-text)",
              cursor: mounted ? (theme === "dark" ? "pointer" : "default") : "default",
              padding: "0.25rem",
              opacity: mounted ? (theme === "dark" ? 1 : 0.5) : 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="5" />
              <path
                d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
              />
              <circle cx="12" cy="12" r="4" fill="currentColor" />{" "}
            </svg>
          </button>
          <button
            onClick={toggleTheme}
            style={{
              position: "relative",
              width: "50px",
              height: "24px",
              backgroundColor: mounted ? (theme === "dark" ? "var(--primary-color)" : "#ccc") : "#ccc",
              border: "none",
              borderRadius: "2px", // 4pxから2pxに変更してラウンドを少なく
              cursor: "pointer",
              transition: "background-color 0.3s ease",
              padding: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "2px",
                left: mounted ? (theme === "dark" ? "26px" : "2px") : "2px",
                width: "20px",
                height: "20px",
                backgroundColor: "#ffffff",
                borderRadius: "1px", // 2pxから1pxに変更してさらにラウンドを少なく
                transition: "left 0.3s ease",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            />
          </button>{" "}
          <button
            onClick={() => {
              // ライトテーマの時のみダークテーマに切り替え
              if (theme === "light") {
                toggleTheme();
              }
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted-text)",
              cursor: mounted ? (theme === "light" ? "pointer" : "default") : "default",
              padding: "0.25rem",
              opacity: mounted ? (theme === "light" ? 1 : 0.5) : 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {" "}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 12.79A9 9 0 1 0 11.79 2 7.2 7.2 0 0 1 2 12.79z" />
              <circle cx="8" cy="12" r="2.5" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
      {/* 404メッセージ */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "3rem",
            fontWeight: "bold",
            marginBottom: "1rem",
            color: "var(--primary-color)",
            fontFamily: language === "zh" ? "'Noto Sans SC', sans-serif" : "inherit",
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "1rem",
            color: "var(--text-color)",
            fontFamily: language === "zh" ? "'Noto Sans SC', sans-serif" : "inherit",
          }}
        >
          {messages.title}
        </h2>
        <p
          style={{
            fontSize: "1rem",
            color: "var(--muted-text)",
            marginBottom: "2rem",
            maxWidth: "400px",
            lineHeight: "1.6",
            fontFamily: language === "zh" ? "'Noto Sans SC', sans-serif" : "inherit",
          }}
        >
          {messages.message}
        </p>
      </div>
      {/* ミニゲーム */}
      <div style={{ marginBottom: "6rem", position: "relative", zIndex: 10 }}>
        <h3
          style={{
            fontSize: "1.2rem",
            fontWeight: "bold",
            marginBottom: "1rem",
            color: "var(--text-color)",
            fontFamily: language === "zh" ? "'Noto Sans SC', sans-serif" : "inherit",
          }}
        >
          {messages.gameTitle}
        </h3>

        {!gameStarted ? (
          <button
            onClick={initializeGame}
            style={{
              backgroundColor: "var(--primary-color)",
              color: "#ffffff",
              border: "none",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              cursor: "pointer",
              fontFamily: language === "zh" ? "'Noto Sans SC', sans-serif" : "inherit",
              fontWeight: "bold",
              borderRadius: "0.25rem",
              transition: "opacity 0.2s",
              position: "relative",
              zIndex: 10,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            {messages.gameStart}
          </button>
        ) : (
          <div>
            {/* ゲーム情報 */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "2rem",
                marginBottom: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: "0.9rem", color: "var(--text-color)" }}>
                {messages.gameNext} <strong style={{ color: "var(--primary-color)" }}>{numberWords[language][currentNumber - 1]}</strong>
              </div>
              {gameCompleted && (
                <div style={{ fontSize: "0.9rem", color: "var(--primary-color)", fontWeight: "bold" }}>
                  {messages.gameCompleted} {messages.gameTime} {((endTime - startTime) / 1000).toFixed(2)}s
                  {rankingSubmitted && (
                    <div style={{ fontSize: "0.8rem", marginTop: "0.25rem", color: "#10b981" }}>
                      ✨ Submitted to global ranking!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ゲームグリッド */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 70px)",
                gap: "8px",
                justifyContent: "center",
                marginBottom: "1rem",
                position: "relative",
                zIndex: 10,
              }}
            >
              {gridNumbers.map((number, index) => (
                <button
                  key={index}
                  onClick={() => handleNumberClick(number)}
                  disabled={gameCompleted}
                  style={{
                    width: "70px",
                    height: "50px",
                    backgroundColor:
                      number < currentNumber
                        ? "var(--primary-color)"
                        : number === currentNumber
                        ? "#fbbf24"
                        : "var(--input-background)",
                    color:
                      number < currentNumber ? "#ffffff" : number === currentNumber ? "#000000" : "var(--text-color)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    cursor: gameCompleted ? "default" : "pointer",
                    transition: "all 0.2s ease",
                    opacity: gameCompleted ? 0.7 : 1,
                    position: "relative",
                    zIndex: 10,
                  }}
                  onMouseOver={(e) => {
                    if (!gameCompleted && number >= currentNumber) {
                      if (number === currentNumber) {
                        e.currentTarget.style.backgroundColor = "#f59e0b"; // オレンジっぽい黄色
                      } else {
                        e.currentTarget.style.backgroundColor = "var(--hover-background)";
                      }
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!gameCompleted) {
                      e.currentTarget.style.backgroundColor =
                        number < currentNumber
                          ? "var(--primary-color)"
                          : number === currentNumber
                          ? "#fbbf24"
                          : "var(--input-background)";
                    }
                  }}
                >
                  {numberWords[language][number - 1]}
                </button>
              ))}
            </div>

            {/* リセットボタン */}
            <button
              onClick={resetGame}
              style={{
                backgroundColor: "var(--background-color)",
                color: "var(--text-color)",
                border: "1px solid var(--border-color)",
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
                cursor: "pointer",
                fontFamily: language === "zh" ? "'Noto Sans SC', sans-serif" : "inherit",
                borderRadius: "0.25rem",
                transition: "background-color 0.2s",
                position: "relative",
                zIndex: 10,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "var(--hover-background)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "var(--background-color)";
              }}
            >
              {messages.gameReset}
            </button>
          </div>
        )}
      </div>
      {/* ホームに戻るボタン */}
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          backgroundColor: "var(--primary-color)",
          color: "#ffffff",
          textDecoration: "none",
          padding: "0.75rem 1.5rem",
          borderRadius: "0.25rem",
          fontSize: "1rem",
          fontWeight: "bold",
          transition: "opacity 0.2s ease",
          fontFamily: language === "zh" ? "'Noto Sans SC', sans-serif" : "inherit",
          position: "relative",
          zIndex: 10,
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.opacity = "0.9";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
      >
        <ArrowIcon direction="left" size={16} strokeWidth={2} />
        {messages.backHome}
      </Link>
      {/* 背景アニメーション */}
      <BackgroundDots />
    </div>
  );
}
