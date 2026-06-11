import { describe, it, expect } from "vitest";
import { pickLatestNotes, relativeTime, parseRelayMessage } from "../static/js/mypace-feed.js";

// mypace-feed.js の純粋関数（DOM 非依存）。WebSocket 配線は後続のサブエージェントが jsdom + mock で見る。
//   - pickLatestNotes: id dedupe → created_at 降順 → 先頭 limit 件。
//   - relativeTime: 秒/分/時/日の境界、未来時刻、0、ロケール非依存の簡潔表記。
//   - parseRelayMessage: 正常 EVENT / EOSE / 別 subId は無視 / 不正 JSON は null / 配列でない入力は null。

const SUB = "llll-ll-mypace";

describe("pickLatestNotes", () => {
  it("空配列は空配列", () => {
    expect(pickLatestNotes([], 3)).toEqual([]);
  });

  it("limit=0 は空配列（描画しない）", () => {
    const evs = [{ id: "a", created_at: 100 }];
    expect(pickLatestNotes(evs, 0)).toEqual([]);
  });

  it("limit が負・非数値なら空配列", () => {
    const evs = [{ id: "a", created_at: 100 }];
    expect(pickLatestNotes(evs, -1)).toEqual([]);
    // @ts-expect-error 非数値
    expect(pickLatestNotes(evs, "3")).toEqual([]);
  });

  it("配列でない入力は空配列", () => {
    expect(pickLatestNotes(null, 3)).toEqual([]);
    expect(pickLatestNotes(undefined, 3)).toEqual([]);
    expect(pickLatestNotes({}, 3)).toEqual([]);
  });

  it("created_at 降順に並べ替える", () => {
    const evs = [
      { id: "a", created_at: 100 },
      { id: "b", created_at: 300 },
      { id: "c", created_at: 200 },
    ];
    expect(pickLatestNotes(evs, 3).map((e) => e.id)).toEqual(["b", "c", "a"]);
  });

  it("同 id を dedupe（複数 relay の重複）", () => {
    const evs = [
      { id: "dup", created_at: 100 },
      { id: "dup", created_at: 100 },
      { id: "other", created_at: 200 },
    ];
    const out = pickLatestNotes(evs, 5);
    expect(out.map((e) => e.id)).toEqual(["other", "dup"]);
    expect(out.length).toBe(2);
  });

  it("limit 超過は先頭 limit 件に切り詰める", () => {
    const evs = [
      { id: "a", created_at: 500 },
      { id: "b", created_at: 400 },
      { id: "c", created_at: 300 },
      { id: "d", created_at: 200 },
      { id: "e", created_at: 100 },
    ];
    expect(pickLatestNotes(evs, 3).map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("id を持たないイベントは除外する", () => {
    const evs = [
      { created_at: 999 }, // id 無し
      { id: "", created_at: 998 }, // 空 id
      { id: "ok", created_at: 100 },
    ];
    expect(pickLatestNotes(evs, 5).map((e) => e.id)).toEqual(["ok"]);
  });

  it("件数が limit 未満ならそのまま全件", () => {
    const evs = [
      { id: "a", created_at: 200 },
      { id: "b", created_at: 100 },
    ];
    expect(pickLatestNotes(evs, 3).length).toBe(2);
  });
});

describe("relativeTime", () => {
  it("同時刻・0 は now", () => {
    expect(relativeTime(1000, 1000)).toBe("now");
  });

  it("未来時刻（負の差）は now", () => {
    expect(relativeTime(2000, 1000)).toBe("now");
  });

  it("60秒未満は秒（s）", () => {
    expect(relativeTime(1000, 1000 + 1)).toBe("1s");
    expect(relativeTime(1000, 1000 + 59)).toBe("59s");
  });

  it("ちょうど60秒は1分（m）", () => {
    expect(relativeTime(0, 60)).toBe("1m");
  });

  it("60分未満は分（m）", () => {
    expect(relativeTime(0, 59 * 60)).toBe("59m");
  });

  it("ちょうど60分は1時間（h）", () => {
    expect(relativeTime(0, 3600)).toBe("1h");
  });

  it("24時間未満は時（h）", () => {
    expect(relativeTime(0, 23 * 3600)).toBe("23h");
  });

  it("ちょうど24時間は1日（d）", () => {
    expect(relativeTime(0, 86400)).toBe("1d");
  });

  it("複数日（d）", () => {
    expect(relativeTime(0, 3 * 86400 + 500)).toBe("3d");
  });

  it("引数が非数値・非有限なら空文字（throw しない）", () => {
    // @ts-expect-error 非数値
    expect(relativeTime("x", 1000)).toBe("");
    // @ts-expect-error 非数値
    expect(relativeTime(1000, null)).toBe("");
    expect(relativeTime(Infinity, 1000)).toBe("");
    expect(relativeTime(1000, NaN)).toBe("");
  });
});

describe("parseRelayMessage", () => {
  it("正常 EVENT（subId 一致）→ {type:'EVENT', event}", () => {
    const ev = { id: "x", created_at: 1, content: "hi" };
    const raw = JSON.stringify(["EVENT", SUB, ev]);
    expect(parseRelayMessage(raw, SUB)).toEqual({ type: "EVENT", event: ev });
  });

  it("正常 EOSE（subId 一致）→ {type:'EOSE'}", () => {
    const raw = JSON.stringify(["EOSE", SUB]);
    expect(parseRelayMessage(raw, SUB)).toEqual({ type: "EOSE" });
  });

  it("別 subId の EVENT は無視（null）", () => {
    const raw = JSON.stringify(["EVENT", "other-sub", { id: "x" }]);
    expect(parseRelayMessage(raw, SUB)).toBeNull();
  });

  it("別 subId の EOSE は無視（null）", () => {
    const raw = JSON.stringify(["EOSE", "other-sub"]);
    expect(parseRelayMessage(raw, SUB)).toBeNull();
  });

  it("EVENT だが event がオブジェクトでない → null", () => {
    expect(parseRelayMessage(JSON.stringify(["EVENT", SUB, "not-obj"]), SUB)).toBeNull();
    expect(parseRelayMessage(JSON.stringify(["EVENT", SUB, null]), SUB)).toBeNull();
    expect(parseRelayMessage(JSON.stringify(["EVENT", SUB]), SUB)).toBeNull();
  });

  it("他 type（NOTICE / OK / CLOSED）は null", () => {
    expect(parseRelayMessage(JSON.stringify(["NOTICE", SUB, "msg"]), SUB)).toBeNull();
    expect(parseRelayMessage(JSON.stringify(["OK", SUB, true]), SUB)).toBeNull();
  });

  it("不正 JSON は null（throw しない）", () => {
    expect(parseRelayMessage("{not json", SUB)).toBeNull();
    expect(parseRelayMessage("", SUB)).toBeNull();
  });

  it("配列でない JSON は null", () => {
    expect(parseRelayMessage(JSON.stringify({ type: "EVENT" }), SUB)).toBeNull();
    expect(parseRelayMessage(JSON.stringify("string"), SUB)).toBeNull();
    expect(parseRelayMessage(JSON.stringify(42), SUB)).toBeNull();
  });

  it("要素数が足りない配列は null", () => {
    expect(parseRelayMessage(JSON.stringify(["EVENT"]), SUB)).toBeNull();
    expect(parseRelayMessage(JSON.stringify([]), SUB)).toBeNull();
  });

  it("文字列でない入力は null", () => {
    // @ts-expect-error 非文字列
    expect(parseRelayMessage(null, SUB)).toBeNull();
    // @ts-expect-error 非文字列
    expect(parseRelayMessage(["EOSE", SUB], SUB)).toBeNull();
  });
});
