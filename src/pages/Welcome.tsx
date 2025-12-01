import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Language } from "@/types";
import { translations } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";
import { WelcomeScreen } from "@/components/layout";
import { BackgroundDots } from "@/components/game";

export default function Welcome() {
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const [isChanging, setIsChanging] = useState(false);

  // 言語変更時のフェード効果付き関数
  const changeLanguageWithFade = (lang: Language) => {
    if (lang !== language) {
      setIsChanging(true);
      setTimeout(() => {
        changeLanguage(lang);
        setIsChanging(false);
      }, 200);
    }
  };

  // 続行ボタン押下時
  const handleContinue = () => {
    // 訪問済みフラグと言語を保存
    localStorage.setItem("visited", "true");
    localStorage.setItem("language", language);
    // ホームに遷移
    navigate("/");
  };

  // タイトル更新
  useEffect(() => {
    const t = translations[language];
    document.title = `llll-ll - ${t.siteSubtitle}`;
  }, [language]);

  return (
    <>
      <WelcomeScreen
        currentLang={language}
        isChanging={isChanging}
        onLanguageChange={changeLanguageWithFade}
        onContinue={handleContinue}
      />
      <BackgroundDots />
    </>
  );
}
