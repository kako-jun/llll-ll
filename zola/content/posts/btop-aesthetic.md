+++
title = "Building a portfolio with the btop aesthetic"
date = 2026-06-10

[extra]
tags = ["btop", "design", "css"]
+++

If you've run **btop**, the system monitor, you know the look: panels drawn with box-drawing characters, a green border, a label notched into the top-left corner, everything monospaced on a near-black background. I find it genuinely beautiful, and it turns out to be a great frame for a portfolio.

### Why it fits

A portfolio is a dashboard. It shows state: what I've made, how many people visited, today's drawing. btop is _the_ dashboard aesthetic — dense but legible, technical but warm. Borrowing its grammar meant I didn't have to invent a visual language; I just had to be disciplined about it.

The rules I kept:

1. **One palette.** Background `#121212`, panels `#1e1e1e`, the accent green `#34d058` for every border and label.
2. **Notched labels.** Each panel has a little tag — `apps`, `visits`, `mypace`, `blog` — sitting on its top edge, exactly like btop's windows.
3. **Monospace everywhere**, with per-language fallbacks so CJK still renders cleanly.

> Constraint is a feature. With the palette and the panel fixed, every new section already knows what it looks like.

### Famicom plus cyberpunk

The brief I gave myself was "Famicom nostalgia meets cyberpunk." Dark, a little playful, a little retro — a slime that hops, Tetris stacking in the header, a daily pixel drawing. Nothing flashy. Just enough motion to feel alive, never enough to get in the way.

The btop frame holds all of it together. Even this blog post sits inside the same green-bordered panel as everything else.
