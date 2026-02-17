# NetPulse — SEO & AdSense Documentation

## SEO Strategy

### SSG/ISR Pages (SEO-critical)

- Homepage: ISR (60s)
- Post detail: ISR (60s)
- Category listing: ISR (60s)
- Tag listing: ISR (60s)

### Non-indexed Pages

- Search results: `noindex, follow`
- Admin panel: `noindex, nofollow`

### Meta Tags (per page)

- `<title>` — Custom or auto-generated
- `<meta name="description">` — From excerpt or custom
- OpenGraph: `og:title`, `og:description`, `og:image`, `og:type`
- Twitter Card: `summary_large_image`
- Canonical URL
- Structured Data: Article schema (JSON-LD)

### Sitemap & Robots

- `/api/sitemap` — Auto-generated XML sitemap
- `/api/robots` — robots.txt with sitemap reference

## AdSense Readiness

### Required Pages

- Privacy Policy (`/privacy`)
- Terms of Service (`/terms`)
- About (`/about`)
- Contact (`/contact`)

### ads.txt

- Managed via admin panel (`/admin/settings`)
- Served from root domain

### Ad Slots

| Slot Name    | Position          | Default |
| ------------ | ----------------- | ------- |
| header       | Top of page       | Off     |
| in_article_1 | After paragraph 3 | Off     |
| sidebar      | Right sidebar     | Off     |
| footer       | Bottom of page    | Off     |

### Ad Rules

- No ads on legal pages (privacy, terms, about, contact)
- Configurable per-category disable
- Managed via admin panel
