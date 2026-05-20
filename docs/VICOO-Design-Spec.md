# VICOO — Design System Spec

> Stitch Design Token Reference
> 1990s Editorial / Print-Inspired / Welfare Action

---

## 1. Color Palette

### 1.1 Core Neutrals

| Token | Hex | Role |
|---|---|---|
| `paper` | `#F5F0E8` | Page background |
| `aged-stock` | `#EDE6D6` | Card / elevated surface |
| `warm-gray` | `#D4CFC4` | Borders, dividers |
| `muted-gray` | `#B8B2A7` | Disabled, placeholder |
| `ink` | `#1A1A16` | Primary text |
| `ink-faded` | `#4A4540` | Body text |
| `ink-light` | `#6B665C` | Secondary text |
| `cream` | `#FAF6EE` | Bright background variant |

### 1.2 Sepia Warm Tones

| Token | Hex | Role |
|---|---|---|
| `sepia-dark` | `#3D3228` | Dark accent |
| `sepia-mid` | `#5C4D3D` | Mid-tone accent, subtitles |
| `sepia-light` | `#8B7B66` | Light accent |
| `sepia-on-dark` | `#B5A595` | Text on dark bg (WCAG AA) |

### 1.3 Rust / Accent

| Token | Hex | Role |
|---|---|---|
| `rust` | `#8B3A2A` | Primary accent, links hover, active tab |
| `rust-light` | `#A85A4A` | Hover states |
| `rust-dark` | `#6B2A1A` | Pressed states |
| `archive-brown` | `#5C4033` | Editorial accent |
| `pale-gold` | `#C4A45A` | Selection highlight, gold accent |
| `pale-gold-light` | `#D4BC7A` | Light gold |

### 1.4 Sage Green

| Token | Hex | Role |
|---|---|---|
| `sage` | `#3F4F45` | Green primary |
| `sage-light` | `#5A6B5F` | Green secondary |
| `sage-lighter` | `#7A8B7E` | Green tertiary |
| `sage-muted` | `#95A398` | Green subtle |
| `sage-pale` | `#C8D1CA` | Green background |
| `sage-dark` | `#2D3B33` | Green dark |

### 1.5 Editorial Accents

| Token | Hex |
|---|---|
| `editorial-red` | `#C41E3A` |
| `editorial-navy` | `#1C2841` |
| `editorial-olive` | `#4A5240` |
| `editorial-burgundy` | `#6B2D3D` |

### 1.6 Functional

| Token | Hex | Usage |
|---|---|---|
| `success` | `#3D5A3D` | Confirmations |
| `error` | `#8B3A2A` | Errors (same as rust) |
| `warning` | `#A68A3D` | Warnings |
| `info` | `#3D4A5C` | Informational |
| `eco-green` | `#5A7A5A` | Sustainability badges |

### 1.7 Usage Rules

- **Background hierarchy:** `paper` → `aged-stock` → `cream`
- **Text hierarchy:** `ink` (headings) → `ink-faded` (body) → `ink-light` (secondary) → `muted-gray` (disabled)
- **Interactive accent:** `rust` — used for hover links, active tabs, CTAs
- **Selection highlight:** `pale-gold` background + `ink` text

---

## 2. Typography

### 2.1 Font Families

