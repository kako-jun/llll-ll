import { useState, useEffect } from "react";
import { Language } from "@/types";

// ブラウザ言語からデフォルト言語を決定
function getDefaultLanguage(): Language {
  if (typeof navigator === "undefined") return "en";

  const browserLang = navigator.language.toLowerCase();

  // ja, ja-JP など
  if (browserLang.startsWith("ja")) return "ja";
  // zh, zh-CN, zh-TW など
  if (browserLang.startsWith("zh")) return "zh";
  // es, es-ES など
  if (browserLang.startsWith("es")) return "es";

  return "en";
}

export function useLanguage() {
  const [language, setLanguage] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && ["en", "ja", "zh", "es"].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      // 保存された言語がなければブラウザ言語を使用
      setLanguage(getDefaultLanguage());
    }
  }, []);

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
    document.documentElement.lang = newLanguage;
  };

  return {
    language: mounted ? language : "en",
    changeLanguage,
    mounted,
  };
}
