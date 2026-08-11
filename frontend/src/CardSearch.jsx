import { useState } from "react";
import { useAuth } from "./AuthContext";

const API_BASE = "http://localhost:3001";

function CardSearch() {
  const { getToken } = useAuth();
  const [game, setGame] = useState("mtg");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const token = await getToken();
      const res = await fetch(
        `${API_BASE}/api/cards/search?game=${game}&q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>Card Search</h2>
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <select value={game} onChange={(e) => setGame(e.target.value)}>
          <option value="mtg">Magic: The Gathering</option>
          <option value="pokemon">Pokémon</option>
          <option value="yugioh">Yu-Gi-Oh!</option>
        </select>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a card..."
          style={{ padding: "0.4rem", flex: 1, maxWidth: "300px" }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {results.map((card) => (
          <div key={card.id} style={{ width: "140px", fontSize: "0.85rem" }}>
            {card.imageUrl && (
              <img src={card.imageUrl} alt={card.name} style={{ width: "100%", borderRadius: "4px" }} />
            )}
            <p style={{ margin: "0.25rem 0 0" }}>
              <strong>{card.name}</strong>
              <br />
              {card.set}
            </p>
          </div>
        ))}
      </div>

      {!loading && searched && results.length === 0 && !error && <p>No results found.</p>}
    </div>
  );
}

export default CardSearch;