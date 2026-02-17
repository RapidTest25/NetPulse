# Cloudflare Cache Rules — NetPulse

## Rule 1: Cache static assets aggressively

- **Match**: `*.css, *.js, *.png, *.jpg, *.webp, *.svg, *.woff2`
- **Edge TTL**: 1 year
- **Browser TTL**: 1 month

## Rule 2: Cache API responses with short TTL

- **Match**: `GET /posts, GET /categories, GET /tags`
- **Edge TTL**: 60 seconds
- **Browser TTL**: 30 seconds
- **Cache Key**: Include query string

## Rule 3: Do NOT cache admin endpoints

- **Match**: `/admin/*, /auth/*`
- **Action**: Bypass cache

## Rule 4: Cache search with very short TTL

- **Match**: `GET /search, GET /search/suggest`
- **Edge TTL**: 30 seconds
- **Action**: Cache with query string in key

## Purge Strategy

- On publish/unpublish: Purge by tag `posts`
- On settings change: Purge everything
- API provides a webhook to trigger Cloudflare purge
