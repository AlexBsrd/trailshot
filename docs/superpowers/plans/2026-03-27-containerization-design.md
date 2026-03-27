# Containerization Design

## Summary

Containerize the frontend (Angular SSR) and API (NestJS) with Docker Compose profiles (`dev` and `prod`).

## Decisions

- **Dev profile**: hot-reload via volume mounts (`nest start --watch`, `ng serve --host 0.0.0.0`)
- **Prod profile**: multi-stage built images + Caddy reverse proxy
- **Reverse proxy**: Caddy (automatic HTTPS via Let's Encrypt in prod)
- **Multi-stage Dockerfiles**: `dev` → `build` → `prod` targets in each Dockerfile

## Dependency cleanup (API)

| Change | Reason |
|---|---|
| `class-validator` `^0.15.1` → `^0.14.4` | Incompatible with `@nestjs/mapped-types@2.1.0` |
| `@types/pdfkit` deps → devDeps | Type package belongs in devDependencies |
| Remove `@types/sharp` | Stub — sharp ships its own types |
| Remove `@types/uuid` | Stub — uuid ships its own types |
| Remove `ts-loader` | Never used (NestJS uses tsc) |
| Remove `source-map-support` | Never imported |
| `ts-jest` `^29.2.5` → `^29.4.6` | Latest compatible with jest 30 |

Then delete `node_modules` + `package-lock.json` on both sides and run clean `npm install` (no `--legacy-peer-deps`).

## Files to create/modify

| File | Action |
|---|---|
| `api/package.json` | Fix dependencies |
| `api/Dockerfile` | Create (multi-stage: dev/build/prod) |
| `web/Dockerfile` | Create (multi-stage: dev/build/prod) |
| `api/.dockerignore` | Create |
| `web/.dockerignore` | Create |
| `docker-compose.yml` | Rewrite with profiles |
| `Caddyfile` | Create (prod reverse proxy) |

## docker-compose profiles

### Infrastructure (no profile — always active)

- `postgres`: PostgreSQL 16 on port 5434
- `minio` + `minio-init`: S3-compatible storage on ports 9000/9001

### Dev profile (`docker compose --profile dev up`)

- `api-dev`: builds `dev` target, mounts `./api/src` + config files, port 3000
- `web-dev`: builds `dev` target, mounts `./web/src` + config files, port 4200

### Prod profile (`docker compose --profile prod up --build`)

- `api`: builds `prod` target, no exposed port (internal only)
- `web`: builds `prod` target, SSR on port 4000 (internal)
- `caddy`: reverse proxy on ports 80/443, routes `/api/*` → api, `/storage/*` → minio, rest → web

## Caddyfile routing

- `trailshot.fr` with automatic HTTPS
- `/api/*` → `api:3000`
- `/storage/*` → `minio:9000` (strip prefix, forward Host header)
- `*` → `web:4000` (Angular SSR)
