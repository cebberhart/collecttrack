import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const API_BASE = "https://collecttrack-backend-520125667460.us-central1.run.app";

function AdminConsole() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [rules, setRules] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [catalogStatus, setCatalogStatus] = useState(null);
  const [error, setError] = useState("");

  const [ruleForm, setRuleForm] = useState({
    game: "mtg",
    format: "standard",
    card_id: "",
    card_name: "",
    status: "banned",
  });

  const [ruleSearchQuery, setRuleSearchQuery] = useState("");
  const [ruleSearchResults, setRuleSearchResults] = useState([]);
  const [ruleSearchLoading, setRuleSearchLoading] = useState(false);

  const authedFetch = async (path, options = {}) => {
    const token = await getToken();
    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  };

  const loadAll = async () => {
    try {
      const [usersRes, rulesRes, metricsRes, statusRes] = await Promise.all([
        authedFetch("/api/admin/users"),
        authedFetch("/api/admin/format-rules"),
        authedFetch("/api/admin/metrics"),
        authedFetch("/api/admin/catalog-status"),
      ]);
      if (!usersRes.ok) throw new Error(`Users fetch failed (${usersRes.status})`);
      setUsers(await usersRes.json());
      setRules(await rulesRes.json());
      setMetrics(await metricsRes.json());
      setCatalogStatus(await statusRes.json());
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteUser = async (id) => {
    try {
      await authedFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const addRule = async (e) => {
    e.preventDefault();
    if (!ruleForm.card_id.trim() || !ruleForm.card_name.trim()) return;
    try {
      const res = await authedFetch("/api/admin/format-rules", {
        method: "POST",
        body: JSON.stringify(ruleForm),
      });
      if (!res.ok) throw new Error(`Add rule failed (${res.status})`);
      setRuleForm({ ...ruleForm, card_id: "", card_name: "" });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteRule = async (id) => {
    try {
      await authedFetch(`/api/admin/format-rules/${id}`, { method: "DELETE" });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const searchCardForRule = async (e) => {
    e.preventDefault();
    if (!ruleSearchQuery.trim()) return;
    setRuleSearchLoading(true);
    try {
      const res = await authedFetch(
        `/api/cards/search?game=${ruleForm.game}&q=${encodeURIComponent(ruleSearchQuery)}`
      );
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      setRuleSearchResults(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setRuleSearchLoading(false);
    }
  };

  const selectCardForRule = (card) => {
    setRuleForm({ ...ruleForm, card_id: card.id, card_name: card.name });
    setRuleSearchResults([]);
    setRuleSearchQuery("");
  };

  return (
    <div style={{ marginTop: "3rem", borderTop: "3px solid #333", paddingTop: "1.5rem" }}>
      <h2>Admin Console</h2>
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <h3>Site Metrics</h3>
      {metrics && (
        <ul>
          <li>Total users: {metrics.totalUsers}</li>
          <li>Total decks: {metrics.totalDecks}</li>
          <li>Total collection entries: {metrics.totalCollectionEntries}</li>
          <li>
            Most-tracked cards:{" "}
            {metrics.mostTrackedCards.length === 0
              ? "none yet"
              : metrics.mostTrackedCards
                  .map((c) => `${c.card_name} (${c.total_owned})`)
                  .join(", ")}
          </li>
        </ul>
      )}

      <h3>Catalog Sync Status</h3>
      {catalogStatus && (
        <ul>
          <li>Cached search results: {catalogStatus.cacheSize}</li>
          <li>Last external API fetch: {catalogStatus.lastFetchAt || "none yet this session"}</li>
        </ul>
      )}

      <h3>Users ({users.length})</h3>
      <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: "600px" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
            <th style={{ padding: "0.4rem" }}>Email</th>
            <th style={{ padding: "0.4rem" }}>Role</th>
            <th style={{ padding: "0.4rem" }}></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.4rem" }}>{u.email}</td>
              <td style={{ padding: "0.4rem" }}>{u.role}</td>
              <td style={{ padding: "0.4rem" }}>
                <button onClick={() => deleteUser(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: "1.5rem" }}>Format Rules (banned/restricted lists)</h3>

      <form onSubmit={searchCardForRule} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <select value={ruleForm.game} onChange={(e) => setRuleForm({ ...ruleForm, game: e.target.value })}>
          <option value="mtg">MTG</option>
          <option value="pokemon">Pokémon</option>
          <option value="yugioh">Yu-Gi-Oh!</option>
        </select>
        <input
          type="text"
          value={ruleSearchQuery}
          onChange={(e) => setRuleSearchQuery(e.target.value)}
          placeholder="Search for a card to ban/restrict..."
          style={{ padding: "0.4rem", width: "220px" }}
        />
        <button type="submit" disabled={ruleSearchLoading}>
          {ruleSearchLoading ? "Searching..." : "Search"}
        </button>
      </form>

      {ruleSearchResults.length > 0 && (
        <ul style={{ marginBottom: "0.5rem" }}>
          {ruleSearchResults.map((card) => (
            <li key={card.id}>
              {card.name} ({card.set}){" "}
              <button onClick={() => selectCardForRule(card)}>Use this card</button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addRule} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          type="text"
          value={ruleForm.format}
          onChange={(e) => setRuleForm({ ...ruleForm, format: e.target.value })}
          placeholder="Format"
          style={{ width: "100px", padding: "0.4rem" }}
        />
        <input
          type="text"
          value={ruleForm.card_id}
          readOnly
          placeholder="Card ID (from search above)"
          style={{ width: "220px", padding: "0.4rem", background: "#f0f0f0" }}
        />
        <input
          type="text"
          value={ruleForm.card_name}
          readOnly
          placeholder="Card name (from search above)"
          style={{ width: "160px", padding: "0.4rem", background: "#f0f0f0" }}
        />
        <select value={ruleForm.status} onChange={(e) => setRuleForm({ ...ruleForm, status: e.target.value })}>
          <option value="banned">Banned</option>
          <option value="restricted">Restricted</option>
        </select>
        <button type="submit" disabled={!ruleForm.card_id}>
          Add rule
        </button>
      </form>

      {rules.length === 0 ? (
        <p>No rules yet.</p>
      ) : (
        <ul>
          {rules.map((r) => (
            <li key={r.id}>
              [{r.game} / {r.format}] {r.card_name} — {r.status}{" "}
              <button onClick={() => deleteRule(r.id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminConsole;