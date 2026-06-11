// mypace-feed.js — llll-ll ポータルの「mypace 最新つぶやき」の島（vanilla JS・依存ゼロ）。
//
// 設計（Issue #8 第3分割・案C＝自前 in-theme レンダリング。session621 決定）:
//   - mypace（kako-jun の Nostr クライアント）の最新ノートを Nostr relay から WebSocket で取り、
//     btop 黒×緑で「自前描画」する。公式 iframe 埋め込みは theme=light で世界観を壊すため不採用。
//   - 依存ゼロ（nostr-tools は使わない＝静的 JS でバンドル不可）。pubkey は hex を直に使う（bech32 デコード不要）。
//   - JS が読めない / 無効 / 全 relay 失敗 / 0件 でも、サーバ側のプレースホルダ（mypace_placeholder）が
//     見えたまま壊れない（PE）。例外を投げず、console を汚さない。1件でも取れたら描画、0件なら据え置き。
//
// 仕様:
//   - .mypace-feed[data-mypace-pubkey] から pubkey/relays(JSON)/url/limit/more を読む。要素・pubkey 欠落なら何もしない。
//   - 各 relay に WebSocket 接続し ["REQ", subId, {authors:[pubkey], kinds:[1], limit}] を送る。
//   - 受信 ["EVENT", subId, ev] を集め、["EOSE", subId] or タイムアウトで全 socket を close。
//   - pickLatestNotes() で id dedupe → created_at 降順 → 先頭 limit 件に整形し、textContent で安全描画する。
//   - 描画は1回だけ（複数 relay の EOSE × タイムアウトのレースで二重描画しない）。
//
// 純粋関数（DOM 非依存・テスト可能）:
//   - pickLatestNotes(events, limit): id dedupe → created_at 降順 → 先頭 limit 件。
//   - relativeTime(sec, nowSec): "3h" / "2d" など簡潔・ロケール非依存の相対時刻。
//   - parseRelayMessage(raw, subId): 生文字列 → {type:"EVENT",event} | {type:"EOSE"} | null（不正は null・throw しない）。

var MYPACE_SUB_ID = "llll-ll-mypace"; // REQ の購読 ID（固定で可。ランダム不要）。
var MYPACE_TIMEOUT_MS = 6000; // 全 socket を待つ上限。

/**
 * Nostr イベント配列を整形する純粋関数。DOM 非依存。
 *   - kind1 のテキストノートを id で dedupe（複数 relay が同じノートを返すため）。
 *   - created_at（秒）降順でソート。
 *   - 先頭 limit 件に切り詰め。
 *
 * @param {Array<object>} events - Nostr イベント（{id, created_at, content, ...}）の配列。
 * @param {number} limit - 返す最大件数。0 以下なら空配列。
 * @returns {Array<object>} 整形済みノート配列（最大 limit 件）。
 */
function pickLatestNotes(events, limit) {
  if (!Array.isArray(events) || typeof limit !== "number" || limit <= 0) return [];
  var seen = {};
  var uniq = [];
  for (var i = 0; i < events.length; i++) {
    var ev = events[i];
    // id を持つオブジェクトのみ採用。id 重複は最初の1件だけ残す。
    if (!ev || typeof ev.id !== "string" || ev.id === "") continue;
    if (seen[ev.id]) continue;
    seen[ev.id] = true;
    uniq.push(ev);
  }
  // created_at 降順（数値でない created_at は 0 扱いで末尾へ）。
  uniq.sort(function (a, b) {
    var ca = typeof a.created_at === "number" ? a.created_at : 0;
    var cb = typeof b.created_at === "number" ? b.created_at : 0;
    return cb - ca;
  });
  return uniq.slice(0, limit);
}

/**
 * Unix 秒の相対時刻を簡潔・ロケール非依存の文字列で返す純粋関数。DOM 非依存。
 *   "now" / "<n>s" / "<n>m" / "<n>h" / "<n>d"。未来時刻・負の差は "now"。
 *
 * @param {number} sec - 対象時刻（Unix 秒）。
 * @param {number} nowSec - 現在時刻（Unix 秒）。
 * @returns {string} 相対時刻文字列。引数が数値でなければ "" を返す（throw しない）。
 */
