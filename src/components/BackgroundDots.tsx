import { useEffect, useState } from "react";

interface Dot {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  animation: {
    y25: number;
    x25: number;
    y50: number;
    x50: number;
    y75: number;
    x75: number;
  };
}

// 事前定義されたドット設定（ハイドレーションエラーを避けるため）
const predefinedDots: Dot[] = [
  {
    id: 0,
    x: 15,
    y: 25,
    size: 8,
    duration: 8,
    delay: 0,
    opacity: 0.3,
    animation: { y25: 12, x25: -3, y50: 18, x50: 2, y75: 8, x75: -1 },
  },
  {
    id: 1,
    x: 75,
    y: 15,
    size: 6,
    duration: 9,
    delay: 1,
    opacity: 0.25,
    animation: { y25: 10, x25: 4, y50: 15, x50: -2, y75: 12, x75: 3 },
  },
  {
    id: 2,
    x: 45,
    y: 70,
    size: 7,
    duration: 7,
    delay: 2,
    opacity: 0.35,
    animation: { y25: 15, x25: -2, y50: 20, x50: 4, y75: 10, x75: -3 },
  },
  {
    id: 3,
    x: 85,
    y: 60,
    size: 9,
    duration: 10,
    delay: 0.5,
    opacity: 0.2,
    animation: { y25: 8, x25: 3, y50: 12, x50: -4, y75: 14, x75: 1 },
  },
  {
    id: 4,
    x: 25,
    y: 80,
    size: 6,
    duration: 6,
    delay: 1.5,
    opacity: 0.4,
    animation: { y25: 18, x25: -4, y50: 25, x50: 1, y75: 12, x75: -2 },
  },
  {
    id: 5,
    x: 65,
    y: 35,
    size: 8,
    duration: 8.5,
    delay: 2.5,
    opacity: 0.28,
    animation: { y25: 11, x25: 2, y50: 16, x50: -3, y75: 9, x75: 4 },
  },
  {
    id: 6,
    x: 10,
    y: 50,
    size: 7,
    duration: 9.5,
    delay: 0.8,
    opacity: 0.32,
    animation: { y25: 13, x25: -1, y50: 19, x50: 3, y75: 11, x75: -4 },
  },
  {
    id: 7,
    x: 90,
    y: 25,
    size: 5,
    duration: 7.5,
    delay: 1.8,
    opacity: 0.22,
    animation: { y25: 9, x25: 4, y50: 14, x50: -1, y75: 16, x75: 2 },
  },
];

// Generate keyframes CSS
const keyframesCSS = predefinedDots
  .map(
    (dot) => `
  @keyframes float-${dot.id} {
    0%, 100% {
      transform: translateY(0px) translateX(0px);
    }
    25% {
      transform: translateY(-${dot.animation.y25}px) translateX(${dot.animation.x25}px);
    }
    50% {
      transform: translateY(-${dot.animation.y50}px) translateX(${dot.animation.x50}px);
    }
    75% {
      transform: translateY(-${dot.animation.y75}px) translateX(${dot.animation.x75}px);
    }
  }
`
  )
  .join("");

export default function BackgroundDots() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Inject keyframes CSS
    const styleId = 'background-dots-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = keyframesCSS;
      document.head.appendChild(style);
    }
  }, []);

  // SSR中は何も表示しない
  if (!mounted) {
    return null;
  }

  return (
    <>
      {predefinedDots.map((dot) => (
        <div
          key={dot.id}
          className={`floating-dot-${dot.id}`}
          style={{
            position: "fixed",
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            backgroundColor: "var(--primary-color)",
            opacity: dot.opacity,
            borderRadius: "0px",
            animation: `float-${dot.id} ${dot.duration}s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
            animationDelay: `${dot.delay}s`,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ))}
    </>
  );
}
