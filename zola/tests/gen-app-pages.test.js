import { describe, it, expect } from "vitest";
import {
  tomlStr,
  fileSlug,
  fileName,
  renderPage,
  computeWantedFiles,
  isProtectedIndex,
  DEFAULT_LANG,
  EXTRA_LANGS,
} from "../scripts/gen-app-pages.mjs";

// gen-app-pages.mjs の純粋ヘルパを検証する。i18n（#5）の核心は
// 「content ファイル名は id の "." を "-" に潰す（Zola が .nvim を言語コードと誤認しないため）が、
//  公開 URL（path）は id の "." をそのまま維持する」という不変条件。ここを二重に守る。

describe("fileSlug", () => {
  it("素通し: dot もハイフンも無い id はそのまま", () => {
    expect(fileSlug("sasso")).toBe("sasso");
  });

  it("単一 dot を - に置換する", () => {
    expect(fileSlug("chillout.nvim")).toBe("chillout-nvim");
  });

  it("複数 dot を全置換する（/\\./g の global 回帰）", () => {
    // lastIndex 共有や global フラグ欠落の回帰を捕まえる。
    expect(fileSlug("a.b.c")).toBe("a-b-c");
  });

  it("先頭数字 id はそのまま（3min）", () => {
    expect(fileSlug("3min")).toBe("3min");
  });

  it("ハイフン id はそのまま（noun-gender）", () => {
    expect(fileSlug("noun-gender")).toBe("noun-gender");
  });

  it("dot 無しは恒等（変化させない）", () => {
    expect(fileSlug("machigai-salad")).toBe("machigai-salad");
  });
});

describe("fileName", () => {
  it("既定言語(en)は接頭辞なしの {slug}.md（言語境界）", () => {
    expect(fileName("sasso", "en")).toBe("sasso.md");
  });

  it("ja は {slug}.ja.md", () => {
    expect(fileName("sasso", "ja")).toBe("sasso.ja.md");
  });

  it("es は {slug}.es.md", () => {
    expect(fileName("sasso", "es")).toBe("sasso.es.md");
  });

  it("dotted は事前に slug 化済みのためファイル名の dot は lang 区切りのみ", () => {
    // fileName には slug（dot 無し）が渡る契約。lang 区切り以外に dot は現れない。
    expect(fileName("chillout-nvim", "ja")).toBe("chillout-nvim.ja.md");
  });
});

describe("renderPage path", () => {
  it("en は接頭辞なし（apps/sasso）", () => {
    const fm = renderPage({ id: "sasso", title: { en: "Sasso" } }, "en");
    expect(fm).toContain('path = "apps/sasso"');
  });

  it("ja は接頭辞付き（ja/apps/sasso）", () => {
    const fm = renderPage({ id: "sasso", title: { ja: "サッソ" } }, "ja");
    expect(fm).toContain('path = "ja/apps/sasso"');
  });

  it("dotted id は path で dot を維持する（en=apps/chillout.nvim）", () => {
    const fm = renderPage({ id: "chillout.nvim", title: { en: "Chillout" } }, "en");
    expect(fm).toContain('path = "apps/chillout.nvim"');
  });

  it("dotted id は接頭辞付きでも path で dot を維持する（ja/apps/chillout.nvim）", () => {
    const fm = renderPage({ id: "chillout.nvim", title: { ja: "ちる" } }, "ja");
    expect(fm).toContain('path = "ja/apps/chillout.nvim"');
  });

  it("先頭数字 id も path で素通し（apps/3min）", () => {
    const fm = renderPage({ id: "3min", title: { en: "3min" } }, "en");
    expect(fm).toContain('path = "apps/3min"');
  });

  it("frontmatter に template=app.html が入る", () => {
    const fm = renderPage({ id: "sasso", title: { en: "Sasso" } }, "en");
    expect(fm).toContain('template = "app.html"');
  });

  it("app_id は生 id（dot 維持）で [extra] に入る", () => {
    const fm = renderPage({ id: "chillout.nvim", title: { en: "C" } }, "en");
    expect(fm).toContain("[extra]");
    expect(fm).toContain('app_id = "chillout.nvim"');
  });

  it("i18n 核心の不変条件: ファイル名は dot 無し ∧ path は dot 在り（同一ケースで二重アサート）", () => {
    const id = "chillout.nvim";
    // ファイル名側: slug は dot を - に潰す → ファイル名に "." は lang 区切り以外現れない。
    expect(fileName(fileSlug(id), "ja")).toBe("chillout-nvim.ja.md");
    expect(fileSlug(id)).not.toContain(".");
    // URL（path）側: 生 id をそのまま使う → dot を維持する。
    const fm = renderPage({ id, title: { ja: "x" } }, "ja");
    expect(fm).toContain('path = "ja/apps/chillout.nvim"');
  });
});

