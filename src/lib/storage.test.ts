import { describe, it, expect, beforeEach } from "vitest";
import { getStorage, setStorage } from "./storage";

beforeEach(() => {
  localStorage.clear();
});

describe("storage", () => {
  it("returns undefined when the key was never written", () => {
    expect(getStorage("language")).toBeUndefined();
  });

  it("round-trips a single value via the JSON blob", () => {
    setStorage("language", "ja");
    expect(getStorage("language")).toBe("ja");
  });

  it("stores all keys under the single 'llll-ll' localStorage entry", () => {
    setStorage("language", "ja");
    setStorage("theme", "dark");
    setStorage("visited", true);
    const raw = localStorage.getItem("llll-ll");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toEqual({
      language: "ja",
      theme: "dark",
      visited: true,
    });
  });

  it("overwrites just the touched key, preserving the rest", () => {
    setStorage("language", "ja");
    setStorage("theme", "dark");
    setStorage("language", "en");
    expect(getStorage("language")).toBe("en");
    expect(getStorage("theme")).toBe("dark");
  });

  it("returns undefined and does not throw when the stored JSON is corrupt", () => {
    localStorage.setItem("llll-ll", "{not json");
    expect(getStorage("language")).toBeUndefined();
  });
});
