# Outdoor Premium Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the entire TrailShot frontend from generic blue/gray to an "Outdoor Premium" visual identity (forest green + sand palette, Inter font, glass-morphism, subtle animations) while preserving all existing functionality.

**Architecture:** Design tokens in SCSS partials (`_tokens.scss`, `_animations.scss`) imported globally via `stylePreprocessorOptions.includePaths` in `angular.json`. A `ScrollRevealDirective` for viewport-triggered animations (SSR-safe). All components use inline styles/templates — each component's `styles` array will be updated in-place, using `@use 'tokens' as *` and `@use 'animations' as *` to access tokens/mixins. No external CSS framework.

**Tech Stack:** Angular 21 (standalone components, inline styles/templates), SCSS, Google Fonts (Inter)

**Spec:** `docs/superpowers/specs/2026-03-26-trailshot-redesign-outdoor-premium.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `web/src/styles/_tokens.scss` | All design tokens (colors, typography, spacing, breakpoints, shadows) |
| `web/src/styles/_animations.scss` | Animation mixins (`fade-in-up`, `hover-lift`, `glass`) + `.scroll-reveal` class + `prefers-reduced-motion` |
| `web/src/app/shared/directives/scroll-reveal.directive.ts` | Standalone Angular directive using IntersectionObserver for viewport fade-in |
| `web/public/images/hero-default.jpg` | Default hero landscape photo (trail/mountain) |

### Modified Files

| File | What Changes |
|------|-------------|
| `web/angular.json` | Add `stylePreprocessorOptions.includePaths: ["src/styles"]` for SCSS partials |
| `web/src/index.html` | Add Inter font `<link>`, update `<title>` |
| `web/src/styles.scss` | Import partials, rewrite global classes (`.input`, `.btn-*`, `.badge-*`) with new tokens |
| `web/src/app/app.ts` | Update footer styles with new palette |
| `web/src/app/layout/navbar/navbar.component.ts` | Full restyle: transparent→glass scroll, new palette, mobile hamburger menu |
| `web/src/app/public/home/home.component.ts` | Hero: photo background + glass search + parallax + fade-in. Event cards: new palette + hover-lift |
| `web/src/app/public/events/events.component.ts` | New palette, input styling, scroll-reveal on cards |
| `web/src/app/public/event-detail/event-detail.component.ts` | Filter zone glass, photo grid, price overlay, sticky bar, lightbox |
| `web/src/app/public/photo-detail/photo-detail.component.ts` | New palette, bib tags, action button |
| `web/src/app/public/order/order.component.ts` | Three states restyled with new palette |
| `web/src/app/public/about/about.component.ts` | Mini hero + new palette |
| `web/src/app/admin/layout/admin-layout.component.ts` | Sidebar forest palette, active state |
| `web/src/app/admin/login/login.component.ts` | Card on cream background, forest palette |
| `web/src/app/admin/events/event-list/event-list.component.ts` | Table + badge restyling |
| `web/src/app/admin/events/event-detail-admin/event-detail-admin.component.ts` | Tabs, forms, photo grid, dropzone, lightbox, publish buttons |
| `web/src/app/admin/events/event-form/event-form.component.ts` | Form input/button restyling |
| `web/src/app/admin/orders/order-list/order-list.component.ts` | Stat cards, table, order badges |
| `web/src/app/admin/photos/photo-upload/photo-upload.component.ts` | Dropzone + progress restyling |
| `web/src/app/admin/photos/photo-manager/photo-manager.component.ts` | Photo grid, lightbox, toolbar |
| `web/src/app/admin/photos/speed-tagger/speed-tagger.component.ts` | Color-only updates |

---

## Task 1: Design Tokens & Global Styles Foundation

**Files:**
- Create: `web/src/styles/_tokens.scss`
- Create: `web/src/styles/_animations.scss`
- Modify: `web/src/styles.scss`
- Modify: `web/src/index.html`
- Modify: `web/angular.json`

- [ ] **Step 1: Create `_tokens.scss`**

```scss
// Colors
$color-forest: #1B3A2D;
$color-forest-light: #4A7B5A;
$color-sand: #A68B5B;
$color-sand-light: #D4C5A0;
$color-cream: #FAF7F2;
$color-white: #FFFFFF;
$color-text: #2D4F3E;
$color-text-muted: #7A8B7E;
$color-success: #3A7D4A;
$color-warning: #C4963A;
$color-danger: #B84040;

