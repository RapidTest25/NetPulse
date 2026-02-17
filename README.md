<p align="center">
  <h1 align="center">⚡ NetPulse</h1>
  <p align="center">
    Blog platform seputar network & dunia internet — SEO-first, multi-author, production-ready.
  </p>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-api-endpoints">API</a> •
  <a href="#-documentation">Docs</a>
</p>

---

## ✨ Features

- **Multi-Author & RBAC** — Role-based access control with 5 roles: Owner, Admin, Editor, Author, Viewer
- **Editorial Workflow** — Draft → In Review → Changes Requested → Scheduled → Published → Archived
- **SEO Optimized** — SSG/ISR pages, auto-generated sitemap, OpenGraph meta tags, structured data (JSON-LD)
- **Full-Text Search** — PostgreSQL FTS with weighted ranking (title > excerpt > body) and autocomplete suggestions
- **Google AdSense Ready** — Configurable ad slots, `ads.txt` management, per-page ad placement
- **Affiliate System** — Built-in referral & affiliate tracking with commission management
- **Engagement** — Comments, likes, saves/bookmarks system
- **Google OAuth** — Social login alongside email/password authentication
- **Media Uploads** — Local file storage with R2/S3-compatible object storage support
- **Audit Logging** — Complete audit trail: who, what, when, where, and details on every write operation
- **Security First** — 5-layer security (Cloudflare WAF → Nginx → Go middleware → Application → Database)

## 🛠 Tech Stack

| Layer        | Technology                                  |
| ------------ | ------------------------------------------- |
| **Frontend** | Next.js 15 (App Router, SSG/ISR), React 19, Tailwind CSS 4, TypeScript 5.7 |
| **Backend**  | Go 1.22, Chi v5 router, zerolog             |
| **Database** | PostgreSQL 16 (FTS, GIN indexes)            |
| **Cache**    | Redis 7 (caching, rate limiting)            |
| **Auth**     | JWT (HS256), Google OAuth 2.0, bcrypt       |
| **Infra**    | Docker Compose, Nginx, Cloudflare (WAF, CDN, DDoS protection) |

## 🚀 Getting Started

### Prerequisites

- **Docker** & **Docker Compose** (recommended)
- Or manually: Go 1.22+, Node.js 20+, PostgreSQL 16, Redis 7

### Quick Start with Docker

```bash
# 1. Clone the repository
git clone https://github.com/RapidTest25/NetPulse.git
cd NetPulse

# 2. Copy environment variables
cp .env.example .env

# 3. Start all services (PostgreSQL, Redis, API, Web)
make dev

# 4. Run database migrations
make migrate

# 5. Seed sample data
make seed
```

### Local Development (without Docker)

```bash
# Start Go API (with hot-reload)
make dev-api

# Start Next.js dev server
make dev-web
```

### Access Points

| Service        | URL                           |
| -------------- | ----------------------------- |
| Web Frontend   | http://localhost:3000          |
| REST API       | http://localhost:8080          |
| Health Check   | http://localhost:8080/health   |

## 📁 Project Structure

```
NetPulse/
├── apps/
│   ├── api/                    # Go REST API
│   │   ├── cmd/server/         # Application entry point
│   │   ├── internal/
│   │   │   ├── bootstrap/      # DB, HTTP, Redis, Logger initialization
│   │   │   ├── config/         # Environment & app configuration
│   │   │   ├── domain/         # Business logic & models
│   │   │   │   ├── ads/        #   Ad management
│   │   │   │   ├── affiliate/  #   Affiliate & referral system
│   │   │   │   ├── auth/       #   Authentication logic
│   │   │   │   ├── comments/   #   Comment system
│   │   │   │   ├── engagement/ #   Likes, saves, bookmarks
│   │   │   │   ├── posts/      #   Posts & editorial workflow
│   │   │   │   ├── roles/      #   RBAC roles & permissions
│   │   │   │   └── users/      #   User management
│   │   │   ├── http/
│   │   │   │   ├── handlers/   # Route handlers (admin, author, public)
│   │   │   │   └── middleware/ # Auth, rate-limit, CORS middleware
│   │   │   ├── repository/     # Data access layer (Postgres, Redis)
│   │   │   ├── security/       # Encryption, password hashing, JWT tokens
│   │   │   └── utils/          # Pagination, slugs, time utilities
│   │   └── migrations/         # Sequential SQL migration files
│   └── web/                    # Next.js 15 Frontend
│       └── src/
│           ├── app/            # App Router pages & layouts
│           │   ├── (admin)/    #   Admin dashboard
│           │   ├── (auth)/     #   Login, register, reset password
│           │   ├── (public)/   #   Public blog pages
│           │   └── (user)/     #   User profile & settings
│           ├── components/     # Reusable UI components
│           ├── lib/            # API clients, auth helpers
│           └── types/          # Shared TypeScript types
├── packages/
│   └── shared-types/           # Shared DTOs & type definitions
├── infra/
│   ├── docker/                 # Dockerfiles (API, Web)
│   ├── nginx/                  # Nginx reverse proxy config
│   └── cloudflare/             # WAF rules, rate limits, cache rules
├── docs/                       # Architecture & decision documentation
├── scripts/                    # Dev/ops scripts (migrate, seed, backup)
├── docker-compose.yml          # Full-stack orchestration
└── Makefile                    # Developer commands
```

