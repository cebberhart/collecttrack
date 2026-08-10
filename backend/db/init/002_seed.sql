-- A couple of sample rows just to confirm the schema works end to end.
-- Safe to delete later — this is not meant to be permanent data.

INSERT INTO users (firebase_uid, email, display_name, role)
VALUES
    ('dev-admin-uid', 'admin@example.com', 'Admin Dev', 'admin'),
    ('dev-user-uid', 'cordero@example.com', 'Cordero', 'user');

INSERT INTO collections (user_id, game, card_id, card_name, quantity, condition, is_foil)
VALUES
    (2, 'mtg', 'test-card-001', 'Lightning Bolt', 4, 'near_mint', FALSE);

INSERT INTO decks (user_id, game, format, name)
VALUES
    (2, 'mtg', 'standard', 'Red Aggro Test Deck');

INSERT INTO deck_cards (deck_id, card_id, card_name, quantity)
VALUES
    (1, 'test-card-001', 'Lightning Bolt', 4);
