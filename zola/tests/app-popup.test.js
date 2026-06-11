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
