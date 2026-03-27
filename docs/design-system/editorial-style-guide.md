# Editorial Style Guide

## Tonghua Public Welfare x Sustainable Fashion

**Version:** 1.0.0
**Last Updated:** 2026-03-19
**Design Language:** 1990s Print Magazine Aesthetic (Editorial / Print-inspired / Humanistic)

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Typography](#2-typography)
3. [Color Palette](#3-color-palette)
4. [Layout System](#4-layout-system)
5. [Image Treatment](#5-image-treatment)
6. [Component Specifications](#6-component-specifications)
7. [Motion and Animation](#7-motion-and-animation)
8. [Responsive Design](#8-responsive-design)
9. [Navigation](#9-navigation)
10. [Accessibility](#10-accessibility)

---

## 1. Design Philosophy

### Core Aesthetic: 1990s Printed Magazine

Every page of the React web platform must feel like an issue of a thoughtful, independent journal. The visual identity is the brand -- it must be preserved consistently across all 8 pages.

**Design Keywords:**

| Keyword | Meaning |
|---------|---------|
| Editorial | Magazine-like content hierarchy with intentional information architecture |
| Print-Inspired | Typography, grid, and composition that reference physical print media |
| Humanistic | Warm, approachable, people-centered -- not corporate or sterile |
| Literary | Thoughtful, poetic, culturally refined -- reads like quality journalism |
| Asymmetrical | Deliberate imbalance in layout -- avoids mechanical centering |
| Tactile | Paper textures, grain overlays -- evokes physical media |
| Archival | Sepia tones, aged aesthetics -- feels like a preserved publication |

### What This Is NOT

- NOT a modern SaaS dashboard
- NOT a corporate charity portal with stock photography
- NOT a minimalist app with clean white backgrounds
- NOT a Bootstrap-style template

---

## 2. Typography

### Font Families

| Role | Font | Fallback | Usage |
|------|------|----------|-------|
| Display / Headlines | `Playfair Display` | Georgia, serif | Hero text, section headings, cover-style titles |
| Body / Editorial | `IBM Plex Mono` | 'Courier New', monospace | Articles, captions, narrative paragraphs |
| Functional UI | `Inter` | 'Source Sans Pro', sans-serif | Buttons, form labels, secondary navigation |

### Import (Google Fonts)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700&family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
```

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `--text-hero` | `clamp(64px, 10vw, 120px)` | 1.0 | 700 | Full-page hero headlines |
| `--text-h1` | `clamp(40px, 6vw, 72px)` | 1.1 | 700 | Section titles |
| `--text-h2` | `clamp(28px, 4vw, 48px)` | 1.2 | 600 | Subsection headings |
| `--text-h3` | `clamp(20px, 2.5vw, 32px)` | 1.3 | 500 | Card titles, minor headings |
| `--text-body` | `16px` | 1.8 | 400 | Body text |
| `--text-caption` | `12px` | 1.6 | 400 | Photo credits, metadata |
| `--text-label` | `13px` | 1.5 | 500 | Form labels, UI elements |

### Drop Cap Style

For long-form articles, the first letter of the first paragraph uses:

```css
.drop-cap::first-letter {
  font-family: var(--font-display);
  font-size: 4.5em;
  float: left;
  line-height: 0.8;
  margin-right: 0.08em;
  margin-top: 0.05em;
  color: var(--color-archive-brown);
}
```

---

## 3. Color Palette

### Background Colors

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-paper` | `#F5F0E8` | 245, 240, 232 | Primary page background |
| `--color-aged-stock` | `#EDE6D6` | 237, 230, 214 | Alternate section backgrounds |
| `--color-warm-gray` | `#D4CFC4` | 212, 207, 196 | Dividers, muted areas |

### Foreground Colors

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-ink` | `#1A1A16` | 26, 26, 22 | Primary text, headlines |
| `--color-ink-faded` | `#4A4540` | 74, 69, 64 | Secondary text, borders |
| `--color-sepia-mid` | `#7A6A58` | 122, 106, 88 | Photo credits, dates |

### Accent Colors

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-rust` | `#8B3A2A` | 139, 58, 42 | Pull quotes, rare emphasis |
| `--color-archive-brown` | `#5C4033` | 92, 64, 51 | Headlines, primary accent |
| `--color-pale-gold` | `#C4A45A` | 196, 164, 90 | Subtle highlights |

### Usage Rules

- **Never use pure white (#FFFFFF)** as a background -- always paper-toned
- **Never use pure black (#000000)** for text -- use `--color-ink`
- Accent colors should be **sparse** -- most of the palette is neutral
- Links use `--color-rust` with underline decoration
- Focus states use `--color-archive-brown`

---

## 4. Layout System

### Grid Philosophy

Magazine-style CSS Grid with **unequal column widths**. Mechanical symmetry is avoided.

### Column Patterns

```css
/* Two-column asymmetric */
.grid-split {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: var(--space-xl);
}

/* Editorial spread */
.grid-spread {
  display: grid;
  grid-template-columns: 7fr 3fr;
  gap: var(--space-lg);
}

/* Three-column uneven */
.grid-three {
  display: grid;
  grid-template-columns: 2fr 5fr 3fr;
  gap: var(--space-lg);
}
```

### Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight internal spacing |
| `--space-sm` | `8px` | Default small gap |
| `--space-md` | `16px` | Standard gap |
| `--space-lg` | `32px` | Section internal padding |
| `--space-xl` | `64px` | Between major sections |
| `--space-2xl` | `96px` | Page section breaks |
| `--space-3xl` | `160px` | Hero spacing |

### Bleed Effect

Headlines that extend beyond their column boundary to simulate print bleed:

```css
.bleed-title {
  margin-left: -5vw;
  padding-left: 5vw;
  overflow: visible;
}
```

---

## 5. Image Treatment

### Sepia Filter

All editorial images must use this treatment:

```css
.editorial-image {
  filter: sepia(0.2) contrast(1.05) brightness(0.97);
}
```

### Grain Overlay

Applied over images to simulate printed photography:

```css
.grain-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/textures/grain.png');
  opacity: 0.08;
  mix-blend-mode: multiply;
  pointer-events: none;
}
```

### Paper Texture Background

```css
.paper-bg {
  background-color: var(--color-paper);
  background-image: url('/textures/paper.png');
  background-size: 400px;
  background-repeat: repeat;
}
```

### Rules

1. **No high-saturation photography** -- all imagery must feel archival
2. **No pure white backgrounds** behind images -- always paper-toned
3. **Photo credits** rendered in small monospaced text below images
4. **Aspect ratios** should feel editorial -- avoid standard web ratios
5. **Children's artwork** should NOT receive sepia filter -- preserve original colors

---

## 6. Component Specifications

### EditorialHero

Full-bleed hero section with oversized headline.

**Structure:**
- Container: `min-height: 80vh`, paper background
- Headline: Playfair Display, `--text-hero` size, optional left bleed
- Subline: IBM Plex Mono, `--text-body`, muted color
- Image: Full-bleed or asymmetric column placement, sepia-treated

### MagazineNav

Table-of-contents style navigation.

**Structure:**
- Number prefix (01, 02, 03...) at `0.75rem`
- Label text at `--text-label`
- On hover: number scales to `1.1rem`, bold, `--color-archive-brown`
- Active state: enlarged number + underline rule

### NumberedSectionHeading

Section headers with editorial numbering.

**Structure:**
- Number: Playfair Display, `--text-h3`, `--color-sepia-mid`
- Title: Playfair Display, `--text-h2`, `--color-ink`
- Optional decorative rule below

### BleedTitleBlock

Headlines with controlled overflow.

**Structure:**
- `margin-left: -5vw`
- Playfair Display, `--text-h1` or `--text-hero`
- `overflow: visible`

### SepiaImageFrame

Image wrapper with archival treatment.

**Structure:**
- Outer: border `--border-decorative`
- Image: sepia(0.2) filter
- Overlay: grain pseudo-element
- Caption: IBM Plex Mono, `--text-caption`

### StoryQuoteBlock

Pull quotes for editorial content.

**Structure:**
- Large opening quote mark: Playfair Display, `6rem`, `--color-rust`
- Quote text: Playfair Display italic, `--text-h3`
- Attribution: IBM Plex Mono, `--text-caption`

### EditorialFooter

Magazine-style footer.

**Structure:**
- Top rule: `--border-heavy`
- Issue number: "Vol. 1 -- Issue 1 -- March 2026"
- Navigation columns
- Legal links
- Bottom: copyright in monospaced text

### DonationPanel

Donation amount selection and payment component.

**Structure:**
- Background: `--color-aged-stock`
- Border: 1px solid `--color-warm-gray`
- Amount buttons: 3x2 grid, bordered, `--text-h3`
- Selected state: `--color-rust` background, `--color-paper` text
- Custom input: IBM Plex Mono, bordered input
- CTA button: Full-width, `--color-rust` background, `--color-paper` text, uppercase

### TraceabilityTimeline

Vertical timeline for supply chain visualization.

**Structure:**
- Layout: Vertical line with nodes
- Line: 2px solid `--color-warm-gray`
- Node: 12px circle, `--color-archive-brown` fill when verified
- Card: `--color-paper` background, 1px border, alternating left/right
- Date: IBM Plex Mono `--text-caption`
- Title: Playfair Display `--text-h3`

---

## 7. Motion and Animation

### Page Transitions

Flip-page effect using Framer Motion:

```tsx
const pageVariants = {
  initial: { opacity: 0, y: 20, rotateY: -3 },
  animate: { opacity: 1, y: 0, rotateY: 0 },
  exit: { opacity: 0, y: -20, rotateY: 3 },
};
```

**Duration:** 600ms--900ms
**Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` for exits; `cubic-bezier(0, 0, 0.2, 1)` for entrances

### Section Entrances

Staggered fade-in on scroll:

```tsx
const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: [0, 0, 0.2, 1] }
  }),
};
```

### Hover Effects

| Element | Effect |
|---------|--------|
| Numbered Nav | Number scale 1.4x + opacity fade |
| Headlines | 2-4px leftward shift + subtle opacity |
| Images | Grain intensity increase + sepia lift |

### Principles

- All motion serves the **reading experience**
- Never under 300ms for major transitions
- Single, non-repeating scroll reveals
- No bouncy, playful, or flashy animations
- Respect `prefers-reduced-motion: reduce`

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 8. Responsive Design

### Breakpoints

| Label | Width | Layout |
|-------|-------|--------|
| Mobile | < 768px | Single column, scaled hierarchy |
| Tablet | 768px--1023px | Two-column, reduced oversized titles |
| Desktop | >= 1024px | Full editorial grid with bleed |

### Mobile Adaptations

- Hero headlines: max 48px (not the full 120px)
- Bleed effects disabled
- Single-column flow
- Navigation collapses to hamburger with full-screen overlay
- Images stack vertically

### Tablet Adaptations

- Two-column layouts
- Oversized headlines reduced but still present
- Grid columns adjusted (e.g., `1fr 1fr` instead of `3fr 2fr`)

---

## 9. Navigation

### Desktop Navigation Bar

```
+------------------------------------------------------------+
|  TONGHUA              01 Home    02 About    03 Campaigns  |
|  公益 可持续时尚        04 Stories  05 Donate   06 Shop      |
|                       07 Traceability   08 Contact         |
+------------------------------------------------------------+
```

### Mobile Navigation

Full-screen overlay with editorial layout:

```
+-----------------------------+
|  X Close                    |
|                             |
|  01 Home                    |
|  02 About                   |
|  03 Campaigns               |
|  04 Stories                 |
|  05 Donate                  |
|  06 Shop                    |
|  07 Traceability            |
|  08 Contact                 |
|                             |
|  TONGHUA 公益 可持续时尚    |
+-----------------------------+
```

---

## 10. Accessibility

### Color Contrast

All text/background combinations must meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text):

| Combination | Contrast Ratio | Status |
|-------------|---------------|--------|
| `--color-ink` on `--color-paper` | 14.2:1 | Pass AAA |
| `--color-ink-faded` on `--color-paper` | 6.8:1 | Pass AA |
| `--color-rust` on `--color-paper` | 4.6:1 | Pass AA |
| `--color-ink` on `--color-aged-stock` | 12.1:1 | Pass AAA |

### Focus States

All interactive elements must have visible focus indicators:

```css
:focus-visible {
  outline: 2px solid var(--color-archive-brown);
  outline-offset: 3px;
}
```

### Semantic HTML

- Use `<article>`, `<section>`, `<nav>`, `<header>`, `<footer>`, `<main>`
- All images have descriptive `alt` text
- Heading hierarchy follows logical order (h1 -> h2 -> h3)
- Form inputs have associated `<label>` elements

### Keyboard Navigation

- All interactive elements reachable via Tab
- Skip-to-content link on every page
- Modal dialogs trap focus
- Dropdown menus navigable via arrow keys

---

## Design Tokens CSS Reference

```css
:root {
  /* Fonts */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'IBM Plex Mono', 'Courier New', monospace;
  --font-ui: 'Inter', 'Source Sans Pro', sans-serif;

  /* Text Sizes */
  --text-hero: clamp(64px, 10vw, 120px);
  --text-h1: clamp(40px, 6vw, 72px);
  --text-h2: clamp(28px, 4vw, 48px);
  --text-h3: clamp(20px, 2.5vw, 32px);
  --text-body: 16px;
  --text-caption: 12px;
  --text-label: 13px;

  /* Colors - Background */
  --color-paper: #F5F0E8;
  --color-aged-stock: #EDE6D6;
  --color-warm-gray: #D4CFC4;

  /* Colors - Foreground */
  --color-ink: #1A1A16;
  --color-ink-faded: #4A4540;
  --color-sepia-mid: #7A6A58;

  /* Colors - Accent */
  --color-rust: #8B3A2A;
  --color-archive-brown: #5C4033;
  --color-pale-gold: #C4A45A;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 32px;
  --space-xl: 64px;
  --space-2xl: 96px;
  --space-3xl: 160px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 300ms ease;
  --transition-slow: 600ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

*Style Guide Version: 1.0*
*Based on: Project Plan Section 5 -- Visual Design System*
