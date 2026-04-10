# DESIGN.md

llll-ll portfolio — Design System

## 1. Visual Theme & Atmosphere

Retro-nostalgic meets modern web. Dark mode default with a terminal/CRT aesthetic. Minimalist, 8-bit influenced design with clean lines and monospace branding. Interactive elements (Tetris blocks in header, floating square pixels in background) add playfulness without clutter.

Inspirations: early internet, retro game UIs, CRT terminals, pixel art culture.

## 2. Color Palette & Roles

CSS variables are defined in two naming systems. Use either, but prefer the semantic names.

| Semantic Name         | Alias            | Dark Value                                                | Light Value                                                 | Usage                            |
| --------------------- | ---------------- | --------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------- |
| `--primary-color`     | `--text-accent`  | `#34d058`                                                 | `#218838`                                                   | CTA, project titles, emphasis    |
| `--background-color`  | `--bg-primary`   | `#121212`                                                 | `#ffffff`                                                   | Page background                  |
| `--text-color`        | `--text-primary` | `#ffffff`                                                 | `#000000`                                                   | Body text, headings              |
| `--text-secondary`    | `--muted-text`   | `#b0b0b0`                                                 | `#6c757d`                                                   | Muted text, descriptions         |
| `--input-background`  | `--bg-secondary` | `#1e1e1e`                                                 | `#f8f9fa`                                                   | Cards, inputs, elevated surfaces |
| `--hover-background`  | `--bg-accent`    | `#2d2d2d`                                                 | `#e9ecef`                                                   | Hover states                     |
| `--hover-color`       | —                | `rgba(255,255,255,0.1)`                                   | `rgba(0,0,0,0.1)`                                           | Hover overlay                    |
| `--link-color`        | —                | `#60a5fa`                                                 | `#007bff`                                                   | Hyperlinks, secondary buttons    |
| `--link-hover`        | —                | `#3b82f6`                                                 | `#0056b3`                                                   | Hovered hyperlinks               |
| `--accent-color`      | —                | `#ef4444`                                                 | `#dc3545`                                                   | Error states, warnings           |
| `--border-color`      | —                | `#404040`                                                 | `#dee2e6`                                                   | Borders, dividers                |
| `--footer-background` | —                | `#1a2e1a`                                                 | `#d4edda`                                                   | Footer base                      |
| `--footer-gradient`   | —                | `linear-gradient(rgba(26,46,26,0.1), rgba(26,46,26,0.1))` | `linear-gradient(rgba(40,167,69,0.4), rgba(40,167,69,0.4))` | Footer overlay                   |
| `--footer-blend-mode` | —                | `overlay`                                                 | `screen`                                                    | Footer image blend               |
| `--icon-filter`       | —                | `invert(1)`                                               | `none`                                                      | SVG icon color inversion         |

## 3. Typography Rules

### Font Families

| Context       | Family                                                                        | Weights  |
| ------------- | ----------------------------------------------------------------------------- | -------- |
| Default       | `"Noto Sans", sans-serif`                                                     | 400, 700 |
| Japanese (ja) | `"Noto Sans JP", "Noto Sans", sans-serif`                                     | 400, 700 |
| Chinese (zh)  | `"Noto Sans SC", "Noto Sans", sans-serif`                                     | 400, 700 |
| Logo          | `"Arial Black", "Arial", "Helvetica Neue", "Helvetica", "Impact", sans-serif` | 900      |

Note: `Inter:wght@700` is imported via Google Fonts but not referenced in any font-family declaration. Dead import.

### Type Scale

| Element                  | Size               | Weight | Notes                           |
| ------------------------ | ------------------ | ------ | ------------------------------- |
| Logo (h1, WelcomeScreen) | 2.5rem             | 900    | Logo font, letter-spacing 0.2em |
| h2 (IntroSection)        | 1.8rem             | bold   | Section heading                 |
| Popup h3 (About, Nostr)  | 1.4rem             | bold   | —                               |
| h1 (Header title)        | 1.25rem            | bold   | —                               |
| Welcome message          | 1.2rem             | 400    | —                               |
| h3 (Project cards)       | 1.1rem             | bold   | —                               |
| Body / inputs            | 16px (14px mobile) | 400    | Line height 1.6                 |
| Small / muted            | 0.9rem             | 400    | —                               |
| TagCloud filters         | 0.8rem             | 400    | —                               |
| Tags (expanded)          | 0.75rem            | 400    | —                               |
| Tags (compact)           | 0.7rem             | 400    | —                               |
| Header subtitle          | 0.65rem            | 400    | Opacity 0.8                     |

