import { describe, it, expect } from "vitest";
import { formatCount } from "../static/js/visits-counter.js";

// formatCount は訪問数を固定 "," 3桁区切りに整形する純粋関数（DOM・ロケール非依存）。
// 不正値（非数値・負・非有限）は null を返し、呼び出し側で「---」を残させる。

describe("formatCount", () => {
  describe("valid numbers", () => {
    it("0 はそのまま '0'", () => {
      expect(formatCount(0)).toBe("0");
    });

    it("1桁は区切りなし", () => {
      expect(formatCount(8)).toBe("8");
    });

    it("3桁はちょうど区切りなし", () => {
      expect(formatCount(144)).toBe("144");
    });

    it("4桁は区切り1つ", () => {
      expect(formatCount(1234)).toBe("1,234");
    });

    it("7桁は区切り2つ", () => {
      expect(formatCount(1234567)).toBe("1,234,567");
    });

    it("数値文字列も受け付ける", () => {
      expect(formatCount("32")).toBe("32");
      expect(formatCount("1234")).toBe("1,234");
    });
  });

  describe("invalid input returns null（'---' を残させる）", () => {
    it("非数値文字列", () => {
      expect(formatCount("abc")).toBeNull();
    });

    it("空文字・空白のみ", () => {
      expect(formatCount("")).toBeNull();
      expect(formatCount("   ")).toBeNull();
    });

    it("NaN", () => {
      expect(formatCount(NaN)).toBeNull();
    });

    it("負数", () => {
      expect(formatCount(-5)).toBeNull();
    });

    it("Infinity", () => {
      expect(formatCount(Infinity)).toBeNull();
    });

    it("null / undefined", () => {
      expect(formatCount(null)).toBeNull();
      expect(formatCount(undefined)).toBeNull();
    });
  });
});
