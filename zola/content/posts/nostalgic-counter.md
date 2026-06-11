+++
title = "Lighting up a visit counter and a guestbook with Nostalgic"
date = 2026-06-11

[extra]
tags = ["nostalgic", "web", "self-hosting"]
+++

The old web had hit counters and guestbooks. A little odometer at the bottom of the page that ticked up; a board where strangers left a line. They were warm in a way modern analytics never are — not surveillance, just a sign that someone was here.

I missed them, so I built **Nostalgic**: a small self-hosted service that brings them back. No third-party tracking, no cookies pulled from an ad network. Just a counter and a board I own.

### On this site

Look at the top strip — that's the visit count, served from Nostalgic and split into total / today / yesterday / week / month. The **bbs** panel further down is a real guestbook; leave a line if you'd like. And **mypace** pulls my latest notes straight from Nostr and draws them in the same black-and-green, in-theme — no embedded widget, no iframe.

### Why self-host

Three reasons:

1. **It's mine.** The data lives on my own deployment, not someone's dashboard.
2. **No tax on the visitor.** No ad scripts, no consent banner, nothing loaded to watch you.
3. **It's honest.** A counter says "people come here" without pretending to know who you are.

> The point was never the number. It was the feeling that a page is a place, and places remember the people who pass through.

Bringing these back wasn't nostalgia for its own sake. It was a quiet argument about what a personal site is _for_.
