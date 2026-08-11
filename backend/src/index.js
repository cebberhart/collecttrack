require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { pool } = require("./db");
const { requireAuth } = require("./authMiddleware");
const { searchMtg, searchPokemon, searchYugioh } = require("./cardSearch");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "collecttrack-backend" });
});

app.get("/api/health/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "ok", dbTime: result.rows[0].now });
  } catch (err) {
    console.error("DB health check failed:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

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

app.get("/api/collections", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM collections ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error("Collections query failed:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

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

app.listen(PORT, () => {
  console.log(`CollectTrack backend listening on port ${PORT}`);
});