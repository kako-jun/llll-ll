import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Language, Product } from "@/types";
import { translations } from "@/lib/i18n";
import { LanguageBar, Header, Footer } from "@/components/layout";
import { IntroSection, ImageDisplay, VisitorCounter, ScrollToTop } from "@/components/common";
import { ProjectList } from "@/components/project";
import { BackgroundDots } from "@/components/game";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import NotFound from "@/pages/NotFound";
import Welcome from "@/pages/Welcome";

function HomePage() {
  const { theme, toggleTheme, mounted } = useTheme();
  const { language, changeLanguage } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingVisited, setCheckingVisited] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // 初回訪問チェック
  useEffect(() => {
    const visited = localStorage.getItem("visited");
    const savedLanguage = localStorage.getItem("language") as Language;

    if (!visited) {
      // 初回訪問：/welcome にリダイレクト
      setShouldRedirect(true);
    } else if (savedLanguage && ["en", "ja", "zh", "es"].includes(savedLanguage)) {
      // 2回目以降：保存された言語を復元
      changeLanguage(savedLanguage);
    }
    setCheckingVisited(false);
  }, [changeLanguage]);

  // プロダクトデータ読み込み
  useEffect(() => {
    if (!shouldRedirect) {
      fetch("/data/products.json")
        .then((res) => res.json())
        .then((data: Product[]) => {
          setProducts(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load products:", err);
          setLoading(false);
        });
    }
  }, [shouldRedirect]);

  // タイトル更新
  useEffect(() => {
    const t = translations[language];
    document.title = `llll-ll - ${t.siteSubtitle}`;
  }, [language]);

  // 言語変更ハンドラ（localStorageも更新）
  const handleLanguageChange = (lang: Language) => {
    changeLanguage(lang);
    localStorage.setItem("language", lang);
  };

  // 訪問チェック中は何も表示しない（ちらつき防止）
  if (checkingVisited) {
    return null;
  }

  // 初回訪問時は /welcome にリダイレクト
  if (shouldRedirect) {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <>
      <LanguageBar
        selectedLanguage={language}
        theme={theme}
        mounted={mounted}
        onLanguageSelect={handleLanguageChange}
        onThemeToggle={toggleTheme}
      />

      <Header language={language} />

      <main
        style={{
          backgroundColor: "var(--background-color)",
          minHeight: "calc(100vh - 200px)",
          transition: "background-color 0.3s ease",
        }}
      >
        <IntroSection language={language} />
        <ImageDisplay language={language} />
        <VisitorCounter language={language} />

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <div style={{ color: "#6c757d" }}>Loading...</div>
          </div>
        ) : (
          <ProjectList products={products} language={language} />
        )}

        {/* Support BBS */}
        <section
          style={{ padding: "2rem 1rem 6rem 1rem", display: "flex", justifyContent: "center" }}
        >
          {/* @ts-expect-error - nostalgic-bbs is a custom element */}
          <nostalgic-bbs id="llll-ll-f843ad67" theme="retro" />
        </section>
      </main>

      <Footer language={language} />
      <ScrollToTop />
      <BackgroundDots />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/easter-egg" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
