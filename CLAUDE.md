# llll-ll — Project Context for Claude

## Project

**llll-ll** is kako-jun's personal portfolio for games and apps. The site lives at `llll-ll.com` and showcases all of his releases through a single, sticky-headered SPA. The header doubles as a tiny interactive Tetris-style toy.

## Quick Start

```bash
npm install
npm run dev         # vite dev server (default port 5173)
npm run build       # tsc && vite build
npm run preview     # vite preview (serve built dist/)
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # vitest run
```

## Tech Stack

- **Vite + React 19 + TypeScript** (SPA, no SSR)
- **react-router-dom v7** for routing (`/`, `/welcome`, `/easter-egg`, `*` → NotFound)
- **CSS3 variables** (defined in `src/styles/globals.css`) with light / dark theme
- **JSON data** at `public/data/products.json` (fetched at runtime, not bundled)
- **Vitest** for unit tests; the test suite lives next to the file under test (`*.test.ts`)
- **nostr-tools** for the Nostr posts popup; **react-router-dom** for routing

## Documentation

- `DESIGN.md` — design system (colors, typography, components, z-index). UI changes must conform.
- `README.md` — high-level project overview for visitors.

UIの生成・修正時は `DESIGN.md` に定義されたデザインシステムに従うこと。定義外の色・フォント・スペーシングを勝手に使わない。

## Source Layout

```
src/
├── App.tsx              # Router + HomePage (handles welcome redirect, fetches products)
├── main.tsx             # ReactDOM bootstrap
├── styles/globals.css   # CSS variables, theme tokens, base styles
├── pages/
│   ├── Welcome.tsx      # First-visit language selection screen at /welcome
│   └── NotFound.tsx     # 404 + Easter-egg game (1-16 sequence click)
├── components/
│   ├── common/          # AboutPopup, ArrowIcon, ImageDisplay, IntroSection,
│   │                    # PopupTriangle, ScrollToTop, VisitorCounter
│   ├── game/            # BackgroundDots, TetrisBlock(Grid|FallingBlocks)
│   ├── layout/          # Header, Footer, LanguageBar, LanguageButtons,
│   │                    # ContinueButton, ProfileIcon, QRCodeSection,
│   │                    # SocialLinks, ThemeToggle, WelcomeScreen
│   ├── nostr/           # NostrPopup
│   └── project/         # ProjectList, ProjectCard, ProjectModal, plus
│                        # search / filter / sort / media-grid building blocks
├── hooks/
│   ├── useTetrisGame.ts # Thin wrapper around src/lib/tetris.ts that owns
│   │                    # React state, animation interval, click handling
│   ├── useTheme.ts      # Light/dark with localStorage + matchMedia fallback
│   ├── useLanguage.ts   # Selected language with localStorage + navigator fallback
│   ├── useElementRect.ts, useInfiniteScroll.ts, useUrlHash.ts
├── lib/
│   ├── tetris.ts        # Pure grid logic (placement, line-clears, cascade)
│   ├── i18n.ts          # translations object + useTranslation
│   └── storage.ts       # Single-key JSON-based localStorage wrapper
├── constants/index.ts   # Header id, image sizes, scroll thresholds, animation durations
└── types/
    ├── index.ts         # Language, Product, Article
    └── web-components.d.ts  # nostalgic-counter / nostalgic-bbs JSX type augmentation
```

## Storage Convention

All persisted user data is stored under a **single localStorage key `"llll-ll"`** as a JSON object — see `src/lib/storage.ts`. Use `getStorage` / `setStorage` exclusively; never read or write localStorage directly. Known fields: `visited`, `language`, `theme`.

## Routing

- `/` → `HomePage`. Redirects new visitors (`visited` flag unset) to `/welcome`.
- `/welcome` → `Welcome` (language selection then bounce back to `/`).
- `/easter-egg` → `NotFound` (intentional easter egg).
- `*` → `NotFound`.

## Header Tetris

The header is interactive. Logic lives in:

- `src/lib/tetris.ts` — grid + falling-block pure logic (placement, line clears, cascade, overflow detection). Constants `BLOCK_SIZE = 16`, `GRID_HEIGHT = 4`, `MAX_STACK = 3`. The file's module-level doc comment is the source of truth for the function list and the coordinate system.
- `src/hooks/useTetrisGame.ts` — owns React state and the animation interval. Calls into `tetris.ts` for every state transition.
- `src/components/game/TetrisBlock.tsx` — renders the grid + falling layer + disappearing layer (three layers stacked via z-index).
- `src/components/layout/Header.tsx` — host. Measures header height with a `ref` (no DOM reads in render) and wires up clicks to spawn blocks.

Click anywhere in the header (except the title) to drop a block in that column. Auto-spawn fires once 4 seconds after mount, then every 42 seconds. Click a placed block to remove it (with a 400 ms shrink animation); blocks above it cascade down. A complete row clears with a small delay so the player sees the landing first. Filling more than `MAX_STACK` blocks in any column resets the whole board.

## Testing

Tests sit next to the file under test (`src/lib/tetris.test.ts`, `src/lib/storage.test.ts`, etc.) and run via vitest. Coverage focuses on the pure logic in `src/lib/`; React components are deliberately not under unit test (decorative UI; verify by `npm run dev` and clicking around).

## Conventions

- **Imports**: absolute via the `@/` alias (`vite.config.ts` + `tsconfig.json`). Avoid deep relative paths.
- **Styling**: prefer CSS variables in `globals.css`. Inline `style={{ ... }}` is fine for small one-off layout when no theme tokens apply, but every color / font / spacing token must come from the variables defined in `DESIGN.md`.
- **Strict TypeScript**: `strict`, `noUnusedLocals`, `noUnusedParameters` are all on (see `tsconfig.json`). Don't disable them.
- **Single localStorage key** — see Storage Convention above.
- **コミットメッセージに Co-Authored-By を付けない**（freeza 全体ルール）。
