-- CollectTrack database schema
-- Runs automatically when the Postgres container starts with an empty data volume.

CREATE TYPE game_type AS ENUM ('mtg', 'pokemon', 'yugioh');
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE rule_status AS ENUM ('banned', 'restricted');

-- Accounts. Firebase Auth handles login/passwords; this table links a Firebase
-- identity to an app-side role and profile info.
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    firebase_uid  VARCHAR(128) UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    display_name  VARCHAR(100),
    role          user_role NOT NULL DEFAULT 'user',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per card a user owns. card_id references the external TCG API's
-- card identifier (Scryfall ID for MTG, etc.) rather than a locally stored catalog.
CREATE TABLE collections (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game        game_type NOT NULL,
    card_id     VARCHAR(64) NOT NULL,
    card_name   VARCHAR(255) NOT NULL,
    quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    condition   VARCHAR(20) NOT NULL DEFAULT 'near_mint',
    is_foil     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, card_id, condition, is_foil)
);

-- A named deck belonging to a user, for a single game/format.
CREATE TABLE decks (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game        game_type NOT NULL,
    format      VARCHAR(50) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cards assigned to a deck. Deliberately not tied to a specific collections
-- row so a card can be reused across multiple decks without conflicts.
CREATE TABLE deck_cards (
    id          SERIAL PRIMARY KEY,
    deck_id     INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    card_id     VARCHAR(64) NOT NULL,
    card_name   VARCHAR(255) NOT NULL,
    quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    UNIQUE (deck_id, card_id)
);

-- Admin-managed banned/restricted lists per game/format (FR-10).
CREATE TABLE format_rules (
    id          SERIAL PRIMARY KEY,
    game        game_type NOT NULL,
    format      VARCHAR(50) NOT NULL,
    card_id     VARCHAR(64) NOT NULL,
    card_name   VARCHAR(255) NOT NULL,
    status      rule_status NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (game, format, card_id)
);

-- Indexes for the lookups the app will do most often.
CREATE INDEX idx_collections_user ON collections(user_id);
CREATE INDEX idx_decks_user ON decks(user_id);
CREATE INDEX idx_deck_cards_deck ON deck_cards(deck_id);
CREATE INDEX idx_format_rules_lookup ON format_rules(game, format);