// Typography
$font-family: 'Inter', system-ui, sans-serif;
$font-heading-weight: 800;
$font-subheading-weight: 700;
$font-body-weight: 400;
$font-size-hero: 2.5rem;
$font-size-h1: 1.5rem;
$font-size-h2: 1.25rem;
$font-size-body: 0.95rem;
$font-size-small: 0.85rem;
$font-size-xs: 0.75rem;

// Spacing & Radius
$radius-sm: 6px;
$radius-md: 10px;
$radius-lg: 16px;
$shadow-card: 0 2px 8px rgba(27, 58, 45, 0.08);
$shadow-elevated: 0 8px 24px rgba(27, 58, 45, 0.12);

// Breakpoints
$breakpoint-sm: 640px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;

// Glass-morphism
$glass-dark-bg: rgba(27, 58, 45, 0.65);
$glass-dark-blur: blur(16px);
$glass-light-bg: rgba(255, 255, 255, 0.12);
$glass-light-blur: blur(12px);
$glass-nav-bg: rgba(27, 58, 45, 0.85);
$glass-nav-blur: blur(12px);
```

- [ ] **Step 2: Create `_animations.scss`**

```scss
@use 'tokens' as *;

@mixin fade-in-up {
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  animation: fadeInUp 0.6s ease-out both;
}

@mixin hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-3px);
    box-shadow: $shadow-elevated;
  }
}

@mixin glass($variant: 'dark') {
  // Solid fallback for browsers without backdrop-filter
  @if $variant == 'dark' {
    background: $glass-dark-bg;
  } @else if $variant == 'light' {
    background: $glass-light-bg;
  } @else if $variant == 'nav' {
    background: $glass-nav-bg;
  }

  @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
    @if $variant == 'dark' {
      backdrop-filter: $glass-dark-blur;
      -webkit-backdrop-filter: $glass-dark-blur;
    } @else if $variant == 'light' {
      backdrop-filter: $glass-light-blur;
      -webkit-backdrop-filter: $glass-light-blur;
    } @else if $variant == 'nav' {
      backdrop-filter: $glass-nav-blur;
      -webkit-backdrop-filter: $glass-nav-blur;
    }
  }
}

.scroll-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;

  &.revealed {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }

  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Add `stylePreprocessorOptions` to `angular.json`**

In `angular.json`, under `projects > web > architect > build > options`, add:
```json
"stylePreprocessorOptions": {
  "includePaths": ["src/styles"]
}
```
This allows all inline component SCSS to use `@use 'tokens' as *` and `@use 'animations' as *` without relative paths.

- [ ] **Step 4: Rewrite `styles.scss` to import partials and update global classes**

Rewrite the entire file. Start with:
```scss
@use 'tokens' as *;
@use 'animations';
```
Replace all hardcoded colors with token references. Update `.input`, `.btn`, `.btn-primary`, `.btn-secondary`, `.badge`, `.badge-free` classes. Add `.btn-danger`, `.btn-publish`, `.btn-unpublish`, `.badge-published`, `.badge-pack`, `.badge-draft`, `.badge-archived`, `.badge-paid`, `.badge-pending` classes.

Loading state styles: spinner/loader color uses `$color-forest-light`. "Traitement en cours" text uses `$color-text-muted`.

- [ ] **Step 5: Update `index.html`**

Add Inter font link in `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet">
```
Update `<title>` to `TrailShot`.

- [ ] **Step 6: Verify the app compiles**

Run: `cd web && npx ng build --configuration=development 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add web/src/styles/ web/src/styles.scss web/src/index.html web/angular.json
git commit -m "feat: add outdoor premium design tokens and global styles"
```

