"use client";

import { useState, useEffect } from "react";
import ArrowIcon from "./ArrowIcon";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // スクロール位置を監視
  useEffect(() => {
    const toggleVisibility = () => {
      // ページの上部から300px以上スクロールしたら表示
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // 滑らかにトップへスクロール
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) {
    return null;
  }
  return (
    <button
      onClick={scrollToTop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        width: "52px",
        height: "52px",
        backgroundColor: "var(--primary-color)",
        color: "#ffffff",
        border: "none",
        borderRadius: isHovered ? "2px" : "12px", // ホバー時をより角ばらせる
        cursor: "pointer",
        fontSize: "1.2rem",
        boxShadow: isHovered ? "0 8px 24px rgba(0,0,0,0.25)" : "0 4px 12px rgba(0,0,0,0.15)",
        transform: isHovered ? "scale(1.1) translateY(-2px)" : "scale(1) translateY(0)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        backdropFilter: "blur(10px)",
        animation: "fadeInUp 0.5s ease-out",
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.95) translateY(0)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = isHovered ? "scale(1.1) translateY(-2px)" : "scale(1) translateY(0)";
      }}
      title="ページトップに戻る"
    >
      <ArrowIcon direction="up" size={20} strokeWidth={2.5} />

      {/* CSS アニメーション */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </button>
  );
}