function relativeTime(sec, nowSec) {
  if (typeof sec !== "number" || typeof nowSec !== "number" || !isFinite(sec) || !isFinite(nowSec)) {
    return "";
  }
  var diff = Math.floor(nowSec - sec);
  if (diff <= 0) return "now"; // 未来・同時刻・0 は "now"。
  if (diff < 60) return diff + "s";
  var mins = Math.floor(diff / 60);
  if (mins < 60) return mins + "m";
  var hours = Math.floor(diff / 3600);
  if (hours < 24) return hours + "h";
  var days = Math.floor(diff / 86400);
  return days + "d";
}

/**
 * relay からの生メッセージ文字列を解釈する純粋関数。DOM 非依存・throw しない。
 *   - ["EVENT", subId, event] かつ subId 一致 → {type:"EVENT", event}
 *   - ["EOSE", subId] かつ subId 一致 → {type:"EOSE"}
 *   - 別 subId・別 type・配列でない・不正 JSON → null
 *
 * @param {string} raw - WebSocket message の生文字列。
 * @param {string} subId - 自分が送った購読 ID。
 * @returns {{type:"EVENT", event:object}|{type:"EOSE"}|null}
 */
function parseRelayMessage(raw, subId) {
  if (typeof raw !== "string") return null;
  var msg;
  try {
    msg = JSON.parse(raw);
  } catch (e) {
    return null; // 不正 JSON は null（throw しない）。
  }
  if (!Array.isArray(msg) || msg.length < 2) return null;
  var type = msg[0];
  if (msg[1] !== subId) return null; // 別購読は無視。
  if (type === "EVENT") {
    var ev = msg[2];
    if (!ev || typeof ev !== "object") return null;
    return { type: "EVENT", event: ev };
  }
  if (type === "EOSE") {
    return { type: "EOSE" };
  }
  return null; // NOTICE / OK / CLOSED など他 type は無視。
}

// テスト用に export（ブラウザでは module ではないので typeof ガード）。
if (typeof module !== "undefined" && module.exports) {
  module.exports = { pickLatestNotes, relativeTime, parseRelayMessage };
}

