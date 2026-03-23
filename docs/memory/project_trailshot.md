---
name: project_trailshot
description: TrailShot - trail running photo sales platform at /home/alex/dev/trailshot
type: project
---

TrailShot (trailshot.fr) — solo photographer platform for selling trail running race photos. Runners search by bib number, buy individual photos or packs.

**Stack:** Angular 17+ (SSR on public, CSR on admin) + NestJS + PostgreSQL + S3-compatible (MinIO → OVH S3)

**Key decisions:**
- Mono-photographer (no multi-tenant)
- No user accounts for runners (frictionless)
- Tiled watermark across full surface (anti-AI removal)
- Download tokens valid 30 days (workaround for S3 7-day presigned URL limit)
- Orders logged even for free events (0€) for analytics
- Event `is_free` flag for organizer-sponsored events
- Prices in cents (integer)

**Status as of 2026-03-23:** Spec and implementation plan written. 16 tasks ready for execution. No code yet.
- Spec: `docs/superpowers/specs/2026-03-23-trailshot-design.md`
- Plan: `docs/superpowers/plans/2026-03-23-trailshot-implementation.md`