---

## Task 2: ScrollReveal Directive

**Files:**
- Create: `web/src/app/shared/directives/scroll-reveal.directive.ts`

- [ ] **Step 1: Create the directive**

```typescript
import { Directive, ElementRef, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[scrollReveal]',
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  private observer?: IntersectionObserver;
  private platformId = inject(PLATFORM_ID);

  constructor(private el: ElementRef) {}

  ngOnInit() {
    // Skip on server (SSR) — elements render visible by default
    if (!isPlatformBrowser(this.platformId)) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.el.nativeElement.classList.add('revealed');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            this.observer?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    this.el.nativeElement.classList.add('scroll-reveal');
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
```

- [ ] **Step 2: Verify build**

Run: `cd web && npx ng build --configuration=development 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/shared/directives/scroll-reveal.directive.ts
git commit -m "feat: add ScrollRevealDirective for viewport-triggered animations"
```

---

## Important: Using Tokens in Inline Component Styles

Every component uses inline SCSS (`styles: [...]`). To use design tokens and animation mixins, add these imports at the top of each component's inline style string:

```scss
@use 'tokens' as *;
@use 'animations' as *;
```

This works because `angular.json` has `stylePreprocessorOptions.includePaths: ["src/styles"]` (configured in Task 1).

---

## Task 3: App Shell — Footer

**Files:**
- Modify: `web/src/app/app.ts` (lines 16-40 — footer template + styles)

- [ ] **Step 1: Update footer template and styles**

Replace the current footer template and inline styles. Remove `border-top`. Apply:
- Background: `$color-forest`, padding: 1.5rem 2rem
- Text: `$color-cream` at opacity 0.7, `$font-size-small`
- Links: `$color-cream` at opacity 0.7, hover opacity 1, transition 0.2s
- Keep the dynamic year calculation

- [ ] **Step 2: Verify visually**

