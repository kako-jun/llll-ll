import { useState } from "react";
import { Language } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import WelcomeScreen from "./WelcomeScreen";
import LanguageBar from "./LanguageBar";

interface LanguageSelectorProps {
  onLanguageSelect: (lang: Language) => void;
  selectedLanguage?: Language | null;
}

export default function LanguageSelector({
  onLanguageSelect,
  selectedLanguage,
}: LanguageSelectorProps) {
  const { theme, toggleTheme, mounted } = useTheme();
  const { language: currentLang, changeLanguage } = useLanguage();
  const [isChanging, setIsChanging] = useState(false);

  // 言語変更時のフェード効果付き関数
  const changeLanguageWithFade = (lang: Language) => {
    if (lang !== currentLang) {
      setIsChanging(true);
      setTimeout(() => {
        changeLanguage(lang);
        setIsChanging(false);
      }, 200);
    }
  };

  // 言語選択時にHTMLのlang属性も更新
  const handleLanguageSelect = (lang: Language) => {
    changeLanguage(lang);
    onLanguageSelect(lang);
  };

  // 言語が既に選択されている場合は、コンパクトな表示
  if (selectedLanguage) {
    return (
      <LanguageBar
        selectedLanguage={selectedLanguage}
        theme={theme}
        mounted={mounted}
        onLanguageSelect={handleLanguageSelect}
        onThemeToggle={toggleTheme}
      />
    );
  }

  // 言語が未選択の場合は、フルスクリーンの選択画面
  return (
    <WelcomeScreen
      currentLang={currentLang}
      isChanging={isChanging}
      onLanguageChange={changeLanguageWithFade}
      onContinue={() => handleLanguageSelect(currentLang)}
    />
  );
}
