"use client";

import Image from "next/image";
interface FooterProps {}

export default function Footer({}: FooterProps) {
  const socialLinks = [
    { name: "GitHub", url: "https://github.com/kako-jun", icon: "/icons/github.svg", size: 20 },
    { name: "X", url: "https://x.com/kako_jun_42", icon: "/icons/x-twitter.svg", size: 20 },
    { name: "Instagram", url: "https://www.instagram.com/kako_jun_42", icon: "/icons/instagram.svg", size: 20 },
    { name: "Dev.to", url: "https://dev.to/kako-jun", icon: "/icons/dev-to-wide-final.png", size: 24 },
    { name: "Zenn", url: "https://zenn.dev/kako_jun", icon: "/icons/zenn.svg", size: 20 },
    { name: "Note", url: "https://note.com/kako_jun", icon: "/icons/note.svg", size: 24 }, // noteだけ大きく
  ];

  return (
    <footer
      style={{
        backgroundColor: "var(--footer-background)",
        borderTop: "1px solid var(--border-color)",
        marginTop: "3rem",
        padding: "2rem 0 4rem 0", // 下のパディングを増やしてScrollToTopボタンとの重複を避ける
        position: "relative",
        zIndex: 2,
        backgroundImage: "var(--footer-gradient)",
        transition: "background-color 0.3s ease, background-image 0.3s ease",
      }}
    >
      {/* プロフィール画像プレイスホルダ */}
      <div
        style={{
          position: "absolute",
          top: "-30px", // フッター線より上に1/3程度はみ出す
          left: "50%",
          transform: "translateX(-183px)", // kako-junテキストの真上に配置（1px右にずらす）
          width: "80px",
          height: "80px",
          backgroundColor: "var(--input-background)",
          border: "2px solid var(--border-color)",
          borderRadius: "4px", // 四角いデザインに合わせて角を少し丸く
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.7rem",
          color: "var(--muted-text)",
          textAlign: "center",
          zIndex: 10,
        }}
      >
        Profile
        <br />
        Image
      </div>

      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "2rem", // 下マージンを増やしてScrollToTopボタンとの重複を防ぐ
            marginTop: "20px", // プロフィール画像分のスペースを確保
          }}
        >
          <span style={{ color: "var(--muted-text)", fontSize: "0.9rem" }}>© kako-jun</span>

          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                textDecoration: "none",
                color: "var(--text-color)",
                transition: "all 0.2s ease",
                borderRadius: "4px",
              }}
              title={link.name}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
                e.currentTarget.style.backgroundColor = "var(--hover-color, rgba(0,0,0,0.1))";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Image
                src={link.icon}
                alt={link.name}
                width={link.size}
                height={link.size}
                style={{
                  filter: "var(--icon-filter, none)",
                }}
              />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