Run: `cd web && npx ng serve` and check footer at bottom of any page.
Expected: Dark green footer with cream text.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/app.ts
git commit -m "feat: restyle footer with outdoor premium palette"
```

---

## Task 4: Navbar — Transparent-to-Glass Scroll + Mobile Menu

**Files:**
- Modify: `web/src/app/layout/navbar/navbar.component.ts` (full file, 55 lines)

This is a significant rework. The navbar needs:
1. Transparent by default (positioned over hero content)
2. Transition to `glass-nav` on scroll (IntersectionObserver)
3. Logo in cream, `TRAIL` + `SHOT` both cream (no more blue accent)
4. Mobile hamburger menu (< 768px)

- [ ] **Step 1: Rewrite navbar component**

Update the template:
- Add `position: fixed; top: 0; width: 100%; z-index: 200` to navbar
- Add class binding: `[class.navbar--scrolled]="isScrolled"`
- Add hamburger button (visible < $breakpoint-md): three-line icon, toggles mobile menu
- Add mobile menu overlay (off-canvas from right, 0.3s slide, z-index 300)
- Update logo: both parts in cream, letter-spacing 1.5px
- Cart badge: `$color-sand-light` bg, `$color-forest` text

Update the styles:
- `.navbar`: transparent background, transition 0.3s
- `.navbar--scrolled`: `glass-nav` mixin, `$shadow-card`
- Nav links: cream, opacity 0.8 → 1 hover
- Mobile: hamburger icon, off-canvas panel, backdrop overlay

Update the component class:
- Add `isScrolled = false` signal
- Add `mobileMenuOpen = false` signal
- `ngOnInit`: set up IntersectionObserver on a sentinel element or use scroll listener
- `ngAfterViewInit`: observe hero section if present, else set scrolled immediately

- [ ] **Step 2: Add padding-top to pages to account for fixed navbar**

Since navbar is now `position: fixed`, the page content needs `padding-top` equal to the navbar height (~64px). Add this to the global styles or the app component's `<main>` wrapper.

- [ ] **Step 3: Verify**

Run dev server. Check:
- Home page: navbar transparent over hero, becomes glass on scroll
- Events list page (no hero): navbar is glass immediately
- Mobile viewport: hamburger icon, menu opens/closes

- [ ] **Step 4: Commit**

```bash
git add web/src/app/layout/navbar/navbar.component.ts web/src/app/app.ts
git commit -m "feat: restyle navbar with glass scroll effect and mobile hamburger"
```

---

## Task 5: Hero Photo Asset

**Files:**
- Create: `web/public/images/hero-default.jpg`

- [ ] **Step 1: Add a default hero landscape photo**

Download a royalty-free trail/mountain landscape photo (e.g., from Unsplash) and save it to `web/public/images/hero-default.jpg`. Optimize to ~200-300KB, landscape orientation, minimum 1920px wide.

If no internet access, create a placeholder and add a TODO comment in the home component.

- [ ] **Step 2: Commit**

```bash
git add web/public/images/hero-default.jpg
git commit -m "feat: add default hero landscape photo"
```

---

## Task 6: Home Page — Hero + Event Cards

**Files:**
- Modify: `web/src/app/public/home/home.component.ts` (full file, 122 lines)

- [ ] **Step 1: Rewrite hero section template + styles**

Hero changes:
- Background: `url('/images/hero-default.jpg')` with `background-size: cover`, `background-position: center`, `background-attachment: fixed`
- Overlay: `linear-gradient(to bottom, rgba(27,58,45,0.3), rgba(27,58,45,0.7))` via `::before` pseudo-element
- Height: 70vh (50vh on mobile)
- Content centered with `fade-in-up` animation
- Search form: glass container wrapping the `<select>`, bib `<input>`, and submit `<button>`
- Custom-styled `<select>`: `appearance: none`, glass background, cream text, custom arrow
- Disable parallax on mobile via `@media (max-width: $breakpoint-md)` — set `background-attachment: scroll`
- Disable parallax on `prefers-reduced-motion`

- [ ] **Step 2: Rewrite event cards template + styles**

- Cards: white bg, `$radius-lg`, `$shadow-card`
- Cover image: 16:9, gradient overlay at bottom. Fallback gradient: `$color-forest` → `$color-forest-light`
- Title: Inter 700, `$color-forest`
- Metadata: `$color-sand`, `$font-size-small`
- Badge: `.badge-free` (from global styles). Note: `.badge-pack` is only used on the order page, not on event card listings.
- Hover: `hover-lift` mixin
- Add `scrollReveal` directive to each card. Import `ScrollRevealDirective` in the component.

- [ ] **Step 3: Verify**

- Hero: full-bleed photo, glass search, parallax on scroll, fade-in on load
- Cards: new palette, hover lift, scroll-reveal animation

- [ ] **Step 4: Commit**

```bash
git add web/src/app/public/home/home.component.ts
git commit -m "feat: restyle home page with hero photo and outdoor premium palette"
```

---

## Task 7: Events List Page

**Files:**
- Modify: `web/src/app/public/events/events.component.ts` (90 lines)

- [ ] **Step 1: Update styles**

- Page background: `$color-cream`
- Heading: Inter 800, `$color-forest`
- Search input: white bg, forest-light focus border + ring
- Cards grid: same as home, `repeat(auto-fill, minmax(280px, 1fr))`
- Event cards: same styling as home (reuse global card pattern or duplicate inline — inline is fine since components are separate)
- Empty state: centered `$color-text-muted` text
- Add `scrollReveal` to cards. Import `ScrollRevealDirective`.

- [ ] **Step 2: Verify**

Check events list page renders with new palette and cards match home page styling.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/public/events/events.component.ts
git commit -m "feat: restyle events list page with outdoor premium palette"
```

---

## Task 8: Event Detail — Filter Zone, Photo Grid, Sticky Bar, Lightbox

**Files:**
- Modify: `web/src/app/public/event-detail/event-detail.component.ts` (338 lines — largest public component)

This is the most complex component. Break into sub-steps.

- [ ] **Step 1: Update event header + filter zone**

