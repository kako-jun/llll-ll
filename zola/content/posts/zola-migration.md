+++
title = "Moving llll-ll from Next.js to Zola"
date = 2026-06-09

[extra]
tags = ["zola", "btop", "meta"]
+++

For a long time this portfolio ran on Next.js. It worked, but every visit shipped a React runtime to render a page that never really changes. For a portfolio — a list of things I made — that felt heavier than it needed to be.

So I moved it to **Zola**, a static site generator written in Rust. One binary, no `node_modules`, a full build in well under a second. The pages it produces are plain HTML and CSS; JavaScript only shows up where it earns its place — the app filter, the visit counter, the daily picture.

### Dogfooding my own theme

The base palette comes from **avel**, the Zola theme I wrote. llll-ll doesn't inherit avel's templates directly — the portal is a bespoke btop-style layout — but the black-and-green aesthetic and the build pipeline are shared. Building my own site on my own theme is the fastest way to find avel's rough edges.

### What stayed the same

- One page. No route changes to browse the apps.
- Mobile first, centered on desktop.
- Four languages (en / ja / zh / es), each as a first-class URL.

The migration happened in phases: scaffold, i18n, the interactive panels, then this — the blog. Posts like this one are the last piece: a place to write down what I'm building while I build it.

> If a static binary can do the job, I'd rather ship the static binary.
