import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// mypace-feed.js の WebSocket 配線・描画の島テスト（jsdom + WebSocket mock）。
//
// 純粋関数（pickLatestNotes / relativeTime / parseRelayMessage）は mypace-feed.test.js で検証済み。
// ここでは IIFE が DOM（.mypace-feed[data-mypace-pubkey]）を読み、各 relay へ `new WebSocket(url)` で
// 接続し、onopen で ["REQ", subId, {authors,kinds:[1],limit}] を送り、onmessage の
// ["EVENT",subId,ev] / ["EOSE",subId] を集め、全 relay settle（EOSE/error/close）or タイムアウト(6000ms)で
// 1回だけ描画する挙動を、WebSocket を mock して検証する。
//
// 実装の settle/finish 経路（mypace-feed.js を精読）:
//   - expected = relays.length（ループ先頭で確定）。
//   - 各 relay は makeSettle() の settle を1個持ち、EOSE(onmessage) / onerror / onclose のどれが来ても
//     settle は1回だけ fire（fired フラグ）→ settledCount++ → maybeFinishAll()。
//   - maybeFinishAll() は settledCount >= expected かつ !done のとき finish() を**同期**で呼ぶ。
//   - finish(): done=true → clearTimeout → closeAll()（各 sock.close()）→ render()。
//   - render(): rendered ガード。pickLatestNotes が 0 件なら return（rendered は立てない＝プレースホルダ維持）。
//     1件以上なら rendered=true にして feed.textContent="" → fragment 差し込み（描画は1回だけ）。
//   - 描画後に来た onmessage EVENT は events.push されるだけで再描画はしない（render は finish からのみ）。
//   - タイムアウトは setTimeout(finish, 6000)。
//
// よって EOSE/error/close 完了ケースでは finish が同期で走るが、念のため flush() を挟んで安定させる。
// closeAll() が各 sock.close() を呼ぶので、mock の close() は throw せず、かつ onclose を自動発火しない
// （自動発火すると settle 二重カウントの検証が崩れるため。実装は fired ガードで守られているが、mock は素直に）。

const MODULE_PATH = "../static/js/mypace-feed.js";

// 実 config.toml の値（zola/config.toml）に一致させる。
const PUBKEY = "6f87b1ba22d8a659070008af6d5f3fe1d711e0162c65d8961728d04fb8657bfc";
const RELAYS = ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"];
const POST_BASE = "https://mypace.llll-ll.com/post/";
const SUB_ID = "llll-ll-mypace";

// 64桁 hex の event id を作る（連番を 64 桁にパディング）。
function hexId(n) {
  return String(n).padStart(64, "0");
}

// Nostr kind1 イベント。
function ev(id, content, createdAt) {
  return { id, kind: 1, pubkey: PUBKEY, content, created_at: createdAt };
}

// ---- WebSocket mock --------------------------------------------------------
// 島が代入した onopen/onmessage/onerror/onclose を、テストから手動発火する。
// 生成された各インスタンスは MockWS.instances に記録される。
let wsInstances;

class MockWS {
  constructor(url) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.sent = [];
    this.closed = false;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    wsInstances.push(this);
  }
  send(data) {
    this.sent.push(data);
  }
  close() {
    // 記録のみ。onclose は自動発火しない（実機の close は close イベントを起こすが、
    // ここでは settle 二重カウントの有無を素直に観測したいので発火させない）。
    this.closed = true;
  }
  // ---- テストから発火するヘルパ ----
  fireOpen() {
    this.readyState = 1; // OPEN
    if (this.onopen) this.onopen();
  }
  fireMessage(arr) {
    if (this.onmessage) this.onmessage({ data: JSON.stringify(arr) });
  }
  fireEvent(eventObj) {
    this.fireMessage(["EVENT", SUB_ID, eventObj]);
  }
  fireEose() {
    this.fireMessage(["EOSE", SUB_ID]);
  }
  fireError() {
    if (this.onerror) this.onerror();
  }
  fireClose() {
    if (this.onclose) this.onclose();
  }
}