### Logo Typography

- Weight: 900
- Letter spacing: 0.2em
- Text shadow: simulated bold (±0.5px offset)
- Ligatures disabled (`font-feature-settings: "liga" 0`)

## 4. Component Stylings

### Buttons

**Primary (CTA):**

- Background: `var(--primary-color)`
- Color: `#ffffff`
- Padding: `0.5rem 1rem`
- Border radius: `0.25rem`
- Hover: opacity 0.9
- Transition: opacity 0.2s

**Secondary:**

- Background: `var(--background-color)`
- Color: `var(--link-color)`
- Border: `1px solid var(--border-color)`
- Padding: `0.5rem 1rem`
- Border radius: `0.25rem`
- Hover: background `var(--hover-background)`

**Link Button:**

- Background: none, border: none
- Color: `var(--link-color)`
- Hover: text-decoration underline

**Load More:**

- Link-style button with arrow icon
- Color: `var(--link-color)`

**TagCloud Filter:**

- Padding: `0.25rem 0.75rem`
- Font size: `0.8rem`
- Border radius: `4px`
- Background: `var(--input-background)`
- Border: `1px solid var(--border-color)`

### Project Cards

- Background: `var(--background-color)`
- Border: `1px solid var(--border-color)`
- Border radius: `4px`
- Hover: background `var(--hover-background)`, transition 0.2s
- Thumbnail: 60x60px, border-radius 4px
- Expandable on click (border-top divider on expanded content)

### Tags / Badges

- Compact: `0.7rem`, padding `0.1rem 0.4rem`, border-radius `0.25rem`
- Expanded: `0.75rem`, padding `0.25rem 0.5rem`
- Background: `var(--input-background)`
- Border: `1px solid var(--border-color)`

### Search Input

- Max width: 400px, centered
- Padding: `0.75rem 2.5rem` (space for icons)
- Background: `var(--input-background)`
- Border: `1px solid var(--border-color)`
- Border radius: 4px

### Popups (About, Nostr)

- Background: `var(--input-background)`
- Border: `2px solid var(--primary-color)`
- Border radius: 16px
- Padding: 2rem
- Width: 500px (95vw mobile)
- Triangle pointer: two-layer (outer border in `var(--primary-color)`, inner fill in `var(--input-background)`)
- Scrollbar: custom styled, width 20px, thumb `var(--primary-color)`, hover `var(--link-color)`, border-radius 10px

### Theme Toggle

- Switch: 50x24px, border-radius 2px
- Knob: 20x20px, white, box-shadow `0 2px 4px rgba(0,0,0,0.2)`
- Active background: `var(--primary-color)`, inactive: `#ccc`

### Sort Switch

- Switch: 60x30px (larger than Theme Toggle)
- Knob: 24x24px
- Inactive background: `var(--border-color)` (Theme Toggle は `#ccc` だが Sort Switch は異なる)
- Active background: `var(--primary-color)`

### Welcome Screen

- Full viewport: `min-height: 100vh`, center-aligned
- Logo at 2.5rem, welcome message at 1.2rem

## 5. Layout Principles

### Container

- Max width: **800px**
- Margin: 0 auto
- Padding: 0 20px (15px mobile)
- TagCloud has secondary constraint: max-width 600px

### Spacing Scale

| Token                      | Value     |
| -------------------------- | --------- |
| Section padding (projects) | `2rem 0`  |
| Section padding (intro)    | `1rem 0`  |
| Card gap                   | `1.5rem`  |
| Component gap              | `1rem`    |
| Media grid gap             | `0.75rem` |
| Small gap                  | `0.5rem`  |
| Tag gap (compact)          | `0.25rem` |

### Grid

- Media grid: `repeat(auto-fit, minmax(140px, 1fr))`, gap 0.75rem
- Project list: flex column, gap 1.5rem

## 6. Depth & Elevation

### Z-Index Hierarchy

| Layer               | Z-Index | Element                                 |
| ------------------- | ------- | --------------------------------------- |
| Background          | 0       | Floating square pixels                  |
| Content             | 1       | Page container                          |
| Sections            | 2       | Footer                                  |
| Popups              | 5       | About / Nostr popup                     |
| Game (falling)      | 19      | Tetris falling blocks                   |
| Game (grid)         | 20      | Tetris block grid                       |
| Game (disappearing) | 21      | Tetris disappearing blocks              |
| Header              | 50      | Sticky header                           |
| Header game         | 1000    | PixelAnimations (header-spawned blocks) |

### Shadows

