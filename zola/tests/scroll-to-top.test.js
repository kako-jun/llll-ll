import { describe, it, expect } from "vitest";
// scroll-to-top.js は island（module.exports ガード）。純粋ロジックだけ検証する。
// DOM 配線の IIFE は jsdom 下でも `.to-top-btn` が無ければ無害に終わる。
import { shouldShow } from "../static/js/scroll-to-top.js";

describe("shouldShow", () => {
  it("閾値より下へスクロールしたら出す", () => {
    expect(shouldShow(321, 320)).toBe(true);
    expect(shouldShow(1000, 320)).toBe(true);
  });

  it("閾値以下では出さない（先頭付近では隠す）", () => {
    expect(shouldShow(0, 320)).toBe(false);
    expect(shouldShow(320, 320)).toBe(false);
    expect(shouldShow(100, 320)).toBe(false);
  });
});