| Token | Stack | Usage |
|---|---|---|
| `display` | `'Smiley Sans', 'Helvetica Neue', Arial, sans-serif` | Headings, logo, editorial quotes |
| `body` | `'Inter', 'Source Sans Pro', sans-serif` | Body text, labels, captions |
| `ui` | `'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | Buttons, inputs, form controls |

> **Note:** `Smiley Sans` (得意黑) is a Chinese display font loaded as a local woff2. For English fallback it drops to Helvetica Neue.

### 2.2 Type Scale

| Token | Size | Usage |
|---|---|---|
| `hero` | `clamp(56px, 10vw, 120px)` | Hero headlines |
| `display` | `clamp(40px, 7vw, 80px)` | Section titles |
| `h1` | `clamp(32px, 5vw, 56px)` | Page titles |
| `h2` | `clamp(24px, 3.5vw, 40px)` | Section headings |
| `h3` | `clamp(20px, 2.5vw, 28px)` | Subsection headings |
| `h4` | `clamp(16px, 1.5vw, 20px)` | Card titles |
| `body-lg` | `18px` | Large body text |
| `body` | `16px` | Default body text |
| `body-sm` | `14px` | Small body text |
| `caption` | `12px` | Captions, timestamps |
| `label` | `11px` | Labels, nav pills |
| `overline` | `10px` | Overlines, section numbers |

### 2.3 Heading Styles

| Level | Font | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|
| `hero` | display | 900 | 0.92 | -0.035em |
| `h1` | display | 800 | 0.95 | -0.03em |
| `h2` | display | 700 | 1.0 | -0.02em |
| `h3` | display | 600 | 1.15 | normal |
| Default heading | display | 500 | 1.05 | 0.12em |

### 2.4 Body & Label Styles

| Style | Font | Weight | Line Height | Letter Spacing | Transform |
|---|---|---|---|---|---|
| Body | body | 400 | 1.7 | 0.01em | none |
| Label | body | 500 | — | 0.08em | uppercase |
| Caption | body | 400 | — | 0.12em | uppercase |
| Editorial subtitle | body | 500 | — | 0.15em | uppercase |

### 2.5 Responsive (≤768px)

| Token | Mobile Size |
|---|---|
| `hero` | `clamp(48px, 12vw, 80px)` |
| `h1` | `clamp(32px, 8vw, 56px)` |
| `h2` | `clamp(24px, 5vw, 36px)` |
| `h3` | `clamp(18px, 3vw, 24px)` |

---

## 3. Spacing

8px base grid. All values in pixels.

| Token | Value | Tailwind |
|---|---|---|
| `space-1` / `xs` | 4px | `p-1` |
| `space-2` / `sm` | 8px | `p-2` |
| `space-3` | 12px | `p-3` |
| `space-4` / `md` | 16px | `p-4` |
| `space-5` | 20px | `p-5` |
| `space-6` | 24px | `p-6` |
| `space-8` | 32px | `p-8` |
| `space-10` | 40px | `p-10` |
| `space-12` | 48px | `p-12` |
| `space-16` | 64px | — |
| `space-20` | 80px | — |
| `space-24` | 96px | — |
| `space-32` | 128px | — |
| `space-40` | 160px | — |

**Gutter:** `clamp(16px, 4vw, 80px)`
**Gutter-sm:** `clamp(12px, 2vw, 24px)`
**Grid gap:** 24px (`space-6`)
**Grid columns:** 12

---

## 4. Border Radius

Minimal, editorial feel.

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 2px | Subtle rounding |
| `radius-md` | 4px | Cards, inputs |
| `radius-lg` | 8px | Modals, dropdowns |
| `rounded-full` | 9999px | Pills, badges, avatar |

---

## 5. Borders

| Token | Value |
|---|---|
| `border-thin` | 1px solid `warm-gray` |
| `border-divider` | 1px solid `rgba(212, 207, 196, 0.4)` |
| `border-accent` | 2px solid `rust` |
| `border-heavy` | 3px solid `ink` |

---

## 6. Shadows

Subtle, print-inspired. All use `rgba(26, 26, 22, *)`.

| Token | Value | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 2px @ 4%` | Buttons, small elements |
| `shadow-md` | `0 4px 12px @ 6%` | Cards |
| `shadow-lg` | `0 8px 24px @ 8%` | Dropdowns |
| `shadow-xl` | `0 16px 48px @ 10%` | Modals |
| `shadow-inset` | `inset 0 2px 8px @ 4%` | Pressed states |

---

## 7. Motion / Transitions