Minimal. Flat design aesthetic.

- Theme toggle knob: `0 2px 4px rgba(0,0,0,0.2)`
- PixelAnimations blocks: `0 1px 2px rgba(0,0,0,0.1)`
- Cards: none (borders only)
- Popups: none (thick border instead)

### Border Radius

| Context                  | Radius  |
| ------------------------ | ------- |
| Standard (cards, inputs) | 4px     |
| Buttons, tags            | 0.25rem |
| TagCloud filters         | 4px     |
| Toggle switch            | 2px     |
| Popups                   | 16px    |
| Scrollbar thumb          | 10px    |

## 7. Do's and Don'ts

### Do

- Use CSS variables for all colors. Never hardcode hex in components
- Default to dark theme. Prevent white flash on page load
- Use Noto Sans for body, Arial Black for logo only
- Maintain 800px container max-width
- Add hover states to all interactive elements
- Set `html[lang]` font-family for ja and zh locales
- Lazy load images

### Don't

- Add heavy box-shadows. This is flat design
- Use gradients (except footer overlay at low opacity)
- Exceed border-radius 4px for standard components (popups are the exception at 16px)
- Hardcode colors outside CSS variable system
- Add decorative elements beyond existing patterns (square pixels, Tetris)
- Remove the Tetris game mechanic from header

### Transitions

The global `*` selector applies `0.8s ease-out` for background-color, color, and border-color (theme switching). Component-level transitions use shorter durations:

| Context               | Duration | Timing   |
| --------------------- | -------- | -------- |
| Theme switch (global) | 0.8s     | ease-out |
| Hover states          | 0.2s     | ease     |
| Component transitions | 0.3s     | ease     |

## 8. Responsive Behavior

### Breakpoints

| Name    | Value           | Adjustments                                    |
| ------- | --------------- | ---------------------------------------------- |
| Mobile  | max-width 768px | Font 14px, container padding 15px, popup 95vw  |
| Desktop | 768px+          | Font 16px, container padding 20px, popup 500px |

### Mobile Adjustments

- Body font: 14px (from 16px)
- Container padding: 15px (from 20px)
- Modals: max-height 90vh, scrollable
- Grid: auto-fit handles column collapse
- Buttons: flex-wrap for stacking

### Touch Targets

- Target: 32x32px minimum
- Button padding: 0.5rem 1rem
- Note: some icon buttons (theme toggle sun/moon) are ~24px. Known gap

### Scroll

- `scroll-behavior: smooth` on html

## 9. Agent Prompt Guide

### Full CSS Variable Reference

```
Dark theme:
  --background-color / --bg-primary:    #121212
  --input-background / --bg-secondary:  #1e1e1e
  --hover-background:                   #2d2d2d
  --hover-color:                        rgba(255,255,255,0.1)
  --text-color / --text-primary:        #ffffff
  --text-secondary / --muted-text:      #b0b0b0
  --primary-color / --text-accent:      #34d058
  --link-color:                         #60a5fa
  --link-hover:                         #3b82f6
  --accent-color:                       #ef4444
  --border-color:                       #404040
  --icon-filter:                        invert(1)

Light theme:
  --background-color / --bg-primary:    #ffffff
  --input-background / --bg-secondary:  #f8f9fa
  --hover-background:                   #e9ecef
  --hover-color:                        rgba(0,0,0,0.1)
  --text-color / --text-primary:        #000000
  --text-secondary / --muted-text:      #6c757d
  --primary-color / --text-accent:      #218838
  --link-color:                         #007bff
  --link-hover:                         #0056b3
  --accent-color:                       #dc3545
  --border-color:                       #dee2e6
  --icon-filter:                        none
```

### When generating UI for this project

- Always use CSS variables. Prefer semantic names (`--primary-color`, `--text-color`, `--border-color`)
- Dark mode is the default experience. Test dark first
- The green accent (#34d058) is the brand color. Use it for emphasis and CTAs
- Keep it flat. No gradients, no heavy shadows
- Container is 800px max. Don't widen it
- Use flexbox for layout. Grid only for media galleries
- Set font-family per locale: ja → Noto Sans JP, zh → Noto Sans SC, others → Noto Sans
- Component transitions: 0.3s ease. Hover: 0.2s. Theme switch uses 0.8s globally

### Color Emotion Reference

- **Green (#34d058):** Optimism, progress, retro terminal nostalgia
- **Blue (#60a5fa):** Trust, interactivity, navigation
- **Red (#ef4444):** Energy, warnings, accents
- **Gray (#b0b0b0):** Balance, secondary information
