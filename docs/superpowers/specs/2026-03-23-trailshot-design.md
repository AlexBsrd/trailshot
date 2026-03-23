# TrailShot — Design Spec

**Date:** 2026-03-23
**Domain:** trailshot.fr
**Stack:** Angular (SSR ciblé) + NestJS + PostgreSQL + S3-compatible

## Overview

TrailShot is a solo-photographer platform for selling trail running race photos. Runners find their photos by bib number and purchase individual photos or packs. Event organizers can sponsor free events where photos are available at no cost.

The site prioritizes a frictionless runner experience (no account required) while providing the photographer with an efficient post-race workflow (batch upload + speed tagging).

## Data Model

### EVENT

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | varchar | |
| slug | varchar | Unique, URL-friendly |
| date | date | |
| location | varchar | |
| description | text | Nullable |
| cover_photo_id | uuid | FK → PHOTO, nullable |
| price_single | integer | Cents. Ignored if is_free |
| price_pack | integer | Cents. Ignored if is_free |
| is_free | boolean | Default false. Enables free download, no watermark |
| is_published | boolean | Default false. Hidden from public until true |
| created_at | timestamptz | |

### PHOTO

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_id | uuid | FK → EVENT |
| original_key | varchar | S3 path. Never publicly exposed |
| preview_key | varchar | S3 path. Reduced res, watermarked if event is paid |
| thumbnail_key | varchar | S3 path. Small grid thumbnail |
| width | integer | Original dimensions |
| height | integer | Original dimensions |
| sort_order | integer | Display ordering within event (set to upload order by default) |
| uploaded_at | timestamptz | |

### PHOTO_BIB

| Column | Type | Notes |
|--------|------|-------|
| photo_id | uuid | FK → PHOTO, part of composite PK |
| bib_number | varchar | Part of composite PK |

**Indexes:**
- PK: `(photo_id, bib_number)`
- `(event_id, bib_number)` — for fast bib search within an event (requires join through PHOTO or denormalized event_id)

> **Note:** To avoid a join on every bib search, `event_id` is denormalized into PHOTO_BIB. The alternative (join through PHOTO) is acceptable at the expected scale but denormalization makes the query trivial.

### ORDER

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_id | uuid | FK → EVENT |
| email | varchar | Runner's email for confirmation |
| status | varchar | `pending` / `paid` / `delivered` |
| total_cents | integer | 0 for free events |
| is_pack | boolean | Whether this is a pack purchase |
| download_token | varchar | Unique token for download URL |
| download_expires_at | timestamptz | Default: created_at + 30 days |
| created_at | timestamptz | |

> **Future:** Add `stripe_session_id` (varchar, nullable) when integrating Stripe.

### ORDER_PHOTO

| Column | Type | Notes |
|--------|------|-------|
| order_id | uuid | FK → ORDER, part of composite PK |
| photo_id | uuid | FK → PHOTO, part of composite PK |

## Architecture

### Stack

- **Frontend:** Angular 17+ with SSR (Angular Universal) on public pages, CSR on admin pages
- **Backend:** NestJS (REST API, modular architecture)
- **Database:** PostgreSQL
- **Storage:** S3-compatible (MinIO on Raspberry Pi for dev/initial prod → OVH S3 for scale)
- **Image processing:** Sharp (Node.js)

### Modules (NestJS)

- **EventsModule** — CRUD events, public listing
- **PhotosModule** — Upload, processing, serving previews/thumbnails
- **BibModule** — Bib tagging, bib search
- **OrdersModule** — Order creation, download token management
- **AuthModule** — Single admin account, JWT-based
- **StorageModule** — S3 abstraction (works with MinIO and OVH S3)
- **ImageProcessingModule** — Sharp-based resize, watermark, thumbnail generation

### SSR Strategy

- **SSR (public pages):** `/`, `/events`, `/events/:slug`, `/about` — for SEO and social sharing
- **CSR (admin pages):** `/admin/*` — no SEO needed, simpler development

## Pages & Routes

### Public (SSR)

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero, search bar (bib + event selector), recent events grid |
| `/events` | All events — search by name, grid with "Gratuit" badge on free events |
| `/events/:slug` | Event page — banner, bib search, photo grid, pricing info |
| `/events/:slug?bib=123` | Bib results — filtered photos, pack CTA, individual selection |
| `/events/:slug/photos/:id` | Photo detail — large preview (watermarked if paid), buy/download buttons |
| `/order` | Order page — photo recap, email, total, download button |
| `/about` | Photographer bio, gear, social links |

### Admin (CSR)

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard / login |
| `/admin/events` | Event list — CRUD, publish toggle |
| `/admin/events/:id` | Edit event — details, pricing, is_free, upload photos |
| `/admin/events/:id/tagger` | Speed Tagger — full-screen photo view, bib input, keyboard navigation |
| `/admin/orders` | Order list — status, email, details, stats |

