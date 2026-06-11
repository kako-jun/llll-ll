import { describe, it, expect } from "vitest";
import { dailyIndexForDate } from "../static/js/daily-art.js";

// dailyIndexForDate は「今日の日替わりインデックス」を返す純粋関数（DOM 非依存）。
// epoch からの日数（Math.floor(epochMs / DAY)）を枚数で mod してローテする。
// count <= 0 のときだけ null、それ以外は 0 <= idx < count。
const DAY = 86400000; // 1日のミリ秒（Math.floor(epochMs / DAY) ＝ epoch からの日数）。

describe("dailyIndexForDate", () => {
  describe("invalid count", () => {
    it("returns null when count is zero", () => {
      expect(dailyIndexForDate(0, 0)).toBeNull();
    });

    it("returns null when count is negative", () => {
      expect(dailyIndexForDate(0, -3)).toBeNull();
    });
  });

  describe("single image (count = 1)", () => {
    it("is always 0 at epoch 0", () => {
      expect(dailyIndexForDate(0, 1)).toBe(0);
    });

    it("is always 0 for a present-day epoch", () => {
      expect(dailyIndexForDate(1749600000000, 1)).toBe(0);
    });

    it("is always 0 for a very large epoch", () => {
      expect(dailyIndexForDate(99999 * DAY, 1)).toBe(0);
    });
  });

  describe("rotation boundary (mod wrap-around, count = 30)", () => {
    it("maps day 0 to index 0", () => {
      expect(dailyIndexForDate(0, 30)).toBe(0);
    });

    it("maps day 1 to index 1", () => {
      expect(dailyIndexForDate(1 * DAY, 30)).toBe(1);
    });

    it("maps day 29 to index 29 (last before wrap)", () => {
      expect(dailyIndexForDate(29 * DAY, 30)).toBe(29);
    });

    it("wraps day 30 back to index 0", () => {
      expect(dailyIndexForDate(30 * DAY, 30)).toBe(0);
    });

    it("maps day 31 to index 1 (continues after wrap)", () => {
      expect(dailyIndexForDate(31 * DAY, 30)).toBe(1);
    });
  });

  describe("stability within the same day", () => {
    it("returns the same index for morning and night of day 5", () => {
      const morning = dailyIndexForDate(5 * DAY, 30);
      const night = dailyIndexForDate(5 * DAY + (DAY - 1), 30);
      expect(morning).toBe(night);
      expect(morning).toBe(5);
    });
  });

  describe("value range (0 <= idx < count)", () => {
    it("stays in range across several epochs and counts spanning the wrap", () => {
      const cases = [
        { epochMs: 0, count: 7 },
        { epochMs: 6 * DAY, count: 7 }, // last before wrap
        { epochMs: 7 * DAY, count: 7 }, // wrap to 0
        { epochMs: 100 * DAY, count: 7 },
        { epochMs: 1749600000000, count: 12 },
        { epochMs: 99999 * DAY, count: 365 },
      ];
      for (const { epochMs, count } of cases) {
        const idx = dailyIndexForDate(epochMs, count);
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(count);
      }
    });
  });
});
