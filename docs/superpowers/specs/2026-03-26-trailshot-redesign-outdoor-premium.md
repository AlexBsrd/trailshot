# TrailShot Redesign — Outdoor Premium

## Overview

Redesign the TrailShot frontend from a generic blue/gray AI-generated look to an "Outdoor Premium" visual identity. The goal is elegance, personality (trail/nature), and polish while keeping the existing layout simplicity that works well for runners buying their photos.

**Scope:** Public pages + Admin interface.
**Approach:** Full design system — design tokens, reusable animation utilities, component-level restyling with template adjustments where needed.

## Design Tokens

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `$color-forest` | `#1B3A2D` | Primary dark: navbar, hero overlay, admin sidebar, headings |
| `$color-forest-light` | `#4A7B5A` | Accent green: gradients, hovers, focus states, links |
| `$color-sand` | `#A68B5B` | Warm accent: secondary text, metadata, borders |
| `$color-sand-light` | `#D4C5A0` | CTA buttons, badges, highlights, selected states |
| `$color-cream` | `#FAF7F2` | Page background (replaces white/light gray) |
| `$color-white` | `#FFFFFF` | Cards, inputs, elevated surfaces |
| `$color-text` | `#2D4F3E` | Body text (slightly lighter than forest for readability) |
| `$color-text-muted` | `#7A8B7E` | Muted/placeholder text |
| `$color-success` | `#3A7D4A` | Success states (natural green, palette-coherent) |
| `$color-warning` | `#C4963A` | Warning states (warm amber) |
| `$color-danger` | `#B84040` | Error/delete states (muted red) |

### Glass-morphism Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `$glass-dark` | `rgba(27,58,45,0.65)` + `backdrop-filter: blur(16px)` | Panels over photos (hero search, filter zone) |
| `$glass-light` | `rgba(255,255,255,0.12)` + `backdrop-filter: blur(12px)` | Inputs on dark backgrounds |
| `$glass-nav` | `rgba(27,58,45,0.85)` + `backdrop-filter: blur(12px)` | Navbar after scroll, sticky cart bar |

Fallback for browsers without `backdrop-filter`: use same background colors without blur.

### Typography

| Token | Value |
|-------|-------|
| `$font-family` | `'Inter', system-ui, sans-serif` |
| `$font-heading-weight` | `800` |
| `$font-subheading-weight` | `700` |
| `$font-body-weight` | `400` |
| `$font-size-hero` | `2.5rem` |
| `$font-size-h1` | `1.5rem` |
| `$font-size-h2` | `1.25rem` |
| `$font-size-body` | `0.95rem` |
| `$font-size-small` | `0.85rem` |
| `$font-size-xs` | `0.75rem` |

`$font-heading-weight` (800) is for page titles and hero. `$font-subheading-weight` (700) is for card titles, section headings, and smaller headings.

Inter is loaded via Google Fonts (`<link>` in `index.html`) with `display=swap`. System-ui fallback has similar metrics so FOUT is minimal.

### Spacing & Radius

| Token | Value |
|-------|-------|
| `$radius-sm` | `6px` |
| `$radius-md` | `10px` |
| `$radius-lg` | `16px` |
| `$shadow-card` | `0 2px 8px rgba(27,58,45,0.08)` |
| `$shadow-elevated` | `0 8px 24px rgba(27,58,45,0.12)` |

### Responsive Breakpoints

| Token | Value | Usage |
|-------|-------|-------|
| `$breakpoint-sm` | `640px` | Mobile |
| `$breakpoint-md` | `768px` | Tablet |
| `$breakpoint-lg` | `1024px` | Desktop |
| `$breakpoint-xl` | `1280px` | Wide |

### Animation Utilities

| Utility | Effect |
|---------|--------|
| `@mixin fade-in-up` | `opacity: 0 → 1`, `translateY(20px → 0)`, `0.6s ease-out` |
| `@mixin hover-lift` | `translateY(-3px)` + `$shadow-elevated` on hover, `0.2s` |
| `@mixin glass($variant)` | Applies correct `backdrop-filter` + background per variant (`dark`, `light`, `nav`) |
| `.scroll-reveal` | Utility class: elements fade-in-up when entering viewport (IntersectionObserver) |

All animations respect `prefers-reduced-motion: reduce` — when set, disable `fade-in-up`, `hover-lift`, `scroll-reveal` transitions, and parallax. Elements appear immediately without motion.

## Public Pages

### Navbar

- Transparent at top of page, transitions to `$glass-nav` on scroll (IntersectionObserver on hero element)
- Logo "TRAILSHOT": `$color-cream`, Inter 800, letter-spacing 1.5px
- Nav links: `$color-cream`, opacity 0.8 → 1 on hover
- Cart badge: `$color-sand-light` background, `$color-forest` text
- Transition: background + box-shadow over 0.3s
- **Mobile (< `$breakpoint-md`)**: Hamburger icon, off-canvas menu sliding from right (0.3s ease). Menu background `$color-forest`, full-height, z-index 300 (above lightbox), links stacked vertically, close button top-right. Semi-transparent backdrop overlay on body when open.