- Event header: `$color-forest` title, `$color-sand` metadata
- Filter zone: event cover photo as background (blurred), `$glass-dark` overlay, glass-styled input + button
- Pack CTA banner: `$color-forest` bg, cream text, sand-light CTA button, muted strikethrough price

- [ ] **Step 2: Update photo grid styles**

- Grid: `repeat(auto-fill, minmax(220px, 1fr))`, gap 12px. Mobile (< `$breakpoint-sm`): `minmax(150px, 1fr)`
- Thumbnails: `$radius-sm`
- Price overlay: glass-dark bg, cream text, xs font, bottom-right
- Selected state: 3px `$color-sand-light` border + checkmark
- Hover: `scale(1.02)` + shadow
- Preview button: white bg semi-transparent, forest icon
- Add `scrollReveal` to grid sections

- [ ] **Step 3: Update sticky cart bar**

- `$glass-nav` background, cream text
- Layout: count | price (Inter 700, `$color-sand-light`) | "Commander" button (sand-light bg / forest text)
- Mobile (< `$breakpoint-sm`): stack vertically (count + price on one line, button full width below)

- [ ] **Step 4: Update lightbox**

- Overlay: `rgba(27,58,45,0.85)`
- Image: `$radius-sm`, max 90vw/90vh
- Close button: cream icon on `rgba(255,255,255,0.1)` circle
- Entry: fade-in 0.2s overlay + scale(0.95→1) image

- [ ] **Step 5: Verify all sub-sections**

Check event detail page: filter zone with glass, photo grid, selection, sticky bar, lightbox.

- [ ] **Step 6: Commit**

```bash
git add web/src/app/public/event-detail/event-detail.component.ts
git commit -m "feat: restyle event detail page with glass filter zone and outdoor premium palette"
```

---

## Task 9: Photo Detail Page

**Files:**
- Modify: `web/src/app/public/photo-detail/photo-detail.component.ts` (119 lines)

- [ ] **Step 1: Update styles**

- Background: `$color-cream`
- Back link: `$color-forest-light`, hover `$color-forest`, arrow icon
- Image container: centered, `$radius-md`, `$shadow-elevated`
- Bib tags: `$color-sand-light` bg, `$color-forest` text, `$radius-sm`, inline pills
- Action button: `$color-sand-light` bg / `$color-forest` text, full width on mobile

- [ ] **Step 2: Verify**

- [ ] **Step 3: Commit**

```bash
git add web/src/app/public/photo-detail/photo-detail.component.ts
git commit -m "feat: restyle photo detail page with outdoor premium palette"
```

---

## Task 10: Order Page

**Files:**
- Modify: `web/src/app/public/order/order.component.ts` (125 lines)

- [ ] **Step 1: Update styles for all three states**

**Empty cart:** centered `$color-text-muted` message, sand-light CTA button.
**Order form:** thumbnail grid, pack badge, email input (standard form style), price in Inter 700 `$color-forest`, large sand-light submit button.
**Success:** fade-in animation, `$color-success` icon, forest-light download link, muted expiration, secondary return CTA.

- [ ] **Step 2: Verify all three states**

- [ ] **Step 3: Commit**

```bash
git add web/src/app/public/order/order.component.ts
git commit -m "feat: restyle order page with outdoor premium palette"
```

---

## Task 11: About Page

**Files:**
- Modify: `web/src/app/public/about/about.component.ts` (27 lines)

- [ ] **Step 1: Add mini hero + update styles**

- Add a mini hero (30vh) with photo + forest overlay, same treatment as home
- Content: max-width 700px centered, `$color-text` on `$color-cream`

- [ ] **Step 2: Commit**

```bash
git add web/src/app/public/about/about.component.ts
git commit -m "feat: restyle about page with mini hero and outdoor premium palette"
```

---

## Task 12: Admin — Login Page

**Files:**
- Modify: `web/src/app/admin/login/login.component.ts` (75 lines)

- [ ] **Step 1: Update styles**