describe("renderPage title フォールバック", () => {
  it("title[lang] を最優先で使う", () => {
    const fm = renderPage({ id: "x", title: { en: "EN", ja: "JA" } }, "ja");
    expect(fm).toContain('title = "JA"');
  });

  it("title[lang] 欠落なら title.en にフォールバック", () => {
    const fm = renderPage({ id: "x", title: { en: "EN" } }, "ja");
    expect(fm).toContain('title = "EN"');
  });

  it("en も欠落なら title.ja にフォールバック", () => {
    const fm = renderPage({ id: "x", title: { ja: "JA" } }, "es");
    expect(fm).toContain('title = "JA"');
  });

  it("title 自体 undefined なら app.id を使う", () => {
    const fm = renderPage({ id: "fallback-id" }, "en");
    expect(fm).toContain('title = "fallback-id"');
  });

  it("title が空オブジェクトなら app.id を使う", () => {
    const fm = renderPage({ id: "empty-title", title: {} }, "en");
    expect(fm).toContain('title = "empty-title"');
  });
});

describe("tomlStr", () => {
  it("二重引用符を \\\" にエスケープ（diffai 実データに存在）", () => {
    expect(tomlStr('say "hi"')).toBe('say \\"hi\\"');
  });

  it("バックスラッシュを \\\\ にエスケープ", () => {
    expect(tomlStr("a\\b")).toBe("a\\\\b");
  });

  it("バックスラッシュと引用符の同時出現で順序事故が無い（\\ を先に処理）", () => {
    // 入力 \"  → \ を \\ にしてから " を \" にする。\\\" が正解。
    // 順序を逆にすると \" → \\" → \\\\" のような二重処理事故が出るのを防ぐ。
    expect(tomlStr('\\"')).toBe('\\\\\\"');
  });

  it("改行・CR・タブをエスケープする", () => {
    expect(tomlStr("a\nb\rc\td")).toBe("a\\nb\\rc\\td");
  });

  it("CJK・アクセント付き文字は素通し", () => {
    expect(tomlStr("間違い café")).toBe("間違い café");
  });

  it("非文字列は String() 化する", () => {
    expect(tomlStr(123)).toBe("123");
    expect(tomlStr(null)).toBe("null");
  });
});

describe("computeWantedFiles", () => {
  it("1アプリは4ファイル（en/ja/zh/es）になる", () => {
    const set = computeWantedFiles([{ id: "sasso" }]);
    expect(set.size).toBe(4);
    expect(set.has("sasso.md")).toBe(true);
    expect(set.has("sasso.ja.md")).toBe(true);
    expect(set.has("sasso.zh.md")).toBe(true);
    expect(set.has("sasso.es.md")).toBe(true);
  });

  it("dot id は slug 名（dot→-）でファイルが入る", () => {
    const set = computeWantedFiles([{ id: "chillout.nvim" }]);
    expect(set.has("chillout-nvim.md")).toBe(true);
    expect(set.has("chillout-nvim.ja.md")).toBe(true);
    // dot のままのファイル名は入らない。
    expect(set.has("chillout.nvim.md")).toBe(false);
  });

  it("空配列なら空集合（_index は別管理）", () => {
    expect(computeWantedFiles([]).size).toBe(0);
  });

  it("id を持たない要素はスキップする", () => {
    const set = computeWantedFiles([{ id: "ok" }, { foo: "bar" }, null]);
    expect(set.size).toBe(4); // ok の4ファイルのみ
  });
});

describe("isProtectedIndex", () => {
  it("_index.md は保護対象（true）", () => {
    expect(isProtectedIndex("_index.md")).toBe(true);
  });

  it("_index.ja.md は保護対象（true）", () => {
    expect(isProtectedIndex("_index.ja.md")).toBe(true);
  });

  it("_index.zh.md は保護対象（true）", () => {
    expect(isProtectedIndex("_index.zh.md")).toBe(true);
  });

  it("_index.foo.md（3文字以上）は保護対象でない（false）", () => {
    expect(isProtectedIndex("_index.foo.md")).toBe(false);
  });

  it("通常アプリページ sasso.md は保護対象でない（false）", () => {
    expect(isProtectedIndex("sasso.md")).toBe(false);
  });
});

describe("言語定数", () => {
  it("既定言語は en、追加言語は ja/zh/es", () => {
    // config.toml の [languages.*] と一致していること。
    expect(DEFAULT_LANG).toBe("en");
    expect(EXTRA_LANGS).toEqual(["ja", "zh", "es"]);
  });
});