// ---- DOM markup（zola/templates/index.html の .mypace-feed 最小再現） -------
function feedMarkup(overrides = {}) {
  const o = {
    pubkey: PUBKEY,
    relays: JSON.stringify(RELAYS),
    postBase: POST_BASE,
    limit: "3",
    ...overrides,
  };
  // null を渡した属性は出力しない（属性不在ケース）。
  const attr = (name, val) => (val === null ? "" : ` ${name}="${escapeAttr(val)}"`);
  return `
    <section class="panel panel-mypace">
      <span class="label">mypace</span>
      <div class="mypace-feed"${attr("data-mypace-pubkey", o.pubkey)}${attr(
        "data-mypace-relays",
        o.relays
      )}${attr("data-mypace-post-base", o.postBase)}${attr("data-mypace-limit", o.limit)}>
        <div class="mypace-line">最新のつぶやきを読み込み中…</div>
        <div class="mypace-line">&nbsp;</div>
        <div class="mypace-line">&nbsp;</div>
      </div>
    </section>
  `;
}

function escapeAttr(v) {
  return String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// DOM 流し込み → WebSocket を mock → 再 import（IIFE 実行）。
async function setupAndImport(html) {
  document.body.innerHTML = html;
  wsInstances = [];
  vi.stubGlobal("WebSocket", MockWS);
  vi.resetModules();
  await import(MODULE_PATH);
}

// マイクロ/マクロタスクを数回フラッシュ（finish は同期だが念のため安定化）。
async function flush() {
  for (let i = 0; i < 4; i++) {
    await new Promise((r) => setTimeout(r, 0));
  }
}

function feedEl() {
  return document.querySelector(".mypace-feed");
}
function notes() {
  return Array.from(document.querySelectorAll(".mypace-note"));
}
function lines() {
  return Array.from(document.querySelectorAll(".mypace-line"));
}

beforeEach(() => {
  document.body.innerHTML = "";
  wsInstances = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("mypace-feed WebSocket render (jsdom)", () => {
  describe("1. 正常描画", () => {
    it("3 relay が EOSE まで返すと .mypace-note が limit 件・本文は textContent（HTML 注入されない）", async () => {
      await setupAndImport(feedMarkup());
      expect(wsInstances.length).toBe(3);

      // relay0/1 は同じノート群、relay2 は別ノート。limit=3 なので新しい順に3件。
      const a = ev(hexId(1), "alpha", 1000);
      const b = ev(hexId(2), "beta", 2000);
      const c = ev(hexId(3), "gamma <b>bold</b>", 3000); // HTML を含む本文
      const d = ev(hexId(4), "delta", 4000);

      wsInstances.forEach((ws) => ws.fireOpen());
      wsInstances[0].fireEvent(a);
      wsInstances[0].fireEvent(b);
      wsInstances[1].fireEvent(b); // 重複（dedupe される）
      wsInstances[1].fireEvent(c);
      wsInstances[2].fireEvent(d);
      // 各 relay が EOSE → 3つ目で settledCount==expected==3 → finish() 同期描画。
      wsInstances[0].fireEose();
      wsInstances[1].fireEose();
      wsInstances[2].fireEose();
      await flush();

      const n = notes();
      expect(n.length).toBe(3); // limit=3（created_at 降順 d,c,b）
      const bodies = n.map((el) => el.querySelector(".mypace-note-body").textContent);
      expect(bodies).toEqual(["delta", "gamma <b>bold</b>", "beta"]);
      // HTML 注入されていない＝<b> が要素として生成されていない（textContent のまま）。
      expect(feedEl().querySelector("b")).toBeNull();
    });
  });

  describe("2. REQ 送信", () => {
    it("各 WS の onopen 後、send が Nostr REQ 形（kinds:[1]・authors=pubkey・limit:N）で1回呼ばれる", async () => {
      await setupAndImport(feedMarkup());
      wsInstances.forEach((ws) => ws.fireOpen());

      for (const ws of wsInstances) {
        expect(ws.sent.length).toBe(1);
        const msg = JSON.parse(ws.sent[0]);
        expect(Array.isArray(msg)).toBe(true);
        expect(msg[0]).toBe("REQ"); // action: でなく Nostr REQ 形
        expect(msg[1]).toBe(SUB_ID);
        const filter = msg[2];
        expect(filter.kinds).toEqual([1]);
        expect(filter.authors).toEqual([PUBKEY]); // data-mypace-pubkey と一致
        expect(filter.limit).toBe(3);
      }
    });
  });

  describe("3. per-note リンク（案2）", () => {
    it("各 .mypace-note は <a>・href=postBase+id・target=_blank・rel=noopener noreferrer", async () => {
      await setupAndImport(feedMarkup());
      wsInstances.forEach((ws) => ws.fireOpen());
      const id1 = hexId(11);
      const id2 = hexId(12);
      wsInstances[0].fireEvent(ev(id1, "one", 100));
      wsInstances[0].fireEvent(ev(id2, "two", 200));
      wsInstances.forEach((ws) => ws.fireEose());
      await flush();

      const n = notes();
      expect(n.length).toBe(2);
      // created_at 降順 → id2(200), id1(100)。
      expect(n[0].tagName).toBe("A");
      expect(n[0].getAttribute("href")).toBe(POST_BASE + id2);
      expect(n[0].getAttribute("target")).toBe("_blank");
      expect(n[0].getAttribute("rel")).toBe("noopener noreferrer");
      expect(n[1].getAttribute("href")).toBe(POST_BASE + id1);
      // id が hex で正しく連結されている。
      expect(n[0].getAttribute("href")).toContain(id2);
    });
  });

  describe("4. id 不正 / postBase 無し時の非リンク", () => {
    it("postBase 属性が空 → .mypace-note は <div>（href 無し）・本文は出る", async () => {
      await setupAndImport(feedMarkup({ postBase: "" }));
      wsInstances.forEach((ws) => ws.fireOpen());
      wsInstances[0].fireEvent(ev(hexId(21), "no link", 100));
      wsInstances.forEach((ws) => ws.fireEose());
      await flush();

      const n = notes();
      expect(n.length).toBe(1);
      expect(n[0].tagName).toBe("DIV");
      expect(n[0].getAttribute("href")).toBeNull();
      expect(n[0].querySelector(".mypace-note-body").textContent).toBe("no link");
    });

    it("id が 64桁hex でない → postBase があっても <div>（href 無し）・本文は出る", async () => {
      await setupAndImport(feedMarkup());
      wsInstances.forEach((ws) => ws.fireOpen());
      // id が hex でない（"zz..." 64文字だが hex でない）。
      const badId = "z".repeat(64);
      wsInstances[0].fireEvent(ev(badId, "bad id body", 100));
      wsInstances.forEach((ws) => ws.fireEose());
      await flush();

      const n = notes();
      expect(n.length).toBe(1);
      expect(n[0].tagName).toBe("DIV");
      expect(n[0].getAttribute("href")).toBeNull();
      expect(n[0].querySelector(".mypace-note-body").textContent).toBe("bad id body");
    });
  });

  describe("5. relay フィルタ無視ガード（kind/pubkey）", () => {
    it("別 kind・別 pubkey のイベントは捨て、本人の kind:1 だけ描画する", async () => {
      await setupAndImport(feedMarkup());
      wsInstances.forEach((ws) => ws.fireOpen());
      // 正規: 本人の kind:1。
      wsInstances[0].fireEvent(ev(hexId(31), "valid own note", 300));
      // 別 kind（reaction kind:7・本人）→ 捨てる。
      wsInstances[0].fireEvent({
        id: hexId(32),
        kind: 7,
        pubkey: PUBKEY,
        content: "reaction should be dropped",
        created_at: 400,
      });
      // 別 pubkey（他人の kind:1）→ 捨てる。
      wsInstances[0].fireEvent({
        id: hexId(33),
        kind: 1,
        pubkey: "f".repeat(64),
        content: "someone else should be dropped",
        created_at: 500,
      });
      wsInstances.forEach((ws) => ws.fireEose());
      await flush();

      const n = notes();
      expect(n.length).toBe(1);
      expect(n[0].querySelector(".mypace-note-body").textContent).toBe("valid own note");
    });
  });

  describe("6. 本文 truncate は CSS（line-clamp）— jsdom 観点外", () => {
    it("本文 textContent は全文入る（CSS 切り詰めは実機・jsdom では評価されないのでスキップ扱い）", async () => {
      // line-clamp による視覚的切り詰めは getComputedStyle で評価されない（jsdom 制約）。
      // ここでは「本文の全文が textContent に入る」ことだけ確認する（切り詰めは Playwright 実機の責務）。
      const long = "あ".repeat(500);
      await setupAndImport(feedMarkup());
      wsInstances.forEach((ws) => ws.fireOpen());
      wsInstances[0].fireEvent(ev(hexId(41), long, 100));
      wsInstances.forEach((ws) => ws.fireEose());
      await flush();

      const n = notes();
      expect(n.length).toBe(1);
      expect(n[0].querySelector(".mypace-note-body").textContent).toBe(long); // 全文（切り詰めなし）
    });
  });

  describe("7. 0件 → プレースホルダ維持", () => {
    it("全 relay が 0 イベントで EOSE → .mypace-note 0件・元の .mypace-line が残る・例外なし", async () => {
      await setupAndImport(feedMarkup());
      wsInstances.forEach((ws) => ws.fireOpen());
      expect(() => {
        wsInstances.forEach((ws) => ws.fireEose());
      }).not.toThrow();
      await flush();

      expect(notes().length).toBe(0);
      // プレースホルダ（.mypace-line）が据え置き。
      expect(lines().length).toBe(3);
    });
  });

  describe("8. 全 relay error → プレースホルダ維持", () => {
    it("全 WS が onerror/onclose → 描画されず .mypace-line 維持・例外なし・console 非汚染", async () => {
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await setupAndImport(feedMarkup());
      wsInstances.forEach((ws) => ws.fireOpen());
      expect(() => {
        wsInstances[0].fireError();
        wsInstances[1].fireError();
        wsInstances[2].fireClose();
      }).not.toThrow();
      await flush();

      expect(notes().length).toBe(0);
      expect(lines().length).toBe(3);
      expect(errSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe("9. 二重描画防止（複数 relay の同 id ＋ 各 EOSE）", () => {
    it("2 relay が同 id イベント＋各 EOSE → dedupe で1ノート・描画は1回（二重に増えない）", async () => {
      // relays を2件にして expected=2 のレースを作る。
      await setupAndImport(feedMarkup({ relays: JSON.stringify([RELAYS[0], RELAYS[1]]) }));
      expect(wsInstances.length).toBe(2);
      wsInstances.forEach((ws) => ws.fireOpen());

      const same = ev(hexId(51), "shared note", 1000);
      wsInstances[0].fireEvent(same);
      wsInstances[1].fireEvent(same); // 同 id（別 relay の重複）
      wsInstances[0].fireEose();
      wsInstances[1].fireEose(); // 2件目で settledCount==2==expected → finish()
      await flush();

      const n = notes();
      expect(n.length).toBe(1); // dedupe で1件のみ・二重描画なし
      expect(n[0].querySelector(".mypace-note-body").textContent).toBe("shared note");
    });
  });

  describe("10. EOSE 後の遅延 EVENT 無視", () => {
    it("render 後に来た onmessage EVENT は再描画しない（ノート数が増えない）", async () => {
      await setupAndImport(feedMarkup());
      wsInstances.forEach((ws) => ws.fireOpen());
      wsInstances[0].fireEvent(ev(hexId(61), "first", 100));
      wsInstances.forEach((ws) => ws.fireEose()); // ここで描画（1件）
      await flush();
      expect(notes().length).toBe(1);
      const firstBody = notes()[0].querySelector(".mypace-note-body").textContent;

      // 描画後に遅延 EVENT が来ても再描画しない。
      expect(() => {
        wsInstances[0].fireEvent(ev(hexId(62), "late", 999));
      }).not.toThrow();
      await flush();

      expect(notes().length).toBe(1); // 増えない
      expect(notes()[0].querySelector(".mypace-note-body").textContent).toBe(firstBody);
    });
  });

  describe("11. タイムアウト経路", () => {
    it("EOSE が来なくても 6000ms 経過で、それまでの EVENT で1回描画する", async () => {
      vi.useFakeTimers();
      await setupAndImport(feedMarkup());
      wsInstances.forEach((ws) => ws.fireOpen());
      wsInstances[0].fireEvent(ev(hexId(71), "timeout note", 100));
      // EOSE を送らない → settledCount 未達。タイマー（6000ms）で finish。
      expect(notes().length).toBe(0); // まだ描画されない
      vi.advanceTimersByTime(6000);

      expect(notes().length).toBe(1);
      expect(notes()[0].querySelector(".mypace-note-body").textContent).toBe("timeout note");
    });

    it("タイムアウトと EOSE のレース（EOSE 全達後にタイマーを進めても）二重描画しない", async () => {
      vi.useFakeTimers();
      await setupAndImport(feedMarkup());
      wsInstances.forEach((ws) => ws.fireOpen());
      wsInstances[0].fireEvent(ev(hexId(72), "race note", 100));
      // 先に全 EOSE → finish（done=true・clearTimeout）。
      wsInstances.forEach((ws) => ws.fireEose());
      expect(notes().length).toBe(1);
      // その後タイマーを進めても finish は done ガードで再実行されない。
      vi.advanceTimersByTime(6000);
      expect(notes().length).toBe(1); // 二重描画なし
    });

    it("タイムアウト時に 0件なら描画せずプレースホルダ維持", async () => {
      vi.useFakeTimers();
      await setupAndImport(feedMarkup());
      wsInstances.forEach((ws) => ws.fireOpen());
      // イベントも EOSE も来ない。
      vi.advanceTimersByTime(6000);
      expect(notes().length).toBe(0);
      expect(lines().length).toBe(3);
    });
  });

  describe("12. PE: pubkey 不正 / relays 空 / 不正 JSON / WebSocket 非対応", () => {
    it("pubkey が 64桁hex でない → WebSocket を作らず据え置き・例外なし", async () => {
      await expect(setupAndImport(feedMarkup({ pubkey: "not-a-valid-pubkey" }))).resolves.not.toThrow();
      expect(wsInstances.length).toBe(0);
      expect(notes().length).toBe(0);
      expect(lines().length).toBe(3);
    });

    it("data-mypace-pubkey 属性が無い → WebSocket を作らない", async () => {
      await expect(setupAndImport(feedMarkup({ pubkey: null }))).resolves.not.toThrow();
      // .mypace-feed[data-mypace-pubkey] セレクタにマッチしない＝早期 return。
      expect(wsInstances.length).toBe(0);
    });

    it("relays が空配列 → WebSocket を作らない・据え置き", async () => {
      await expect(setupAndImport(feedMarkup({ relays: "[]" }))).resolves.not.toThrow();
      expect(wsInstances.length).toBe(0);
      expect(lines().length).toBe(3);
    });

    it("relays が不正 JSON → WebSocket を作らない・例外なし", async () => {
      await expect(setupAndImport(feedMarkup({ relays: "[not json" }))).resolves.not.toThrow();
      expect(wsInstances.length).toBe(0);
      expect(lines().length).toBe(3);
    });

    it("WebSocket 非対応（typeof WebSocket !== 'function'）→ 接続を作らず据え置き", async () => {
      // WebSocket を未定義に差し替える。
      document.body.innerHTML = feedMarkup();
      vi.stubGlobal("WebSocket", undefined);
      vi.resetModules();
      await expect(import(MODULE_PATH)).resolves.not.toThrow();
      await flush();
      expect(notes().length).toBe(0);
      expect(lines().length).toBe(3);
    });
  });

  describe("13. console を汚さない", () => {
    it("正常描画でも error 系でも console.error / console.warn が呼ばれない", async () => {
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await setupAndImport(feedMarkup());
      wsInstances.forEach((ws) => ws.fireOpen());
      wsInstances[0].fireEvent(ev(hexId(81), "ok", 100));
      // 一部 error・一部 EOSE の混在でも無言。
      wsInstances[0].fireEose();
      wsInstances[1].fireError();
      wsInstances[2].fireClose();
      await flush();

      expect(errSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
