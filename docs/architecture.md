# NetPulse — Architecture

## Overview

NetPulse is a monorepo blog platform built with:

- **Frontend**: Next.js 15 (App Router) with SSG/ISR for public pages, SPA for admin
- **Backend**: Go REST API with Chi router
- **Database**: PostgreSQL 16 with full-text search
- **Cache**: Redis 7 for caching and rate limiting
- **CDN/Edge**: Cloudflare for WAF, CDN caching, and DDoS protection

## Request Flow

```
User → Cloudflare CDN → Nginx (optional) → Next.js / Go API → PostgreSQL / Redis
```

### Public Pages

1. User requests a page (e.g., `/posts/dns-explained`)
2. Cloudflare checks cache → if HIT, serve directly
3. If MISS, forward to Next.js
4. Next.js renders via ISR, calls Go API internally
5. Go API queries PostgreSQL, caches result in Redis
6. Response flows back through CDN (cached for next request)

### Admin Operations

1. Admin authenticates via `/auth/login` → receives JWT pair
2. Admin panel (SPA) makes API calls with `Authorization: Bearer <token>`
3. Go API validates JWT, checks RBAC, processes request
4. Audit log entry created for every write operation

## Key Design Decisions

1. **JWT over Sessions**: Stateless auth, easier to scale horizontally
2. **Chi Router over Echo/Fiber**: Stdlib-compatible, minimal dependencies
3. **PostgreSQL FTS over Elasticsearch**: Simpler for Phase 1, sufficient for blog scale
4. **ISR over SSR**: Better performance, CDN-friendly, SEO-equivalent
5. **Monorepo**: Single source of truth, easier CI/CD

## Security Layers

1. **Cloudflare WAF**: Bot protection, rate limiting (first layer)
2. **Nginx**: Reverse proxy, header enforcement
3. **Go Middleware**: Auth, RBAC, rate limiting (Redis), security headers
4. **Application**: Input validation, parameterized queries, audit logging
5. **Database**: Constraints, row-level security (future)
