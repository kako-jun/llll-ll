import { useState, useEffect } from "react";
import { Language, Product } from "@/types";
import { translations } from "@/lib/i18n";
import { LanguageSelector, Header, Footer } from "@/components/layout";
import { IntroSection, ImageDisplay, VisitorCounter, ScrollToTop } from "@/components/common";
import { ProjectList } from "@/components/project";
import { BackgroundDots } from "@/components/game";

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingVisited, setCheckingVisited] = useState(true);

  // 初回訪問チェック：2回目以降は保存された言語で自動遷移
  useEffect(() => {
    const visited = localStorage.getItem("visited");
    const savedLanguage = localStorage.getItem("language") as Language;

    if (visited && savedLanguage && ["en", "ja", "zh", "es"].includes(savedLanguage)) {
      setSelectedLanguage(savedLanguage);
    }
    setCheckingVisited(false);
  }, []);

  // 言語選択時にvisitedフラグを保存
  const handleLanguageSelect = (lang: Language) => {
    localStorage.setItem("visited", "true");
    setSelectedLanguage(lang);
  };

  // 言語が決まったらタイトルを更新
  useEffect(() => {
    if (selectedLanguage) {
      const t = translations[selectedLanguage];
      document.title = `llll-ll - ${t.siteSubtitle}`;
    }
  }, [selectedLanguage]);

  useEffect(() => {
    if (selectedLanguage) {
      setLoading(true);
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
  }, [selectedLanguage]);

  // 訪問チェック中は何も表示しない（ちらつき防止）
  if (checkingVisited) {
    return null;
  }

  return (
    <>
      <LanguageSelector
        onLanguageSelect={handleLanguageSelect}
        selectedLanguage={selectedLanguage}
      />

      {selectedLanguage && (
        <>
          <Header language={selectedLanguage} />

          <main
            style={{
              backgroundColor: "var(--background-color)",
              minHeight: "calc(100vh - 200px)",
              transition: "background-color 0.3s ease",
            }}
          >
            <IntroSection language={selectedLanguage} />
            <ImageDisplay language={selectedLanguage} />
            <VisitorCounter language={selectedLanguage} />

            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem 0" }}>
                <div style={{ color: "#6c757d" }}>Loading...</div>
              </div>
            ) : (
              <ProjectList products={products} language={selectedLanguage} />
            )}
          </main>

          <Footer language={selectedLanguage} />
          <ScrollToTop />
        </>
      )}

      <BackgroundDots />
    </>
  );
}
