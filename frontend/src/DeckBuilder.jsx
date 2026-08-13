import { useState } from "react";
import { useAuth } from "./AuthContext";

const API_BASE = "http://localhost:3001";

function DeckBuilder({ decks, onCreateDeck, onDeleteDeck }) {
  const { getToken } = useAuth();
  const [game, setGame] = useState("mtg");
  const [format, setFormat] = useState("standard");
  const [name, setName] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [deckDetail, setDeckDetail] = useState(null);
  const [legality, setLegality] = useState(null);
  const [error, setError] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreateDeck({ game, format, name });
    setName("");
  };

  const openDeck = async (id) => {
    setSelectedDeckId(id);
    setLegality(null);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/decks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      setDeckDetail(await res.json());
    } catch (err) {
      setError(err.message);
    }
  };

  const removeCard = async (cardId) => {
    try {
      const token = await getToken();
      await fetch(`${API_BASE}/api/decks/${selectedDeckId}/cards/${cardId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      openDeck(selectedDeckId);
    } catch (err) {
      setError(err.message);
    }
  };

  const checkLegality = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/decks/${selectedDeckId}/legality`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Legality check failed (${res.status})`);
      setLegality(await res.json());
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>Deck Builder</h2>

      <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <select value={game} onChange={(e) => setGame(e.target.value)}>
          <option value="mtg">Magic: The Gathering</option>
          <option value="pokemon">Pokémon</option>
          <option value="yugioh">Yu-Gi-Oh!</option>
        </select>
        <input
          type="text"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          placeholder="Format (e.g. standard)"
          style={{ padding: "0.4rem", width: "140px" }}
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Deck name"
          style={{ padding: "0.4rem", flex: 1, maxWidth: "220px" }}
        />
        <button type="submit">Create deck</button>
      </form>

      {decks.length === 0 ? (
        <p>No decks yet — create one above.</p>
      ) : (
        <ul>
          {decks.map((deck) => (
            <li key={deck.id} style={{ marginBottom: "0.25rem" }}>
              <button onClick={() => openDeck(deck.id)} style={{ marginRight: "0.5rem" }}>
                {deck.name} ({deck.game} / {deck.format})
              </button>
              <button onClick={() => onDeleteDeck(deck.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {deckDetail && deckDetail.id === selectedDeckId && (
        <div style={{ marginTop: "1rem", border: "1px solid #ccc", padding: "1rem", maxWidth: "500px" }}>
          <h3>
            {deckDetail.name} — {deckDetail.cards.length} unique card(s)
          </h3>
          {deckDetail.cards.length === 0 ? (
            <p>No cards in this deck yet. Add some from your collection below.</p>
          ) : (
            <ul>
              {deckDetail.cards.map((c) => (
                <li key={c.card_id}>
                  {c.card_name} × {c.quantity}{" "}
                  <button onClick={() => removeCard(c.card_id)}>Remove</button>
                </li>
              ))}
            </ul>
          )}
          <button onClick={checkLegality}>Check legality</button>
          {legality && (
            <p style={{ color: legality.legal ? "green" : "crimson", marginTop: "0.5rem" }}>
              {legality.legal
                ? "Deck is legal — no banned/restricted cards found."
                : `${legality.violations.length} violation(s) found.`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default DeckBuilder;