- Full page `$color-cream` background
- Centered card: white bg, `$shadow-elevated`, `$radius-lg`, max-width 400px
- Title: Inter 800, `$color-forest`
- Inputs: standard form input style (from global)
- Error: `$color-danger` text
- Submit: primary button (`$color-forest` bg / cream text), full width

- [ ] **Step 2: Commit**

```bash
git add web/src/app/admin/login/login.component.ts
git commit -m "feat: restyle admin login page with outdoor premium palette"
```

---

## Task 13: Admin — Sidebar Layout

**Files:**
- Modify: `web/src/app/admin/layout/admin-layout.component.ts` (103 lines)

- [ ] **Step 1: Update sidebar + content area styles**

- Sidebar: `$color-forest` bg, cream text
- Logo: same as navbar (TRAILSHOT, cream, letter-spacing)
- Active item: `rgba(255,255,255,0.1)` bg + 3px left border `$color-sand-light`
- Hover: `rgba(255,255,255,0.06)` bg
- Content area (`.admin-main`): `$color-cream` background
- Sidebar footer (logout): cream text, hover opacity

- [ ] **Step 2: Verify**

Admin sidebar renders with forest green, active state visible, content area has cream bg.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/admin/layout/admin-layout.component.ts
git commit -m "feat: restyle admin sidebar with outdoor premium palette"
```

---

## Task 14: Admin — Event List + Event Form

**Files:**
- Modify: `web/src/app/admin/events/event-list/event-list.component.ts` (111 lines)
- Modify: `web/src/app/admin/events/event-form/event-form.component.ts` (122 lines)

- [ ] **Step 1: Update event list styles**

- Table header: `rgba(27,58,45,0.05)` bg
- Alternating rows: white / cream
- Row hover: `rgba(166,139,91,0.08)`
- Action links: `$color-forest-light`, hover `$color-forest`
- Status badges: use global badge classes (`.badge-published`, etc.)
- "New event" button: primary style

- [ ] **Step 2: Update event form styles**

- Heading: Inter 800, `$color-forest`
- Form fields: standard input style (from global)
- Submit button: primary style
- Cancel link: `$color-text-muted`

- [ ] **Step 3: Commit**

```bash
git add web/src/app/admin/events/event-list/event-list.component.ts web/src/app/admin/events/event-form/event-form.component.ts
git commit -m "feat: restyle admin event list and form with outdoor premium palette"
```

---

## Task 15: Admin — Event Detail (Tabs, Forms, Photos, Upload, Lightbox)

**Files:**
- Modify: `web/src/app/admin/events/event-detail-admin/event-detail-admin.component.ts` (480 lines — largest file)

- [ ] **Step 1: Update tabs styling**

- Tab bar: bottom border `#d1d5db`
- Inactive tab: `$color-text-muted`
- Active tab: `$color-forest` text, 2px bottom border `$color-forest-light`
- Hover inactive: `$color-text`

- [ ] **Step 2: Update details form tab**

- Form inputs: standard global style
- Publish/unpublish buttons: `$color-success` / `$color-warning` bg
- Delete button: `$color-danger`

- [ ] **Step 3: Update photos tab**

- Toolbar: forest-light links
- Photo grid: forest palette
- Cover badge: `$color-sand-light` bg / `$color-forest` text
- Preview button: semi-transparent white bg, forest icon
- Selection: `$color-forest-light` checkbox

- [ ] **Step 4: Update upload tab**

- Dropzone: dashed `$color-sand` border, hover `$color-forest-light` border, hover bg `rgba(74,123,90,0.04)`
- Upload progress: `$color-forest-light`
- Success indicators: `$color-success`

- [ ] **Step 5: Update lightbox**

- Forest-tinted overlay `rgba(27,58,45,0.85)`, fade-in 0.15s

- [ ] **Step 6: Verify all tabs**

- [ ] **Step 7: Commit**

```bash
git add web/src/app/admin/events/event-detail-admin/event-detail-admin.component.ts
git commit -m "feat: restyle admin event detail with tabs, forms, and photo grid"
```

---

## Task 16: Admin — Orders

