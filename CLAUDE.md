# TrailShot

Solo-photographer platform to sell trail-race photos. Runners search by bib number and buy
individual photos or packs; no runner accounts. Angular (SSR public / CSR admin) + NestJS +
PostgreSQL + S3 (MinIO). Prices in cents. See `docs/superpowers/specs/2026-03-23-trailshot-design.md`.

## Run

- Dev:  `docker compose --profile dev up`  → web http://localhost:4202, api :3000, MinIO console :9001
- Prod: copy `.env.example` → `.env` (set JWT_SECRET + ADMIN_PASSWORD), then
  `docker compose --profile prod up -d` (Caddy serves trailshot.fr, terminates TLS).

## Status (2026-07-21)

Works end-to-end for **free events**: upload → speed-tag → publish → runner finds by bib →
order (0€) → download (single photo streamed, or ZIP) + PDF receipt.

Recently fixed:
- Single-photo download now streams through the API (was returning JSON / an unreachable
  internal presigned URL). `orders.service.ts:streamPhoto`.
- Prod compose now has full S3/JWT/admin/mail env; the API fails fast in prod if JWT_SECRET /
  ADMIN_PASSWORD are missing or default (`main.ts`); Postgres & MinIO host ports bound to 127.0.0.1.

## Remaining before a real launch

1. **Payment — paid events are NOT fulfillable.** No Stripe, no "mark paid". A paid-event order
   stays `status: 'pending'` and download 403s forever (`orders.service.ts:loadValidOrder`), yet
   the UI still shows a (dead) download link after checkout. Options: Stripe Checkout + webhook
   (`checkout.session.completed` → set `paid`), or a lazy admin "mark paid" button as a stopgap.
   → **For a first test trail, use a free/sponsored event and this is a non-issue.**

2. **SSR data fetching is broken in prod.** `environment.apiUrl` is `/api` (relative). The dev
   proxy (`proxy.conf.js`) rewrites it, but the prod SSR server (`web/src/server.ts`) does NOT
   proxy `/api` or `/storage`, so server-side `fetch('/api/...')` has no host during render.
   Public pages will hydrate client-side but SSR/SEO won't work. Fix: make `server.ts` read
   `API_URL`/`STORAGE_URL` (already passed to the `web` prod service) and either proxy those
   paths or inject an absolute base for server-side HttpClient calls.

3. **Email not wired for real send.** Without `MAIL_HOST`, links are logged to console only; the
   admin "resend" does nothing. Email download link also falls back to `localhost` unless
   `API_URL` is set (it now is, in prod compose). Set MAIL_* in `.env` to enable.

4. **`synchronize: true`** (`app.module.ts`) auto-syncs schema — fine for a test, switch to
   TypeORM migrations before data you care about.

5. **Infra creds are compose defaults** (`trailshot_dev`, `minioadmin`). Ports are no longer
   internet-exposed, so acceptable for a first test; parameterize before a hardened deploy.
