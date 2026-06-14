import { describe, it, expect } from "vitest";
import { appHrefFromPath, createFragmentFetcher } from "../static/js/app-popup.js";

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

    it("preserves a hyphen in the id under a language prefix (noun-gender)", () => {
      expect(appHrefFromPath("/ja/apps/noun-gender/")).toBe("/ja/apps/noun-gender/");
    });

    it("rejects an uppercase language prefix (lang must be lowercase 2 letters)", () => {
      // 正規表現は [a-z]{2} なので大文字 lang は言語接頭辞として認めない。
      expect(appHrefFromPath("/JA/apps/sasso/")).toBeNull();
    });

    it("rejects a three-letter language prefix (lang must be exactly 2 letters)", () => {
      expect(appHrefFromPath("/jpn/apps/sasso/")).toBeNull();
    });

    it("rejects a one-letter language prefix (lang must be exactly 2 letters)", () => {
      expect(appHrefFromPath("/j/apps/sasso/")).toBeNull();
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

// createFragmentFetcher は href 単位でフラグメント HTML（Promise）をメモ化する純粋ファクトリ（DOM 非依存・#53）。
// hover/press の先読みと実クリックが同じ href の取得結果を共有して初回も即時にし、
// 失敗エントリは Map から evict して再試行（実クリック時のフォールバック）を生かす。
// fetchImpl をモックして「fetchImpl が何回呼ばれたか」「Map に何が残るか」を実観測する。

describe("createFragmentFetcher", () => {
  // 成功レスポンスのスタブ。res.ok=true で res.text() が指定 HTML を解決する最小形。
  function okResponse(html) {
    return { ok: true, text: () => Promise.resolve(html) };
  }

  // 観点1: createFragmentFetcher が関数として export され import できることを保証する。
  it("is exported as a function", () => {
    expect(typeof createFragmentFetcher).toBe("function");
  });

  // 観点2: 戻り値は { fetchFragment, cache } で、cache は空の Map であることを保証する。
  it("returns a fetchFragment function and an empty Map cache", () => {
    const fetcher = createFragmentFetcher(() => Promise.resolve(okResponse("<div></div>")));
    expect(typeof fetcher.fetchFragment).toBe("function");
    expect(fetcher.cache).toBeInstanceOf(Map);
    expect(fetcher.cache.size).toBe(0);
  });

  // 観点3: 成功時は res.text() の文字列をそのまま解決することを保証する。
  it("resolves with the HTML string from res.text() on success", async () => {
    const html = "<div class=app-detail>X</div>";
    const fetcher = createFragmentFetcher(() => Promise.resolve(okResponse(html)));
    await expect(fetcher.fetchFragment("/apps/sasso/")).resolves.toBe(html);
  });

  // 観点4: 同一 href の多重呼び出しは fetchImpl を1回しか呼ばず、同一 Promise（===）を返し cache は1件であることを保証する（冪等メモ化）。
  it("memoizes per href: calls fetchImpl once and returns the same Promise", async () => {
    let calls = 0;
    const html = "<div class=app-detail>same</div>";
    const fetcher = createFragmentFetcher((href) => {
      calls += 1;
      return Promise.resolve(okResponse(html));
    });

    const p1 = fetcher.fetchFragment("/apps/sasso/");
    const p2 = fetcher.fetchFragment("/apps/sasso/");
    expect(p1).toBe(p2); // 2回目は再 fetch せず同じ Promise を返す。

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe(html);
    expect(r2).toBe(html);
    expect(calls).toBe(1); // fetchImpl は1回だけ。
    expect(fetcher.cache.size).toBe(1);
  });

  // 観点5: fetchImpl が pending 中に同一 href を再呼び出ししても fetchImpl は1回（先読みとクリックの衝突回避）であることを保証する。
  it("shares an in-flight request: re-entrant calls during pending do not re-invoke fetchImpl", async () => {
    let calls = 0;
    // 外から解決できる deferred で「取得中（pending）」の状態を作り、その間に再呼び出しする。
    let resolveResponse;
    const responsePromise = new Promise((resolve) => {
      resolveResponse = resolve;
    });
    const fetcher = createFragmentFetcher((href) => {
      calls += 1;
      return responsePromise; // まだ解決しない＝pending のまま。
    });

    const p1 = fetcher.fetchFragment("/apps/sasso/"); // 取得開始。
    // fetchImpl は Promise.resolve().then(...) 内で呼ばれるためマイクロタスク遅延する。
    // 1ティック待って「fetchImpl が走り pending に入った」確定状態を作ってから再呼び出しする（決定論化）。
    await Promise.resolve();
    expect(calls).toBe(1); // ここで fetchImpl は1回走り、responsePromise 待ち（pending）。

    const p2 = fetcher.fetchFragment("/apps/sasso/"); // pending 中の再呼び出し。
    expect(p2).toBe(p1); // 取得中でも同じ Promise を共有する（Map ヒット）。
    expect(calls).toBe(1); // pending でも fetchImpl は増えない。

    resolveResponse(okResponse("<div class=app-detail>inflight</div>")); // ここで初めて解決。
    await expect(p1).resolves.toBe("<div class=app-detail>inflight</div>");
    expect(calls).toBe(1);
    expect(fetcher.cache.size).toBe(1);
  });

  // 観点6: res.ok=false は "HTTP {status}" で reject し、evict 後はもう一度呼ぶと fetchImpl が再度呼ばれる（再試行可能）ことを保証する。
  it("rejects with HTTP {status} when res.ok is false, evicts, and allows retry", async () => {
    let calls = 0;
    const fetcher = createFragmentFetcher((href) => {
      calls += 1;
      return Promise.resolve({ ok: false, status: 404 });
    });

    // reject を await してから cache を見る（catch eviction はマイクロタスクなので順序を確定させる）。
    await expect(fetcher.fetchFragment("/apps/missing/")).rejects.toThrow("HTTP 404");
    expect(fetcher.cache.size).toBe(0); // 失敗エントリは evict 済み。
    expect(calls).toBe(1);

    // evict 済みなので再呼び出しは fetchImpl を再度呼ぶ（実クリック時の再試行）。
    await expect(fetcher.fetchFragment("/apps/missing/")).rejects.toThrow("HTTP 404");
    expect(calls).toBe(2);
  });

  // 観点7: fetchImpl が非同期 reject（ネットワーク失敗）したとき reject し、evict されることを保証する。
  it("rejects and evicts when fetchImpl rejects asynchronously (network failure)", async () => {
    const fetcher = createFragmentFetcher(() => Promise.reject(new Error("network")));

    await expect(fetcher.fetchFragment("/apps/sasso/")).rejects.toThrow("network");
    expect(fetcher.cache.size).toBe(0); // evict 済み。
  });

  // 観点8: fetchImpl が同期 throw しても fetchFragment は throw せず reject Promise に正規化し、evict されることを保証する。
  it("normalizes a synchronous throw from fetchImpl into a rejected Promise and evicts", async () => {
    const fetcher = createFragmentFetcher(() => {
      throw new Error("sync boom");
    });

    // fetchFragment 呼び出し自体は throw しない（Promise.resolve().then で包まれているため）。
    const p = fetcher.fetchFragment("/apps/sasso/");
    expect(p).toBeInstanceOf(Promise);
    await expect(p).rejects.toThrow("sync boom");
    expect(fetcher.cache.size).toBe(0); // evict 済み。
  });

  // 観点9: 成功エントリは保持され、再呼び出ししても fetchImpl は呼ばれず cache は1件のままであることを保証する。
  it("retains successful entries: re-fetching does not re-invoke fetchImpl", async () => {
    let calls = 0;
    const html = "<div class=app-detail>keep</div>";
    const fetcher = createFragmentFetcher(() => {
      calls += 1;
      return Promise.resolve(okResponse(html));
    });

    await expect(fetcher.fetchFragment("/apps/sasso/")).resolves.toBe(html);
    expect(fetcher.cache.size).toBe(1);
    expect(calls).toBe(1);

    // 成功はキャッシュに残るので2回目は fetchImpl を呼ばない。
    await expect(fetcher.fetchFragment("/apps/sasso/")).resolves.toBe(html);
    expect(calls).toBe(1);
    expect(fetcher.cache.size).toBe(1);
  });

  // 観点10: 異なる href はそれぞれ fetchImpl を呼び、別エントリとして cache が2件になることを保証する。
  it("keeps separate cache entries for distinct hrefs", async () => {
    const seen = [];
    const fetcher = createFragmentFetcher((href) => {
      seen.push(href);
      return Promise.resolve(okResponse("<div class=app-detail>" + href + "</div>"));
    });

    await expect(fetcher.fetchFragment("/apps/sasso/")).resolves.toBe("<div class=app-detail>/apps/sasso/</div>");
    await expect(fetcher.fetchFragment("/apps/3min/")).resolves.toBe("<div class=app-detail>/apps/3min/</div>");

    expect(seen).toEqual(["/apps/sasso/", "/apps/3min/"]); // それぞれ1回ずつ呼ばれた。
    expect(fetcher.cache.size).toBe(2);
  });
});