## 📡 API Endpoints

### Public

| Method | Endpoint              | Description                    |
| ------ | --------------------- | ------------------------------ |
| GET    | `/health`             | Health check                   |
| GET    | `/posts`              | List posts (paginated, filter) |
| GET    | `/posts/:slug`        | Get post by slug               |
| GET    | `/categories`         | List categories                |
| GET    | `/tags`               | List tags                      |
| GET    | `/search?q=`          | Full-text search               |
| GET    | `/search/suggest?q=`  | Autocomplete suggestions       |

### Authentication

| Method | Endpoint          | Description         |
| ------ | ----------------- | ------------------- |
| POST   | `/auth/login`     | Login (email/pass)  |
| POST   | `/auth/refresh`   | Refresh JWT token   |
| POST   | `/auth/logout`    | Logout              |

### Admin (Protected)

| Method | Endpoint                         | Description                            |
| ------ | -------------------------------- | -------------------------------------- |
| GET    | `/admin/posts`                   | List all posts                         |
| POST   | `/admin/posts`                   | Create post                            |
| PUT    | `/admin/posts/:id`               | Update post                            |
| POST   | `/admin/posts/:id/publish`       | Publish post                           |
| POST   | `/admin/posts/:id/schedule`      | Schedule post                          |
| GET    | `/admin/users`                   | List users                             |
| POST   | `/admin/users/invite`            | Invite new user                        |
| PUT    | `/admin/users/:id/role`          | Change user role                       |
| GET    | `/admin/settings`                | Get site settings                      |
| PUT    | `/admin/settings`                | Update site settings                   |

> Full API documentation available in [docs/api.md](docs/api.md)

## 🧰 Available Commands

```bash
make help          # Show all available commands
make dev           # Start all services with Docker Compose
make dev-api       # Run Go API locally (hot-reload)
make dev-web       # Run Next.js dev server
make up            # Start containers in background
make down          # Stop containers
make logs          # Tail container logs
make migrate       # Run database migrations
make seed          # Seed database with sample data
make test          # Run all tests (API + Web)
make lint          # Lint all code
make clean         # Remove containers, volumes, build cache
```

## 🔒 Security

NetPulse implements security at every layer:

| Layer           | Implementation                                                                 |
| --------------- | ------------------------------------------------------------------------------ |
| **Edge**        | Cloudflare WAF rules, DDoS protection, bot management                          |
| **Transport**   | TLS termination via Cloudflare, security headers (nosniff, DENY frame, strict referrer) |
| **Application** | JWT auth (15min access / 30-day refresh), rate limiting (login: 10/min, search: 30/min) |
| **Data**        | bcrypt password hashing, AES-GCM encryption for sensitive fields, parameterized queries |
| **Audit**       | Complete audit trail on all write operations (who, what, when, where)           |

## 📚 Documentation

| Document                                      | Description                        |
| --------------------------------------------- | ---------------------------------- |
| [docs/architecture.md](docs/architecture.md)  | System architecture & design       |
| [docs/api.md](docs/api.md)                    | Full API reference                 |
| [docs/database.md](docs/database.md)          | Database schema & migrations       |
| [docs/security.md](docs/security.md)          | Security implementation details    |
| [docs/seo-adsense.md](docs/seo-adsense.md)    | SEO & AdSense configuration        |
| [docs/runbook.md](docs/runbook.md)            | Operations runbook                 |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
