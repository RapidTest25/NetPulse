# NetPulse — Security Documentation

## Authentication

- **Password Hashing**: bcrypt (cost 12), planned migration to Argon2id
- **JWT Tokens**:
  - Access token: 15 minutes, HS256
  - Refresh token: 30 days, HS256, rotated on use
- **Token Storage**: Client-side (localStorage for SPA, httpOnly cookie planned)

## Authorization (RBAC)

| Role   | Posts               | Users        | Settings | Audit |
| ------ | ------------------- | ------------ | -------- | ----- |
| OWNER  | Full control        | Full control | Edit     | View  |
| ADMIN  | Full control        | Full control | Edit     | View  |
| EDITOR | Create/Edit/Publish | —            | —        | —     |
| AUTHOR | Create/Edit own     | —            | —        | —     |
| VIEWER | Read only           | —            | —        | —     |

## Rate Limiting

- **Layer 1**: Cloudflare (edge-level)
- **Layer 2**: Go middleware (application-level, per-IP)
  - Login: 10 req/min
  - Search: 30 req/min
  - Public API: 60 req/min

## Input Validation

- Search query: max 120 characters
- Post title: max 200 characters
- POST body: validated JSON, type-checked
- File uploads: MIME type validation

## Encryption

- Field-level: AES-GCM for sensitive data (API keys, secrets)
- At rest: PostgreSQL TDE (when available)
- In transit: TLS via Cloudflare

## Audit Logging

Every write operation logs:

- Who (user_id)
- What (action, entity, entity_id)
- When (timestamp)
- Where (IP address)
- Details (optional metadata)

## Security Headers

Applied via Go middleware:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