| Token | Curve | Usage |
|---|---|---|
| `ease-editorial` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default — everything |
| `ease-entrance` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering |
| `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful bounce |

| Token | Duration | Usage |
|---|---|---|
| `instant` | 100ms | Micro-interactions |
| `fast` | 200ms | Hover, color transitions |
| `normal` | 400ms | Layout shifts |
| `slow` | 700ms | Page sections |
| `page-flip` | 800ms | Full page transitions |

---

## 8. Layout

| Token | Value |
|---|---|
| `max-width` | 1400px |
| `max-width-prose` | 720px |
| `max-width-wide` | 1600px |
| `header-height` | 72px |
| `header-height-md` | 88px |
| Breakpoint (mobile) | 768px |

---

## 9. Z-Index Scale

| Token | Value |
|---|---|
| `base` | 1 |
| `dropdown` | 10 |
| `sticky` | 20 |
| `overlay` | 50 |
| `modal` | 100 |
| `tooltip` | 150 |
| `toast` | 200 |
| `grain` | 9999 |

---

## 10. Themes (10 presets)

Each theme overrides `--color-*` and `--theme-*` variables via `[data-theme]` on `<html>`.

### Default: Editorial

| Surface | Hex |
|---|---|
| bg | `#F7F5F2` |
| elevated | `#EFECEA` |
| subtle | `#FAF8F5` |
| panel | `#F0ECE8` |
| text | `#2D2A26` |
| text-muted | `#6B6560` |
| border | `#D4CFC8` |
| accent | `#8B7355` |
| rust | `#A65D4E` |

### Morandi

Soft muted grays. `bg #F2F0ED`, `text #3D3A36`, `accent #8B8178`, `rust #9A9080`.

### Sepia

Warm vintage. `bg #F5F0E8`, `text #3D3428`, `accent #8B7355`, `rust #A65D4E`.

### Monochrome

Pure B&W. `bg #FAFAFA`, `text #1A1A1A`, `accent #666666`, `rust #333333`.

### Ink Wash

Chinese ink. `bg #F0EDE8`, `text #2D2A26`, `accent #6B6560`, `rust #8B7355`.

### Forest

Earth greens. `bg #F0F3EE`, `text #2D3630`, `accent #5A6A56`, `rust #8B7355`.

### Autumn

Warm amber/rust. `bg #F8F4F0`, `text #3D2D22`, `accent #A65D4E`, `rust #C49070`.

### Mist Blue

Calm blue. `bg #EDF2F4`, `text #2D3A42`, `accent #8FB4B5`, `rust #9DB8BA`.

### Deep Sea

Professional navy. `bg #E4E9ED`, `text #2A3440`, `accent #647684`, `rust #748A96`.

### Dopamine

Vibrant red-blue. `bg #FFFFFF`, `text #1A1A2E`, `accent #2668FD`, `rust #FD4401`.

---

## 11. Component Tokens (Header pills)

| Property | Value |
|---|---|
| Container | `rounded-full`, `bg-white/80`, `backdrop-blur-xl`, `shadow-sm` |
| Container padding | `px-2 py-1` (8px / 4px) |
| Item padding | `px-3 py-1` (12px / 4px) |
| Item radius | `rounded-full` |
| Item active | `text-ink`, `font-medium`, `bg-rust/15` |
| Item inactive | `text-ink-faded`, hover `text-ink` |
| Item font | `font-body`, `text-label` (11px), `tracking-wide`, `uppercase` |
| Toggle button | `px-5 py-1.5`, `rounded-full` |
| Toggle active | `bg-ink`, `text-paper` |
| Toggle inactive | `bg-white/80`, `backdrop-blur-xl`, `shadow-sm` |
| Transition | 0.45s `cubic-bezier(0.32, 0.72, 0, 1)` |

---

## 12. Component Tokens (User menu / Dropdown)

| Property | Value |
|---|---|
| Trigger | 36×36px circle, `bg-white`, `shadow-sm` |
| Dropdown | `w-56`, `bg-paper`, `border warm-gray/40`, `shadow-lg`, `rounded-lg` |
| Item padding | `px-4 py-2.5` |
| Item hover | `bg-warm-gray/10` |
| Entry anim | `opacity: 0→1`, `y: -8→0`, 150ms |

---

## 13. Selection & Special

| Property | Value |
|---|---|
| `::selection` bg | `pale-gold` (`#C4A45A`) |
| `::selection` text | `ink` (`#1A1A16`) |
| Link hover color | `rust` |
| Drop cap | display font, 4em, `rust` color, float left |
| Editorial quote | display font, h3 size, italic, `ink` color |