## Image Processing Pipeline

### On Upload (batch, via admin)

For each uploaded photo:

1. **Store original** → `s3://bucket/originals/{event_id}/{photo_uuid}.jpg`
   - Never publicly accessible
2. **Generate thumbnail** (Sharp) → `s3://bucket/thumbnails/{event_id}/{photo_uuid}.jpg`
   - Max width: 400px
   - Quality: 80%
3. **Generate preview** (Sharp) → `s3://bucket/previews/{event_id}/{photo_uuid}.jpg`
   - Max width: 1200px
   - Quality: 85%
   - If `event.is_free = false`: apply tiled watermark overlay ("TRAILSHOT" repeated across entire surface, rotated -25°)
   - If `event.is_free = true`: no watermark

### Watermark Specification

- Text: "TRAILSHOT"
- Pattern: tiled/repeated across the entire image surface
- Rotation: -25°
- Opacity: ~15-20% (visible but doesn't completely obscure the photo)
- Coverage: full surface — no area left uncovered to prevent AI removal

### On Download (order fulfilled)

- Generate signed download URL pointing to original file
- URL authenticated via `download_token` on the ORDER (not a raw S3 presigned URL)
- Token valid for 30 days from order creation
- API endpoint: `GET /api/orders/:id/download?token=xxx`
  - Validates token + expiration
  - Generates short-lived S3 presigned URL (5 minutes) and redirects
- Multiple photos: stream as ZIP (no temp file, using archiver stream)

## Key User Flows

### Runner: Find & Buy Photos

1. Arrives on homepage (via Google, or link shared by race organizer)
2. Enters bib number + selects event → redirected to filtered results
3. Sees their photos (watermarked previews if paid event)
4. Selects individual photos OR clicks "Pack" button
5. Goes to order page → enters email → clicks download
6. For free events: immediate download, order logged at 0€
7. For paid events (future): Stripe checkout → on payment success → download enabled
8. (Future) Receives confirmation email with download link (valid 30 days) — email service is out of scope for v1; download link is shown directly in the browser after order

### Photographer: Post-Race Workflow

1. Lightroom: edit photos, apply preset batch, export JPGs
2. Admin: create event (name, date, location, pricing or free)
3. Admin: batch upload exported JPGs → processing runs (thumbnails, previews, watermarks)
4. Admin: open Speed Tagger
   - Photo displayed full-screen
   - Type bib number(s), comma-separated for multiple runners
   - Press Enter to validate and advance to next photo
   - Press Enter on empty field → reuses last bib number(s)
   - Arrow keys ← → to navigate manually
   - Thumbnail strip shows progress (tagged/current/remaining)
5. Admin: toggle `is_published` → event goes live
6. Share link with race organizer for distribution

## Monetization Model

### Pricing

- **Per-event pricing:** photographer sets `price_single` and `price_pack` when creating an event
- **Pack definition:** a pack is all photos matching the runner's bib number within a given event
- **Pack discount:** pack price always less than (number of runner's photos × single price)
- **Free events:** `is_free = true` — all photos downloadable at no cost, orders logged at 0€ for analytics
- **Organizer-sponsored events:** organizer pays photographer directly (offline), photographer marks event as free

### Analytics (via orders table)

All downloads are tracked as orders (including free), enabling:
- Download count per event
- Most downloaded photos
- Revenue per event
- Conversion rate (views → orders)
- Data to justify pricing for organizer sponsorships

### Future: Payment Integration

- Add Stripe Checkout
- `stripe_session_id` on ORDER
- Webhook handler: on `checkout.session.completed` → set order status to `paid`, enable download
- Free events bypass Stripe entirely

## Authentication

Single admin account (the photographer):
- JWT-based auth
- Login page at `/admin`
- Auth guard on all `/api/admin/*` endpoints
- No user accounts — runners are anonymous

## Tech Constraints & Decisions

| Decision | Rationale |
|----------|-----------|
| S3-compatible from day one | Allows seamless migration from MinIO (Raspberry Pi) to OVH S3 |
| Prices in cents (integer) | Avoids floating-point rounding errors |
| Watermark tiled across full surface | Prevents AI-based watermark removal |
| Download via token, not raw S3 URL | S3 presigned URLs max out at 7 days; token allows 30-day validity |
| Order for free events (0€) | Enables analytics and justifies organizer pricing |
| SSR only on public pages | SEO where it matters, simpler admin development |
| Sharp for image processing | Performant Node.js library, no external service dependency |
| Denormalized event_id in PHOTO_BIB | Trivial bib search query without join |