(function () {
  // テスト時（module 環境）は DOM 配線を走らせない。
  if (typeof document === "undefined") return;

  var feed = document.querySelector(".mypace-feed[data-mypace-pubkey]");
  if (!feed) return; // PE: 要素が無ければ何もしない。

  var pubkey = (feed.getAttribute("data-mypace-pubkey") || "").trim();
  // hex pubkey は 64 桁の 16 進数。形式不正なら relay に投げず据え置き（PE）。
  if (!/^[0-9a-fA-F]{64}$/.test(pubkey)) return;

  var relays;
  try {
    relays = JSON.parse(feed.getAttribute("data-mypace-relays") || "[]");
  } catch (e) {
    return; // relays が不正 JSON なら据え置き（PE）。
  }
  if (!Array.isArray(relays) || relays.length === 0) return;

  var userUrl = (feed.getAttribute("data-mypace-url") || "").trim();
  var postBase = (feed.getAttribute("data-mypace-post-base") || "").trim();
  var moreLabel = feed.getAttribute("data-mypace-more") || "";
  var limit = parseInt(feed.getAttribute("data-mypace-limit") || "3", 10);
  if (!isFinite(limit) || limit <= 0) limit = 3;

  // WebSocket 非対応環境（PE）。
  if (typeof WebSocket !== "function") return;

  var events = []; // 全 relay から集めたイベント。
  var sockets = []; // 開いた WebSocket。
  var settledCount = 0; // EOSE / error / close で「片付いた」relay 数。
  var rendered = false; // 二重描画防止フラグ。
  var done = false; // finish() を一度だけ走らせるためのフラグ。
  var timer = null;

  // 全 socket を閉じる（error/close は握りつぶす）。
  function closeAll() {
    for (var i = 0; i < sockets.length; i++) {
      try {
        sockets[i].close();
      } catch (e) {
        /* 握りつぶす（PE） */
      }
    }
  }

  // 集計を確定し、取れていれば1回だけ描画する。タイムアウトと EOSE のレースに対し冪等。
  function finish() {
    if (done) return;
    done = true;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    closeAll();
    render();
  }

  // .mypace-feed のプレースホルダを実つぶやきで置換する。0件なら据え置き（PE）。描画は1回だけ。
  function render() {
    if (rendered) return;
    try {
      var notes = pickLatestNotes(events, limit);
      if (notes.length === 0) return; // 0件はプレースホルダ維持。
      rendered = true;

      var nowSec = Math.floor(Date.now() / 1000);
      var frag = document.createDocumentFragment();

      for (var i = 0; i < notes.length; i++) {
        var note = notes[i];
        // 各つぶやきは「その投稿の mypace ページ」へのリンク（案2）。
        // postBase があり id が 64 桁 hex のときだけ <a>、そうでなければ非リンクの <div>（PE）。
        var noteEl;
        if (postBase && typeof note.id === "string" && /^[0-9a-f]{64}$/i.test(note.id)) {
          noteEl = document.createElement("a");
          noteEl.href = postBase + note.id;
          noteEl.target = "_blank";
          noteEl.rel = "noopener noreferrer";
        } else {
          noteEl = document.createElement("div");
        }
        noteEl.className = "mypace-note";

        var bodyEl = document.createElement("div");
        bodyEl.className = "mypace-note-body";
        // 本文は必ず textContent（innerHTML 禁止＝XSS/世界観防止）。
        bodyEl.textContent = typeof note.content === "string" ? note.content : "";
        noteEl.appendChild(bodyEl);

        var rel = typeof note.created_at === "number" ? relativeTime(note.created_at, nowSec) : "";
        if (rel) {
          var timeEl = document.createElement("div");
          timeEl.className = "mypace-note-time";
          timeEl.textContent = rel;
          noteEl.appendChild(timeEl);
        }
        frag.appendChild(noteEl);
      }

      // 「mypace で続きを見る」リンク（URL があるときだけ）。
      if (userUrl && moreLabel) {
        var more = document.createElement("a");
        more.className = "mypace-more";
        more.href = userUrl;
        more.target = "_blank";
        more.rel = "noopener noreferrer";
        more.textContent = moreLabel;
        frag.appendChild(more);
      }

      // プレースホルダを一掃してから差し込む。
      feed.textContent = "";
      feed.appendChild(frag);
    } catch (e) {
      // どこかで失敗してもプレースホルダを残す（部分描画したならそのまま）。console を汚さない。
    }
  }

  // 全 relay が「片付いた」ら finish()。1つの relay は EOSE / error / close のどれが来ても1回だけ settle。
  // expected は接続を試みた relay 数。settle が expected に達したら全 relay 処理済み。
  function maybeFinishAll() {
    if (settledCount >= expected && !done) finish();
  }

  // タイムアウト: 上限を超えたら今ある分で描画して終了（EOSE 未達 relay の取りこぼし対策）。
  timer = setTimeout(finish, MYPACE_TIMEOUT_MS);

  var req = JSON.stringify(["REQ", MYPACE_SUB_ID, { authors: [pubkey], kinds: [1], limit: limit }]);

  // 1つの relay につき settle() を1回だけ走らせるためのファクトリ（EOSE と close/error の二重カウントを防ぐ）。
  function makeSettle() {
    var fired = false;
    return function () {
      if (fired) return;
      fired = true;
      settledCount++;
      maybeFinishAll();
    };
  }

  // 接続を試みる relay 数を先に確定（ループ中に sockets.length と比較するレースを避ける）。
  var expected = relays.length;

  for (var r = 0; r < relays.length; r++) {
    var url = relays[r];
    var settle = makeSettle();

    if (typeof url !== "string" || url === "") {
      settle(); // 不正 relay は即「片付いた」扱い（PE）。
      continue;
    }

    var ws;
    try {
      ws = new WebSocket(url);
    } catch (e) {
      settle(); // 接続生成失敗も「片付いた」扱い（PE）。
      continue;
    }
    sockets.push(ws);

    // クロージャで socket と settle を束ねる（var ループ変数の取り違えを防ぐ）。
    (function (sock, settleOne) {
      sock.onopen = function () {
        try {
          sock.send(req);
        } catch (e) {
          /* 送信失敗は握りつぶす（PE） */
        }
      };
      sock.onmessage = function (ev) {
        try {
          var parsed = parseRelayMessage(ev && ev.data, MYPACE_SUB_ID);
          if (!parsed) return;
          if (parsed.type === "EVENT") {
            events.push(parsed.event);
          } else if (parsed.type === "EOSE") {
            settleOne();
          }
        } catch (e) {
          /* 握りつぶす（PE） */
        }
      };
      sock.onerror = function () {
        settleOne();
      };
      sock.onclose = function () {
        settleOne();
      };
    })(ws, settle);
  }
})();
