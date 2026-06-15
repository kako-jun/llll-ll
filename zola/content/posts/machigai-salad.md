+++
title = "How to use Machigai Salad"
date = 2026-06-15

[taxonomies]
tags = ["machigai-salad", "about"]

[extra]
tags = ["machigai-salad", "about"]
+++

**Machigai Salad** is a tool that helps you solve spot-the-difference puzzles — like the famous one on the Saizeriya menu — semi-automatically, just for fun. No sign-up, and it runs entirely in your browser.

- App: <https://machigai-salad.llll-ll.com>
- GitHub: <https://github.com/kako-jun/machigai-salad>

When you overlay two pictures and flip back and forth between them, only the spots that differ appear to wiggle. This is a real technique called **blink comparison**; it's the same method used to discover Pluto (Tombaugh, 1930).

## The basics

First, take a photo of the puzzle with your phone. Straight-on is best, but a slight angle is fine as long as the whole thing fits in frame.

The app detects the four corners of the sheet, and on the next step it automatically splits the image into left and right halves.

On the comparison screen the left image is shown, and **it switches to the right image only while you hold your finger down**. The differences are the only things that wiggle, so just look for those.

## Using a photo you already took

Instead of "Take a photo", tap **"Pick from album"** to feed in any picture already in your phone's gallery.

## Large or curved sheets

If the puzzle is big, it may not fit in the frame, or lens distortion at the edges can keep it from forming a clean rectangle. You may also want to photograph a puzzle from a book without bending the spine.

For those cases, use **two-image mode**: shoot the left picture and the right picture separately. This even handles puzzles laid out vertically.

## When corner detection fails

If the contrast between the paper and the table is low, or shadows and wood grain get in the way, automatic corner detection can struggle.

Try switching the detection sensitivity between **strict / normal / loose**. If it still won't line up, you can **drag each of the four corners by hand**.

## When the overlay is misaligned

If there's a divider (a gap) between the left and right pictures, splitting straight down the middle will shift the center. After overlaying, you can **slide with your finger to fine-tune**.

If the paper is warped and bulges in the middle, a mesh warp anchored at the center absorbs the distortion.

## Saving for later

You can **save** a puzzle once you've finished aligning it, and bring it back any time — handy for taking another slow look after you get home from Saizeriya.

## Making it even harder

You can generate a video that morphs slowly from the left image to the right over 30 seconds — the kind that makes you go "Wait, is it changing? Is it *really* changing?" We call it the **"did you notice?" video**.

The wiggle view gives the answer away instantly, so it's not great for sharing. But this one makes the puzzle *harder*, so go ahead and challenge your friends with it.

## Privacy and installing

All processing — including the photos you take — happens entirely in your browser. Nothing is sent anywhere, so nothing can leak.

Install it as a PWA and a little shrimp icon appears on your home screen, ready to launch — no need to search for it every time you arrive at Saizeriya.

There's also a QR code on the home screen. If you spot someone losing their mind over a spot-the-difference puzzle, show it to them. The app is available in English too.
