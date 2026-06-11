import { describe, it, expect } from "vitest";
import { cardMatches } from "./apps-filter.js";

// 全カードを「3条件すべて通過」状態から作り、観点ごとに1要素だけ崩す。
// tags/search/featured は呼び出し側で小文字・trim 済みの前提（関数は正規化しない）。
function mk({ tags = [], search = "", featured = false } = {}) {
  return { tags, search, featured };
}

describe("cardMatches", () => {
  describe("featured toggle", () => {
    it("ignores card.featured when featuredOnly is off", () => {
      expect(cardMatches("", [], false, mk({ featured: false }))).toBe(true);
      expect(cardMatches("", [], false, mk({ featured: true }))).toBe(true);
    });

    it("hides a non-featured card when featuredOnly is on", () => {
      expect(cardMatches("", [], true, mk({ featured: false }))).toBe(false);
    });

    it("shows a featured card when featuredOnly is on and other conditions pass", () => {
      expect(cardMatches("", [], true, mk({ featured: true }))).toBe(true);
    });
  });

  describe("text search", () => {
    it("treats an empty search as no text condition", () => {
      expect(cardMatches("", [], false, mk({ search: "anything here" }))).toBe(true);
    });

    it("matches a prefix substring", () => {
      expect(cardMatches("app", [], false, mk({ search: "app productivity" }))).toBe(true);
    });

    it("matches an interior substring", () => {
      expect(cardMatches("product", [], false, mk({ search: "app productivity" }))).toBe(true);
    });

    it("matches a suffix substring", () => {
      expect(cardMatches("ivity", [], false, mk({ search: "app productivity" }))).toBe(true);
    });

    it("rejects a term absent from card.search", () => {
      expect(cardMatches("game", [], false, mk({ search: "app productivity" }))).toBe(false);
    });

    it("does not lower-case the search term (case sensitivity is the caller's job)", () => {
      expect(cardMatches("App", [], false, mk({ search: "app productivity" }))).toBe(false);
    });

    it("matches a multibyte (Japanese) substring", () => {
      expect(cardMatches("ツール", [], false, mk({ search: "日本語 ツール" }))).toBe(true);
    });
  });

  describe("tag AND", () => {
    it("treats an empty array of activeTags as no tag condition", () => {
      expect(cardMatches("", [], false, mk({ tags: ["a"] }))).toBe(true);
    });

    it("treats an empty Set of activeTags as no tag condition", () => {
      expect(cardMatches("", new Set(), false, mk({ tags: ["a"] }))).toBe(true);
    });

    it("passes a card that contains the single required tag", () => {
      expect(cardMatches("", ["a"], false, mk({ tags: ["a", "b"] }))).toBe(true);
    });

    it("rejects a card that lacks the single required tag", () => {
      expect(cardMatches("", ["c"], false, mk({ tags: ["a", "b"] }))).toBe(false);
    });

    it("passes a card that contains every required tag", () => {
      expect(cardMatches("", ["a", "b"], false, mk({ tags: ["a", "b", "c"] }))).toBe(true);
    });

    it("rejects a card missing even one required tag (AND, not OR)", () => {
      expect(cardMatches("", ["a", "b"], false, mk({ tags: ["a"] }))).toBe(false);
    });

    it("rejects a tagless card when tags are required", () => {
      expect(cardMatches("", ["a"], false, mk({ tags: [] }))).toBe(false);
    });

    it("passes a tagless card when no tags are required", () => {
      expect(cardMatches("", [], false, mk({ tags: [] }))).toBe(true);
    });
  });

  describe("input shape normalization (array vs Set)", () => {
    it("matches identically whether activeTags is an array or a Set (contains)", () => {
      const card = mk({ tags: ["a", "b"] });
      expect(cardMatches("", ["a"], false, card)).toBe(true);
      expect(cardMatches("", new Set(["a"]), false, card)).toBe(true);
    });

    it("matches identically whether activeTags is an array or a Set (missing)", () => {
      const card = mk({ tags: ["a", "b"] });
      expect(cardMatches("", ["z"], false, card)).toBe(false);
      expect(cardMatches("", new Set(["z"]), false, card)).toBe(false);
    });

    it("matches identically whether card.tags is an array or a Set", () => {
      expect(cardMatches("", ["a"], false, mk({ tags: ["a", "b"] }))).toBe(true);
      expect(cardMatches("", ["a"], false, mk({ tags: new Set(["a", "b"]) }))).toBe(true);
    });
  });

  describe("AND composition of the three conditions", () => {
    it("passes when search, every tag, and featured all hold", () => {
      const card = mk({ tags: ["a", "b"], search: "app productivity", featured: true });
      expect(cardMatches("app", ["a", "b"], true, card)).toBe(true);
    });

    it("rejects when search and tags pass but featured does not", () => {
      const card = mk({ tags: ["a", "b"], search: "app productivity", featured: false });
      expect(cardMatches("app", ["a", "b"], true, card)).toBe(false);
    });

    it("rejects when search and featured pass but a required tag is missing", () => {
      const card = mk({ tags: ["a"], search: "app productivity", featured: true });
      expect(cardMatches("app", ["a", "b"], true, card)).toBe(false);
    });

    it("rejects when tags and featured pass but the search misses", () => {
      const card = mk({ tags: ["a", "b"], search: "app productivity", featured: true });
      expect(cardMatches("game", ["a", "b"], true, card)).toBe(false);
    });

    it("rejects when none of the three conditions hold", () => {
      const card = mk({ tags: ["x"], search: "app productivity", featured: false });
      expect(cardMatches("game", ["a", "b"], true, card)).toBe(false);
    });
  });

  describe("return value contract", () => {
    it("returns a strict boolean true on a match", () => {
      expect(cardMatches("", [], false, mk())).toBe(true);
    });

    it("returns a strict boolean false on a miss", () => {
      expect(cardMatches("", ["a"], false, mk({ tags: [] }))).toBe(false);
    });
  });
});
