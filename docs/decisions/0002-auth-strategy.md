# ADR-0002: Authentication Strategy

## Status: Accepted

## Context

Need authentication for admin panel with multi-role support.
Must be secure, scalable, and not overly complex for MVP.

## Decision

- **Method**: JWT (access + refresh token pair)
- **Access Token**: 15 minute expiry, HS256, contains user_id and role
- **Refresh Token**: 30 day expiry, rotated on use
- **Password**: bcrypt (cost 12), with planned Argon2id migration
- **Storage**: Client-side (localStorage for SPA admin panel)
- **2FA**: TOTP for admin accounts (Phase 2)

## Alternatives Considered

1. **Session-based**: Simpler but harder to scale horizontally
2. **OAuth/OIDC**: Overkill for internal admin tool
3. **Paseto**: Good but less ecosystem support than JWT

## Consequences

- Stateless auth enables horizontal scaling
- Token refresh complexity handled by frontend `authFetch` wrapper
- No server-side session store needed (simplifies infra)
- Must handle token blacklisting for logout (Redis, Phase 2)
