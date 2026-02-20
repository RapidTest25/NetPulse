# ADR-0001: Technology Stack

## Status: Accepted

## Context

We need a tech stack for a blog platform focused on networking/internet topics,
with strong SEO, multi-author support, and production readiness.

## Decision

- **Frontend**: Next.js 15 (App Router) — SSG/ISR for SEO, React ecosystem
- **Backend**: Go with Chi router — performance, simplicity, stdlib compatibility
- **Database**: PostgreSQL 16 — full-text search, reliability, ACID
- **Cache**: Redis 7 — rate limiting, caching, session storage
- **CDN**: Cloudflare — WAF, CDN, DDoS protection, free tier available

## Consequences

- Monorepo structure with clear separation of concerns
- Two runtime languages (TypeScript + Go) — team must know both
- PostgreSQL FTS sufficient for Phase 1, upgrade path to Meilisearch for Phase 2
