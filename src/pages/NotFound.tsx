import { useState } from "react";
import { Language } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowIcon } from "@/components/common";
import { BackgroundDots } from "@/components/game";

export default function NotFound() {
  const { language, changeLanguage } = useLanguage();
  const { theme, toggleTheme, mounted } = useTheme();

  // ミニゲーム用の状態
  const [gameStarted, setGameStarted] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [gridNumbers, setGridNumbers] = useState<number[]>([]);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);

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
        const now = Date.now();
        setGameCompleted(true);
        setEndTime(now);
        submitScore(now - startTime);
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
  };

  // プレイヤー名生成
  const generatePlayerName = (): string => {
    const adjectives = [
      "Swift",
      "Clever",
      "Brave",
      "Quick",
      "Smart",
      "Fast",
      "Sharp",
      "Wise",
      "Cool",
      "Super",
    ];
    const animals = ["Fox", "Eagle", "Tiger", "Wolf", "Lion", "Hawk", "Bear", "Cat", "Dog", "Owl"];
    // より多くのデバイス情報を使って異なる端末を区別する
    const userString = `${navigator.userAgent}-${navigator.language}-${screen.width}x${screen.height}-${screen.colorDepth}-${navigator.hardwareConcurrency || 0}-${(navigator as Navigator & { deviceMemory?: number }).deviceMemory || 0}-${navigator.maxTouchPoints || 0}-${window.devicePixelRatio || 1}`;
    let hash = 0;
    for (let i = 0; i < userString.length; i++) {
      const char = userString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const adjIndex = Math.abs(hash) % adjectives.length;
    const animalIndex = Math.abs(hash >> 8) % animals.length;
    const number = (Math.abs(hash >> 16) % 999) + 1;
    return `${adjectives[adjIndex]}${animals[animalIndex]}${String(number).padStart(3, '0')}`;
  };

  // スコア送信
  const submitScore = async (timeMs: number) => {
    const displayScore = (timeMs / 1000).toFixed(2) + "s";
    const playerName = generatePlayerName();
    const url = `https://api.nostalgic.llll-ll.com/ranking?action=submit&id=llll-ll-a235b610&name=${encodeURIComponent(playerName)}&score=${timeMs}&displayScore=${encodeURIComponent(displayScore)}`;
    try {
      await fetch(url);
    } catch {
      // Silent fail
    }
  };

  // 数字を言葉で表現するマッピング
  const numberWords = {
    en: [
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
    ],
    ja: [
      "壱",
      "弐",
      "参",
      "肆",
      "伍",
      "陸",
      "漆",
      "捌",
      "玖",
      "拾",
      "拾壱",
      "拾弐",
      "拾参",
      "拾肆",
      "拾伍",
      "拾陸",
    ],
    zh: [
      "一",
      "二",
      "三",
      "四",
      "五",
      "六",
      "七",
      "八",
      "九",
      "十",
      "十一",
      "十二",
      "十三",
      "十四",
      "十五",
      "十六",
    ],
    es: [
      "uno",
      "dos",
      "tres",
      "cuatro",
      "cinco",
      "seis",
      "siete",
      "ocho",
      "nueve",
      "diez",
      "once",
      "doce",
      "trece",
      "catorce",
      "quince",
      "dieciséis",
    ],
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
      className="flex-center flex-column"
      style={{
        minHeight: "100vh",
        padding: "2rem",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* 言語選択 */}
      <div className="mb-2" style={{ position: "relative", zIndex: 10 }}>
        <div className="flex-center gap-half">
          {(["en", "ja", "zh", "es"] as Language[]).map((lang, index) => (
            <div key={lang} className="flex-center">
              {index > 0 && (
                <span className="text-muted" style={{ margin: "0 0.25rem" }}>
                  |
                </span>
              )}
              <button
                onClick={() => {
                  changeLanguage(lang);
                }}
                className="btn-link"
                style={{
                  color: language === lang ? "var(--primary-color)" : "var(--link-color)",
                  fontWeight: language === lang ? "bold" : "normal",
                  width: "60px",
                }}
              >
                {{ en: "English", ja: "日本語", zh: "中文", es: "Español" }[lang]}
              </button>
            </div>
          ))}
        </div>

        {/* テーマ切り替えスイッチ */}
        <div className="flex-center gap-half mt-1">
          <button
            onClick={() => theme === "dark" && toggleTheme()}
            className="btn-link"
            style={{
              opacity: mounted ? (theme === "dark" ? 1 : 0.5) : 0.5,
              cursor: mounted ? (theme === "dark" ? "pointer" : "default") : "default",
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
            </svg>
          </button>
          <button
            onClick={toggleTheme}
            style={{
              position: "relative",
              width: "50px",
              height: "24px",
              backgroundColor: mounted
                ? theme === "dark"
                  ? "var(--primary-color)"
                  : "#ccc"
                : "#ccc",
              border: "none",
              borderRadius: "2px",
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
                borderRadius: "1px",
                transition: "left 0.3s ease",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            />
          </button>
          <button
            onClick={() => theme === "light" && toggleTheme()}
            className="btn-link"
            style={{
              opacity: mounted ? (theme === "light" ? 1 : 0.5) : 0.5,
              cursor: mounted ? (theme === "light" ? "pointer" : "default") : "default",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 12.79A9 9 0 1 0 11.79 2 7.2 7.2 0 0 1 2 12.79z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 404メッセージ */}
      <div className="mb-2">
        <h1
          className="text-primary font-bold"
          style={{
            fontSize: "3rem",
            marginBottom: "2rem",
            fontFamily: language === "zh" ? "'Noto Sans SC', sans-serif" : "inherit",
          }}
        >
          404
        </h1>
      </div>

      {/* ミニゲーム */}
      <div style={{ marginBottom: "6rem", position: "relative", zIndex: 10 }}>
        <h3
          className="font-bold mb-1"
          style={{
            fontSize: "1.2rem",
            fontFamily: language === "zh" ? "'Noto Sans SC', sans-serif" : "inherit",
          }}
        >
          {messages.gameTitle}
        </h3>

        {!gameStarted ? (
          <button
            onClick={initializeGame}
            className="transition-all"
            style={{
              backgroundColor: "var(--primary-color)",
              color: "#ffffff",
              border: "none",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              cursor: "pointer",
              fontWeight: "bold",
              borderRadius: "0.25rem",
              position: "relative",
              zIndex: 10,
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {messages.gameStart}
          </button>
        ) : (
          <div>
            <div className="flex-center gap-2 mb-1" style={{ flexWrap: "wrap" }}>
              <div className="text-sm">
                {messages.gameNext} <strong className="text-primary">{currentNumber}</strong>
              </div>
              {gameCompleted && (
                <div className="text-sm text-primary font-bold">
                  {messages.gameCompleted} {messages.gameTime}{" "}
                  {((endTime - startTime) / 1000).toFixed(2)}s
                </div>
              )}
            </div>

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
                      number < currentNumber
                        ? "#ffffff"
                        : number === currentNumber
                          ? "#000000"
                          : "var(--text-color)",
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
                        e.currentTarget.style.backgroundColor = "#f59e0b";
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

            <button
              onClick={resetGame}
              className="border-default border-radius transition-colors"
              style={{
                backgroundColor: "var(--background-color)",
                color: "var(--text-color)",
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
                cursor: "pointer",
                position: "relative",
                zIndex: 10,
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--hover-background)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--background-color)")
              }
            >
              {messages.gameReset}
            </button>
          </div>
        )}
      </div>

      {/* ホームに戻るボタン */}
      <a
        href="/"
        className="flex-center gap-half transition-all"
        style={{
          backgroundColor: "var(--primary-color)",
          color: "#ffffff",
          textDecoration: "none",
          padding: "0.75rem 1.5rem",
          borderRadius: "0.25rem",
          fontSize: "1rem",
          fontWeight: "bold",
          fontFamily: language === "zh" ? "'Noto Sans SC', sans-serif" : "inherit",
          position: "relative",
          zIndex: 10,
        }}
        onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
        onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
      >
        <ArrowIcon direction="left" size={16} strokeWidth={2} />
        {messages.backHome}
      </a>

      <BackgroundDots />
    </div>
  );
}
