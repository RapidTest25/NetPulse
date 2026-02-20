-- NetPulse: Content tables (posts, categories, tags, series)

-- ── Categories ───────────────────────────────────────
CREATE TABLE categories (
    id          TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    name        TEXT NOT NULL UNIQUE,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tags ─────────────────────────────────────────────
CREATE TABLE tags (
    id   TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE
);

-- ── Series ───────────────────────────────────────────
CREATE TABLE series (
    id          TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    title       TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Posts ─────────────────────────────────────────────
CREATE TABLE posts (
    id               TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    title            TEXT NOT NULL,
    slug             TEXT NOT NULL UNIQUE,
    excerpt          TEXT DEFAULT '',
    body             TEXT NOT NULL DEFAULT '',
    cover_url        TEXT DEFAULT '',
    status           TEXT NOT NULL DEFAULT 'DRAFT'
                     CHECK (status IN ('DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED')),
    author_id        TEXT NOT NULL REFERENCES users(id),
    category_id      TEXT REFERENCES categories(id) ON DELETE SET NULL,
    published_at     TIMESTAMPTZ,
    scheduled_at     TIMESTAMPTZ,
    meta_title       TEXT DEFAULT '',
    meta_description TEXT DEFAULT '',
    canonical        TEXT DEFAULT '',
    search_vector    TSVECTOR,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_posts_slug         ON posts(slug);
CREATE INDEX idx_posts_status       ON posts(status);
CREATE INDEX idx_posts_published    ON posts(published_at DESC NULLS LAST);
CREATE INDEX idx_posts_author       ON posts(author_id);
CREATE INDEX idx_posts_category     ON posts(category_id);
CREATE INDEX idx_posts_search       ON posts USING GIN(search_vector);

-- ── Post-Tags junction ───────────────────────────────
CREATE TABLE post_tags (
    post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id  TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- ── Post-Series junction ─────────────────────────────
CREATE TABLE post_series (
    post_id   TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    series_id TEXT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    position  INT NOT NULL DEFAULT 0,
    PRIMARY KEY (post_id, series_id)
);

-- ── Post Revisions ───────────────────────────────────
CREATE TABLE post_revisions (
    id         BIGSERIAL PRIMARY KEY,
    post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    body       TEXT NOT NULL,
    excerpt    TEXT DEFAULT '',
    editor_id  TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_revisions_post ON post_revisions(post_id, created_at DESC);

-- ── Trigger: auto-update search_vector on insert/update ──
CREATE OR REPLACE FUNCTION posts_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.body, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_posts_search_vector
    BEFORE INSERT OR UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION posts_search_vector_update();

-- ── Media ────────────────────────────────────────────
CREATE TABLE media (
    id          TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    filename    TEXT NOT NULL,
    url         TEXT NOT NULL,
    mime_type   TEXT NOT NULL,
    size_bytes  BIGINT NOT NULL DEFAULT 0,
    uploaded_by TEXT NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Seed some default categories ─────────────────────
INSERT INTO categories (name, slug, description) VALUES
    ('Networking', 'networking', 'Artikel seputar jaringan komputer'),
    ('Security', 'security', 'Keamanan jaringan dan sistem'),
    ('Cloud', 'cloud', 'Cloud computing dan infrastructure'),
    ('DevOps', 'devops', 'DevOps, CI/CD, dan automation'),
    ('Internet', 'internet', 'Teknologi internet dan protokol');

-- ── Seed some default tags ───────────────────────────
INSERT INTO tags (name, slug) VALUES
    ('DNS', 'dns'),
    ('BGP', 'bgp'),
    ('HTTP/3', 'http-3'),
    ('TCP/IP', 'tcp-ip'),
    ('Firewall', 'firewall'),
    ('VPN', 'vpn'),
    ('CDN', 'cdn'),
    ('Load Balancer', 'load-balancer'),
    ('Kubernetes', 'kubernetes'),
    ('Docker', 'docker');
