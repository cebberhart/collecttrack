require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { pool } = require("./db");
const { requireAuth, attachAppUser } = require("./authMiddleware");
const { searchMtg, searchPokemon, searchYugioh } = require("./cardSearch");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Basic health check — confirms the API container is up
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "collecttrack-backend" });
});

// Confirms the API can actually reach Postgres
app.get("/api/health/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "ok", dbTime: result.rows[0].now });
  } catch (err) {
    console.error("DB health check failed:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Lists the tables the schema created — quick way to confirm the schema applied
app.get("/api/health/schema", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    res.json({ status: "ok", tables: result.rows.map((r) => r.table_name) });
  } catch (err) {
    console.error("Schema check failed:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Returns the seeded collection rows — confirms seed data loaded
app.get("/api/collections", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM collections ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error("Collections query failed:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Called right after login/signup. Creates the app-side user row on first
// login (linked by firebase_uid), or just returns it if it already exists.
app.post("/api/auth/sync", requireAuth, async (req, res) => {
  const { uid, email } = req.firebaseUser;
  try {
    const result = await pool.query(
      `INSERT INTO users (firebase_uid, email, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid) DO UPDATE SET email = EXCLUDED.email
       RETURNING id, firebase_uid, email, display_name, role, created_at`,
      [uid, email, email.split("@")[0]]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      const existing = await pool.query(
        "SELECT id, firebase_uid, email, display_name, role, created_at FROM users WHERE firebase_uid = $1",
        [uid]
      );
      if (existing.rows[0]) return res.json(existing.rows[0]);
    }
    console.error("Auth sync failed:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Card search across MTG, Pokémon, and Yu-Gi-Oh! (FR-2). Requires login.
app.get("/api/cards/search", requireAuth, async (req, res) => {
  const { game, q } = req.query;

  if (!game || !q) {
    return res
      .status(400)
      .json({ status: "error", message: "Both 'game' and 'q' query params are required" });
  }

  try {
    let results;
    if (game === "mtg") results = await searchMtg(q);
    else if (game === "pokemon") results = await searchPokemon(q);
    else if (game === "yugioh") results = await searchYugioh(q);
    else return res.status(400).json({ status: "error", message: "game must be mtg, pokemon, or yugioh" });

    res.json({ status: "ok", game, query: q, results });
  } catch (err) {
    console.error("Card search failed:", err.message);
    res.status(502).json({ status: "error", message: err.message });
  }
});

// Returns the logged-in user's own collection (FR-4: manage collection).
app.get("/api/collections/mine", requireAuth, attachAppUser, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM collections WHERE user_id = $1 ORDER BY created_at DESC",
      [req.appUser.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch collection failed:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Adds a card to the logged-in user's collection (FR-3). If the same card
// (same condition/foil) is already owned, bumps the quantity instead of
// creating a duplicate row.
app.post("/api/collections", requireAuth, attachAppUser, async (req, res) => {
  const { game, card_id, card_name, quantity, condition, is_foil } = req.body;

  if (!game || !card_id || !card_name) {
    return res.status(400).json({ status: "error", message: "game, card_id, and card_name are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO collections (user_id, game, card_id, card_name, quantity, condition, is_foil)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, card_id, condition, is_foil)
       DO UPDATE SET quantity = collections.quantity + EXCLUDED.quantity, updated_at = NOW()
       RETURNING *`,
      [
        req.appUser.id,
        game,
        card_id,
        card_name,
        quantity || 1,
        condition || "near_mint",
        is_foil || false,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Add to collection failed:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Edits quantity/condition/foil on an owned card (FR-4). Scoped to the
// logged-in user so nobody can edit someone else's collection row.
app.put("/api/collections/:id", requireAuth, attachAppUser, async (req, res) => {
  const { quantity, condition, is_foil } = req.body;

  try {
    const result = await pool.query(
      `UPDATE collections
       SET quantity = COALESCE($1, quantity),
           condition = COALESCE($2, condition),
           is_foil = COALESCE($3, is_foil),
           updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [quantity, condition, is_foil, req.params.id, req.appUser.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ status: "error", message: "Card not found in your collection" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update collection entry failed:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Removes a card from the logged-in user's collection (FR-4).
app.delete("/api/collections/:id", requireAuth, attachAppUser, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM collections WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.appUser.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ status: "error", message: "Card not found in your collection" });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete collection entry failed:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`CollectTrack backend listening on port ${PORT}`);
});