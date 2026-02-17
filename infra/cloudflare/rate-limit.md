# Cloudflare Rate Limiting — NetPulse

## Tier 1: Login/Auth endpoints

- **Path**: `/auth/login`, `/auth/refresh`
- **Limit**: 10 requests per minute per IP
- **Action**: Block for 60 seconds
- **Priority**: High

## Tier 2: Admin API

- **Path**: `/admin/*`
- **Limit**: 30 requests per minute per IP
- **Action**: Challenge
- **Priority**: Medium

## Tier 3: Public API

- **Path**: `/posts`, `/categories`, `/tags`
- **Limit**: 60 requests per minute per IP
- **Action**: Challenge
- **Priority**: Low

## Tier 4: Search

- **Path**: `/search`, `/search/suggest`
- **Limit**: 30 requests per minute per IP
- **Action**: Challenge
- **Priority**: Medium

## Notes

- These are in addition to application-level rate limiting via Go middleware
- Cloudflare rate limiting is the first layer of defense
- Application rate limiting (Redis-backed) is the second layer
