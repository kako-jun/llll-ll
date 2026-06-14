import { describe, it, expect } from "vitest";
// theme-toggle.js は island（module.exports ガード）。純粋ロジックだけ検証する（#9）。
// DOM 配線の IIFE は jsdom 下でも `.theme-toggle` が無ければ無害に終わる。
import { resolveTheme, nextTheme, bbsThemeFor, STORAGE_KEY } from "../static/js/theme-toggle.js";

describe("resolveTheme", () => {
  // #60: OS の prefers-color-scheme には追従しない。保存が 'light' のときだけライト、それ以外は既定ダーク。
  it("保存値が 'light' のときだけライト", () => {
    expect(resolveTheme("light")).toBe("light");
  });

  it("保存値が 'dark' ならダーク", () => {
    expect(resolveTheme("dark")).toBe("dark");
  });

  it("保存値が無ければ既定ダーク（OS 追従しない・#60）", () => {
    expect(resolveTheme(null)).toBe("dark");
    expect(resolveTheme(undefined)).toBe("dark");
  });

  it("不正な保存値は既定ダーク", () => {
    expect(resolveTheme("")).toBe("dark");
    expect(resolveTheme("sepia")).toBe("dark");
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
