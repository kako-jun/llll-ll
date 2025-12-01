
import { useState, useEffect } from "react";

export type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 少し遅延させてテーマを適用（トランジション用）
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const savedTheme = localStorage.getItem("theme") as Theme;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    
    // マウント完了後に状態を更新
    setMounted(true);
    setTheme(initialTheme);
    
    // 少し遅延させてDOMを更新（トランジション効果のため）
    setTimeout(() => {
      updateDocumentTheme(initialTheme);
    }, 100);
  }, []);

  const updateDocumentTheme = (newTheme: Theme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute("data-theme", newTheme);
      document.documentElement.style.background = newTheme === "dark" ? "#121212" : "#ffffff";
      document.documentElement.style.color = newTheme === "dark" ? "#ffffff" : "#000000";
    }
  };

  const toggleTheme = () => {
    const newTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    updateDocumentTheme(newTheme);
  };

  return { theme, toggleTheme, mounted };
}
