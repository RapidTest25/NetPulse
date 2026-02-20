-- NetPulse: Ad slots & ads.txt management

CREATE TABLE ad_slots (
    id        TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    name      TEXT NOT NULL UNIQUE,
    code      TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT false,
    position  TEXT NOT NULL DEFAULT 'inline'
);

-- Seed default ad slots
INSERT INTO ad_slots (name, position) VALUES
    ('header',       'header'),
    ('in_article_1', 'after_paragraph_3'),
    ('sidebar',      'sidebar'),
    ('footer',       'footer');
