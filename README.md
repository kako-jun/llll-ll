# llll-ll

Personal portfolio for [kako-jun](https://github.com/kako-jun), a games and apps developer based in Kanazawa, Japan. Lives at [llll-ll.com](https://llll-ll.com).

## Features

- **Multi-language**: English, Chinese, Japanese, and Spanish — automatic detection on first visit, persisted across sessions
- **Light / dark theme**: detects `prefers-color-scheme`, overridable via the header toggle
- **Interactive header**: the sticky header is also a tiny Tetris-style mini-game (tap to drop, click to remove, lines clear automatically)
- **Mobile-first**: 800 px max container, responsive at every breakpoint
- **JSON-driven content**: products are loaded at runtime from `public/data/products.json`

## Tech Stack

- Vite + React 19 + TypeScript
- react-router-dom v7 for the small route table (`/`, `/welcome`, `/easter-egg`)
- Vanilla CSS with CSS custom properties for theming
- Vitest for unit tests (pure-logic only)
- nostr-tools for the Nostr posts popup

## Getting Started

```bash
npm install
npm run dev          # http://localhost:5173
```

## Scripts

| Script              | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Vite dev server with HMR                  |
| `npm run build`     | `tsc && vite build` (type-check + bundle) |
| `npm run preview`   | Serve `dist/` locally                     |
| `npm run lint`      | ESLint over `src/`                        |
| `npm run typecheck` | `tsc --noEmit`                            |
| `npm test`          | Run the vitest suite once                 |
| `npm run format`    | Prettier write                            |

## Adding a Product

Products are loaded from `public/data/products.json`. Each entry follows the `Product` interface in `src/types/index.ts`:

- `title` and `description` are objects keyed by language (`en`, `ja`, `zh`, `es`)
- `images`, `animations`, and `videos` are paths relative to `public/`
- `tags` are free-form strings used both for display and search

Drop any new media files into `public/images/` (or `public/animations/`, `public/videos/`) and reference them with their `/`-prefixed path.

## Project Structure

See [`CLAUDE.md`](./CLAUDE.md) for a full directory tour; [`DESIGN.md`](./DESIGN.md) for the design system that any UI change must conform to.

```
src/
├── App.tsx, main.tsx
├── pages/        # Welcome (language picker), NotFound
├── components/   # common, game, layout, nostr, project
├── hooks/        # useTetrisGame, useTheme, useLanguage, ...
├── lib/          # tetris (pure logic), i18n, storage
├── constants/    # ids, sizes, durations
├── styles/       # globals.css (CSS variables, base styles)
└── types/        # Product, Language, web-components ambient types
```

## Deployment

Built as a static SPA. Deployed via Vercel with the custom domain `llll-ll.com`.

```bash
npm run build       # outputs to dist/
```

## License

© kako-jun. All rights reserved.