### Hero (Home Page)

- Full-bleed landscape photo background (default trail photo bundled as static asset)
- Height: 70vh desktop, 50vh mobile
- Overlay: `linear-gradient(to bottom, rgba(27,58,45,0.3), rgba(27,58,45,0.7))`
- Light parallax: `background-attachment: fixed` (disabled on mobile and when `prefers-reduced-motion`)
- Centered content:
  - Title: "Trouvez vos photos de course", Inter 800, 2.5rem, `$color-cream`
  - Subtitle: Inter 400, opacity 0.7
  - **Search form**: Event `<select>` + bib number input + submit button, all wrapped in a `$glass-light` container with `$radius-md`. Select and input share the same glass styling: `rgba(255,255,255,0.1)` background, `$color-cream` text, custom dropdown arrow in `$color-sand-light`. Button in `$color-sand-light` background / `$color-forest` text.
- Entry animation: `fade-in-up` 0.8s on content at page load

### Event Cards

- Background: `$color-white`, border-radius `$radius-lg`, `$shadow-card`
- Cover image: 16:9 aspect ratio with subtle gradient overlay at bottom for text readability. **Fallback** (no cover photo): gradient from `$color-forest` to `$color-forest-light`
- Title: Inter `$font-subheading-weight` (700), `$color-forest`
- Metadata (date, photo count): `$color-sand`, `$font-size-small`
- "Free" badge: light `$color-success` background, `$color-success` text
- "Pack" badge: light `$color-sand-light` background, `$color-sand` text
- Hover: `hover-lift` mixin (translateY -3px + `$shadow-elevated`)
- `.scroll-reveal` class for fade-in on scroll
- **Mobile (< `$breakpoint-sm`)**: Single column, full width

### Events List Page

- Page heading: "Toutes les courses", Inter 800, `$color-forest`, on `$color-cream` background
- Search/filter input: `$color-white` background, border `#d1d5db`, focus border `$color-forest-light` + ring, same as form inputs. Positioned above the grid.
- Event cards grid: same as home page grid, `repeat(auto-fill, minmax(280px, 1fr))`
- Empty state: centered text in `$color-text-muted`, subtle illustration or icon optional
- `.scroll-reveal` on card groups

### Event Detail — Photo Grid

- **Filter zone**: Banner with event photo as background (blurred via `filter: blur(8px)`), `$glass-dark` overlay, search input + button in glass style (same treatment as hero search form)
- **Pack CTA banner** (visible when filtering by bib on paid event): `$color-forest` background, `$color-cream` text, CTA button in `$color-sand-light` / `$color-forest` text. Strikethrough price in `$color-text-muted`.
- Grid: `repeat(auto-fill, minmax(220px, 1fr))`, gap 12px. Mobile: `minmax(150px, 1fr)`.
- Thumbnails: 4:3 aspect-ratio, border-radius `$radius-sm`
- **Price overlay**: `$glass-dark` background, `$color-cream` text, `$font-size-xs`, positioned bottom-right of thumbnail
- Selected state: 3px border `$color-sand-light` + checkmark icon in corner
- Hover: `scale(1.02)` + shadow, transition 0.2s
- `.scroll-reveal` on grid groups
- **Sticky cart bar** (bottom of page when photos selected): `$glass-nav` background, `$color-cream` text. Layout: selected count (Inter 400) | total price (Inter 700, `$color-sand-light`) | "Commander" button (`$color-sand-light` bg / `$color-forest` text, same as primary CTA)

### Photo Detail Page

- Back link: `$color-forest-light`, hover `$color-forest`, with left arrow icon
- Image container: max-width centered, `$radius-md`, `$shadow-elevated`
- Bib tags: `$color-sand-light` background, `$color-forest` text, `$radius-sm`, inline pills
- Action button (buy/download): `$color-sand-light` background / `$color-forest` text, prominent, full width on mobile
- Background: `$color-cream`

### Lightbox (inline, event detail)

- Overlay: `rgba(27,58,45,0.85)` (forest-tinted instead of pure black)
- Image: max 90vw/90vh, `$radius-sm`
- Close button: `$color-cream` icon on `rgba(255,255,255,0.1)` circle, top-right, hover opacity
- Entry animation: fade-in 0.2s on overlay + scale(0.95 → 1) on image

### Order Page

Three states:

**Empty cart:**
- Centered message in `$color-text-muted`
- CTA button to browse events: `$color-sand-light` bg / `$color-forest` text

**Order form:**
- Photo summary: miniature thumbnails grid
- Photo count + pack badge (`$color-sand-light` bg / `$color-sand` text) if applicable
- Email input: same form input style
- Price display: Inter 700, `$color-forest`
- Submit button: `$color-sand-light` bg / `$color-forest` text, large

**Success confirmation:**
- Fade-in animation
- Success icon in `$color-success`
- Download link: `$color-forest-light`, prominent
- Expiration notice: `$color-text-muted`, `$font-size-small`
- Return CTA: secondary button style