**Files:**
- Modify: `web/src/app/admin/orders/order-list/order-list.component.ts` (111 lines)

- [ ] **Step 1: Update styles**

- Stat cards: white bg, `$shadow-card`, values in `$color-forest` Inter 800, labels in `$color-sand`
- Table: same styling as event list table
- Order status badges: `.badge-paid`/`.badge-pending` from global styles

- [ ] **Step 2: Commit**

```bash
git add web/src/app/admin/orders/order-list/order-list.component.ts
git commit -m "feat: restyle admin orders page with outdoor premium palette"
```

---

## Task 17: Admin — Photo Upload & Photo Manager

**Files:**
- Modify: `web/src/app/admin/photos/photo-upload/photo-upload.component.ts` (145 lines)
- Modify: `web/src/app/admin/photos/photo-manager/photo-manager.component.ts` (263 lines)

- [ ] **Step 1: Update photo upload**

- Dropzone: same as event-detail-admin upload tab
- Progress: `$color-forest-light`
- Success state: `$color-success`

- [ ] **Step 2: Update photo manager**

- Header/toolbar: `$color-forest` headings, `$color-forest-light` action links
- Photo grid: forest palette, cover badge in sand-light
- Lightbox: forest overlay, fade-in 0.15s
- Empty state: `$color-text-muted`
- Delete actions: `$color-danger`

- [ ] **Step 3: Commit**

```bash
git add web/src/app/admin/photos/photo-upload/photo-upload.component.ts web/src/app/admin/photos/photo-manager/photo-manager.component.ts
git commit -m "feat: restyle admin photo upload and manager with outdoor premium palette"
```

---

## Task 18: Admin — Speed Tagger (Color-Only)

**Files:**
- Modify: `web/src/app/admin/photos/speed-tagger/speed-tagger.component.ts` (230 lines)

- [ ] **Step 1: Update color references only**

- No layout changes. Only update:
  - Header text: `$color-forest`
  - Progress indicators: `$color-success` (tagged), `$color-sand` (current)
  - Input focus: `$color-forest-light` border
  - Validate button: primary style
  - Thumbnail strip: `.current` uses `$color-sand-light` border, `.tagged` uses `$color-success` indicator
  - Background tones: `$color-cream` body, `$color-forest` controls

- [ ] **Step 2: Commit**

```bash
git add web/src/app/admin/photos/speed-tagger/speed-tagger.component.ts
git commit -m "feat: update speed tagger colors for outdoor premium palette"
```

---

## Task 19: Final Visual QA Pass

- [ ] **Step 1: Full walkthrough**

Start the dev server and navigate through every page/state:
1. Home page: hero photo, parallax, glass search, fade-in, event cards, hover, scroll-reveal
2. Events list: heading, search, grid, empty state
3. Event detail: filter zone glass, photo grid, price overlay, selection, sticky bar, lightbox, pack CTA
4. Photo detail: back link, image, bib tags, action button
5. Order: empty cart → form → success
6. About: mini hero
7. Admin login: centered card
8. Admin sidebar: forest, active state
9. Admin event list: table, badges
10. Admin event detail: all 3 tabs, publish/unpublish, lightbox
11. Admin event form: inputs, buttons
12. Admin orders: stats, table
13. Admin photo upload: dropzone
14. Admin photo manager: grid, lightbox
15. Admin speed tagger: colors
16. Mobile viewport: hamburger menu, responsive grids, no parallax

- [ ] **Step 2: Verify WCAG AA color contrast**

Check key text/background combinations meet 4.5:1 contrast ratio:
- `$color-text` (#2D4F3E) on `$color-cream` (#FAF7F2)
- `$color-cream` (#FAF7F2) on `$color-forest` (#1B3A2D)
- `$color-sand` (#A68B5B) on `$color-white` (#FFFFFF)
- `$color-forest` (#1B3A2D) on `$color-sand-light` (#D4C5A0) — button text on CTA

Use browser dev tools or an online contrast checker.

- [ ] **Step 3: Fix any visual inconsistencies found**

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: visual polish from QA pass"
```
