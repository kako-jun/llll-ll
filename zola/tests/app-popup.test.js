import { describe, it, expect } from "vitest";
import { appHrefFromPath } from "../static/js/app-popup.js";

// appHrefFromPath は popstate ハンドラが「現在 URL がアプリ詳細か」を判定する純粋関数（DOM 非依存）。
// /apps/{id}/ 形式だけを対象にし、正規化した href（先頭/末尾スラッシュ付き）を返す。

describe("appHrefFromPath", () => {
  describe("matches app detail paths", () => {
    it("returns the normalized href for /apps/{id}/", () => {
      expect(appHrefFromPath("/apps/sasso/")).toBe("/apps/sasso/");
    });

    it("normalizes a missing trailing slash", () => {
      expect(appHrefFromPath("/apps/sasso")).toBe("/apps/sasso/");
    });

    it("preserves a dot in the id (chillout.nvim)", () => {
      expect(appHrefFromPath("/apps/chillout.nvim/")).toBe("/apps/chillout.nvim/");
    });

    it("preserves a leading digit in the id (3min)", () => {
      expect(appHrefFromPath("/apps/3min/")).toBe("/apps/3min/");
    });

    it("preserves a hyphen in the id (noun-gender)", () => {
      expect(appHrefFromPath("/apps/noun-gender/")).toBe("/apps/noun-gender/");
    });
  });

  // i18n（#5）: 詳細ページは4言語に出る。en は接頭辞なし、ja/zh/es は /{lang}/apps/{id}/。
  // 接頭辞ごと正規化して返すこと（ポップアップが「今いる言語」のページを fetch/pushState するため）。
  describe("language-prefixed app detail paths", () => {
    it("returns the ja-prefixed href for /ja/apps/{id}/", () => {
      expect(appHrefFromPath("/ja/apps/sasso/")).toBe("/ja/apps/sasso/");
    });

    it("returns the zh-prefixed href for /zh/apps/{id}/", () => {
      expect(appHrefFromPath("/zh/apps/sasso/")).toBe("/zh/apps/sasso/");
    });

    it("returns the es-prefixed href for /es/apps/{id}/", () => {
      expect(appHrefFromPath("/es/apps/sasso/")).toBe("/es/apps/sasso/");
    });

    it("normalizes a missing trailing slash with a language prefix", () => {
      expect(appHrefFromPath("/ja/apps/sasso")).toBe("/ja/apps/sasso/");
    });

    it("preserves a dotted id under a language prefix (chillout.nvim)", () => {
      expect(appHrefFromPath("/zh/apps/chillout.nvim/")).toBe("/zh/apps/chillout.nvim/");
    });

    it("preserves a leading-digit id under a language prefix (3min)", () => {
      expect(appHrefFromPath("/es/apps/3min/")).toBe("/es/apps/3min/");
    });

    it("rejects an unknown language prefix (treats it as a non-app path)", () => {
      // "fr" は対応言語でないので、/fr/apps/... はアプリ詳細として扱わない。
      expect(appHrefFromPath("/fr/apps/sasso/")).toBeNull();
    });

    it("rejects a language-prefixed bare /apps section (no id)", () => {
      expect(appHrefFromPath("/ja/apps/")).toBeNull();
      expect(appHrefFromPath("/ja/apps")).toBeNull();
    });

    it("rejects a nested path below a language-prefixed app id", () => {
      expect(appHrefFromPath("/ja/apps/sasso/extra/")).toBeNull();
    });

    it("rejects a language home (not an app detail)", () => {
      expect(appHrefFromPath("/ja/")).toBeNull();
    });
  });

  describe("rejects non-app-detail paths", () => {
    it("rejects the portal root", () => {
      expect(appHrefFromPath("/")).toBeNull();
    });

    it("rejects the bare /apps section (no id)", () => {
      expect(appHrefFromPath("/apps/")).toBeNull();
      expect(appHrefFromPath("/apps")).toBeNull();
    });

    it("rejects a nested path below an app id", () => {
      expect(appHrefFromPath("/apps/sasso/extra/")).toBeNull();
    });

    it("rejects an unrelated path", () => {
      expect(appHrefFromPath("/blog/")).toBeNull();
    });
  });

  describe("input contract", () => {
    it("returns null for non-string input", () => {
      expect(appHrefFromPath(null)).toBeNull();
      expect(appHrefFromPath(undefined)).toBeNull();
      expect(appHrefFromPath(123)).toBeNull();
    });
  });
});