### About Page

- Reduced hero (30vh) with photo + overlay, same treatment as home
- Content centered, max-width 700px
- Text: `$color-text` on `$color-cream` background

### Footer

- Background: `$color-forest`, text `$color-cream` opacity 0.7
- Link hover: opacity → 1
- Minimal: one or two lines

## Admin Interface

**Principle:** Apply new palette and typography for visual coherence. Keep existing sidebar + content layout. No glass-morphism or fancy animations — this is a productivity tool.

### Login Page

- Full page, `$color-cream` background
- Centered card: `$color-white` background, `$shadow-elevated`, `$radius-lg`, max-width 400px
- Title "Administration": Inter 800, `$color-forest`
- Inputs: standard form input style
- Error message: `$color-danger` text, `$font-size-small`
- Submit button: primary style (`$color-forest` bg / `$color-cream` text), full width

### Sidebar

- Background: `$color-forest`, text `$color-cream`
- Active item: `rgba(255,255,255,0.1)` background + 3px left border in `$color-sand-light`
- Hover: `rgba(255,255,255,0.06)` background
- Logo/title at top, same style as public navbar

### Content Area

- Body background: `$color-cream`
- Stat cards: `$color-white` background, `$shadow-card`, values in `$color-forest` Inter 800, labels in `$color-sand`

### Tabs (Event Detail Admin)

- Tab bar: bottom border `#d1d5db`
- Inactive tab: `$color-text-muted`, no background
- Active tab: `$color-forest` text, 2px bottom border `$color-forest-light`
- Hover (inactive): `$color-text`

### Tables (Events, Orders)

- Table header: light `$color-forest` background (`rgba(27,58,45,0.05)`)
- Alternating rows: `$color-white` / `$color-cream`
- Row hover: `rgba(166,139,91,0.08)` (very light sand)
- Action links: `$color-forest-light`, hover `$color-forest`

### Forms

- Inputs: `$color-white` background, border `#d1d5db`, focus border `$color-forest-light` + ring `rgba(74,123,90,0.15)`
- Primary button: `$color-forest` background, `$color-cream` text
- Secondary button: `$color-sand-light` background, `$color-forest` text
- Danger button: `$color-danger` background, white text
- **Publish button**: `$color-success` background, white text
- **Unpublish button**: `$color-warning` background, white text

### Dropzone (Upload)

- Dashed border `$color-sand`, hover border `$color-forest-light`
- Hover background: `rgba(74,123,90,0.04)`

### Photo Grid (Admin — Event Detail Photos Tab & Photo Manager)

- Same grid layout as current
- Cover photo badge: `$color-sand-light` background, `$color-forest` text
- Preview button (magnifying glass): `rgba(255,255,255,0.8)` background, `$color-forest` icon, hover `$color-white` background
- Selection checkboxes: `$color-forest-light` when checked
- Delete actions: `$color-danger` text
- Admin lightbox: same as public lightbox (`rgba(27,58,45,0.85)` overlay) — no animation, just fade-in 0.15s

### Speed Tagger

- No layout changes (optimized for productivity)
- Color updates only: indicators in `$color-success` / `$color-sand`, controls background in `$color-forest`

### Status Badges

**Event statuses:**
- Published: light `$color-success` background, `$color-success` text
- Draft: light `$color-sand-light` background, `$color-sand` text
- Archived: light gray background, gray text

**Order statuses:**
- Paid/Delivered: light `$color-success` background, `$color-success` text
- Pending: light `$color-warning` background, `$color-warning` text

## Technical Implementation Notes

- **Font loading**: Add Inter via Google Fonts `<link>` in `index.html` with `display=swap`. Update `<title>` to "TrailShot".
- **SCSS structure**: All tokens defined in a `_tokens.scss` partial, imported into `styles.scss`. Animation mixins in `_animations.scss`.
- **Scroll reveal**: Lightweight IntersectionObserver utility in a shared Angular directive (`ScrollRevealDirective`), standalone, applied via `[scrollReveal]` attribute. Disabled when `prefers-reduced-motion: reduce`.
- **Navbar scroll behavior**: IntersectionObserver watching the hero section; when hero exits viewport, toggle `.navbar--scrolled` class. On pages without a hero (events list, admin), navbar uses `$glass-nav` permanently.
- **Glass-morphism fallback**: For browsers without `backdrop-filter` support, fall back to solid semi-transparent backgrounds (same colors, no blur).
- **Hero photo**: Served as a static asset. A default landscape photo is bundled. Future: admin can upload event-specific hero photos (out of scope for this redesign).
- **Accessibility**: All animations respect `prefers-reduced-motion: reduce`. Color contrast ratios verified for WCAG AA on all text/background combinations.
- **Mobile**: Disable parallax on mobile. Add hamburger menu for navbar. Photo grids reduce to fewer columns. Sticky cart bar stacks vertically on small screens.
- **Loading states**: Spinner/loading indicators use `$color-forest-light`. "Traitement en cours" text in `$color-text-muted`.
