import { describe, it, expect } from "vitest";
// theme-toggle.js は island（module.exports ガード）。純粋ロジックだけ検証する（#9）。
// DOM 配線の IIFE は jsdom 下でも `.theme-toggle` が無ければ無害に終わる。
import { resolveTheme, nextTheme, bbsThemeFor, STORAGE_KEY } from "../static/js/theme-toggle.js";

describe("resolveTheme", () => {
  it("保存値 light/dark をそのまま採用（OS より優先）", () => {
    expect(resolveTheme("light", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", true)).toBe("dark");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("保存値が無ければ prefers-color-scheme に委ねる（既定ダーク）", () => {
    expect(resolveTheme(null, true)).toBe("light");
    expect(resolveTheme(null, false)).toBe("dark");
    expect(resolveTheme(undefined, false)).toBe("dark");
  });

  it("不正な保存値は OS フォールバック", () => {
    expect(resolveTheme("", true)).toBe("light");
    expect(resolveTheme("sepia", false)).toBe("dark");
  });
});

describe("nextTheme", () => {
  it("light ↔ dark を反転", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });
});

describe("bbsThemeFor", () => {
  it("ライト=light / ダーク=retro（kako-jun: BBS もライト時はライトに）", () => {
    expect(bbsThemeFor("light")).toBe("light");
    expect(bbsThemeFor("dark")).toBe("retro");
  });
});

describe("STORAGE_KEY", () => {
  it("localStorage キーは llll-theme（_theme.html の no-flash と一致）", () => {
    expect(STORAGE_KEY).toBe("llll-theme");
  });
});
