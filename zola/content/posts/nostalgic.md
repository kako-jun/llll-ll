+++
title = "About this site's counter and comment boards (Nostalgic)"
date = 2026-06-13

[taxonomies]
tags = ["nostalgic", "about"]

[extra]
tags = ["nostalgic", "about"]
+++

The visit counter at the top of this site (the "visits" bar) and the comment box under each blog post are both powered by **Nostalgic**.

## What Nostalgic is

Nostalgic is a **free service that brings old-school hit counters, likes, rankings and guestbooks (BBS) to static sites that have no backend of their own**. kako-jun built it. Each counter or board is identified by a "URL + token" pair, and you add it to a page with a small snippet.

- Home / docs: <https://nostalgic.llll-ll.com/>

## Why this site uses it

llll-ll is a static site built with [Zola](https://www.getzola.org/); it has no database or server of its own. To still show "how many people have visited" and let visitors "leave a short comment," it uses Nostalgic.

- **Visit counter**: the Total / Today / Yesterday / Week / Month figures in the visits bar are real counts returned by a Nostalgic visit counter.
- **Comments**: the comment box under each article is a Nostalgic BBS. Comments are returned as an image, so they're readable even with JavaScript turned off.

## On your own site

You can add the same thing to your own static site or blog — no server, no database required. If you're curious, take a look at <https://nostalgic.llll-ll.com/>.
