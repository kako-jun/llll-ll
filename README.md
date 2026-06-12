# llll-ll

Personal portfolio for [kako-jun](https://github.com/kako-jun), a games and apps developer based in Kanazawa, Japan. Lives at [llll-ll.com](https://llll-ll.com).

A btop-style terminal portal — black-and-green monospace panels — listing kako-jun's games and apps, with a tiny Tetris toy hiding in the header.

## Features

- **Multi-language**: English (root), Japanese, Chinese, and Spanish (`/ja/`, `/zh/`, `/es/`). The English landing page auto-redirects first-time visitors to their browser language and remembers the choice
- **Light / dark theme**: detects `prefers-color-scheme`, overridable via the header toggle
- **Interactive header**: the header panel is also a tiny Tetris-style mini-game (tap to drop, click to remove, lines clear automatically)
- **Living panels**: a Nostalgic visit counter, a Nostalgic support BBS, and the latest Nostr posts from mypace, all rendered in the btop style
- **JSON-driven content**: apps are loaded at build time from `zola/data/products.json`

## Tech Stack

- [Zola](https://www.getzola.org/) static site generator
- Self-contained btop-style templates over the `avel` theme (git submodule)
- Vanilla JS islands for interactivity (no framework, no bundler)
- Vitest + jsdom for unit tests (pure-logic only)

## Getting Started

```bash
git submodule update --init --recursive   # pull the avel theme
cd zola
zola serve                                # http://127.0.0.1:1111
```

## Scripts

| Command            | What it does                                    |
| ------------------ | ----------------------------------------------- |
| `zola serve`       | Local dev server with live reload (run in `zola/`) |
| `npm run zola:build` | Production build — syncs Nostalgic BBS comments, then `zola build` |
| `zola build`       | Static build only (`zola/public/`)              |
| `npm run zola:sync-comments` | Pull latest Nostalgic BBS comments into the posts |
| `npm test`         | Run the vitest suite once (`zola/tests/**/*.test.js`) |
| `npm run test:watch` | Vitest in watch mode                          |
| `npm run coverage` | Vitest with coverage                            |

## Adding a Product

Apps are loaded from `zola/data/products.json` — an array where each entry has:

- `id` — slug used for the per-app URL (`/apps/{id}/`)
- `title` and `description` — objects keyed by language (`en`, `ja`, `zh`, `es`); all four must be present
- `tags` — free-form strings used for display and search
- `images`, `demoUrl`, `repositoryUrl`, `createdAt`, `updatedAt`, `featured`, `icon`

Drop new media into `zola/static/images/` and reference it with its `/`-prefixed path. After editing `products.json`, regenerate the per-app pages:

```bash
cd zola
node scripts/gen-app-pages.mjs   # products.json → content/apps/{id}[.{lang}].md
```

## Project Structure

See [`CLAUDE.md`](./CLAUDE.md) for a directory tour, [`zola/README.md`](./zola/README.md) for the detailed Zola architecture, and [`DESIGN.md`](./DESIGN.md) for the design system that any UI change must conform to.

```
zola/
├── config.toml     # base_url, languages (en default + ja/zh/es), theme, palette/ids
├── content/        # _index.* (home), apps/ (generated), posts/ (blog)
├── data/           # products.json, daily.json
├── templates/      # index, app, post, posts, 404, _seo, _theme
├── static/         # js/ (islands), images, favicon, robots.txt
├── themes/avel/    # submodule
├── tests/          # vitest (jsdom)
└── scripts/        # gen-app-pages.mjs, import-lodestone.mjs
```

## Deployment

Built and served as a static site by **Cloudflare Pages** with the custom domain `llll-ll.com`. The production branch is `main`; a push to `main` triggers an automatic deploy (build `zola build`, root `zola`, output `public`, `ZOLA_VERSION=0.22.1`). There is no in-repo CI.

## License

© kako-jun. All rights reserved.
