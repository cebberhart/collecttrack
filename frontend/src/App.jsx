import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import AuthForm from "./AuthForm";
import CardSearch from "./CardSearch";
import CollectionList from "./CollectionList";
import DeckBuilder from "./DeckBuilder";
import AdminConsole from "./AdminConsole";

const API_BASE = "https://collecttrack-backend-520125667460.us-central1.run.app";

function Dashboard() {
  const { user, logout, getToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [collection, setCollection] = useState([]);
  const [collectionError, setCollectionError] = useState("");
  const [decks, setDecks] = useState([]);

  useEffect(() => {
    const syncProfile = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE}/api/auth/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error(`Backend responded ${res.status}`);
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      }
    };
    syncProfile();
  }, [getToken]);

  const fetchCollection = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/collections/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      setCollection(await res.json());
    } catch (err) {
      setCollectionError(err.message);
    }
  };

  const fetchDecks = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/decks/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      setDecks(await res.json());
    } catch (err) {
      setCollectionError(err.message);
    }
  };

  useEffect(() => {
    fetchCollection();
    fetchDecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (card, game) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/collections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          game,
          card_id: card.id,
          card_name: card.name,
          quantity: 1,
        }),
      });
      if (!res.ok) throw new Error(`Add failed (${res.status})`);
      await fetchCollection();
    } catch (err) {
      setCollectionError(err.message);
    }
  };

  const handleUpdateQuantity = async (id, quantity) => {
    if (quantity < 1) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/collections/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      await fetchCollection();
    } catch (err) {
      setCollectionError(err.message);
    }
  };

  const handleRemove = async (id) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/collections/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) throw new Error(`Remove failed (${res.status})`);
      await fetchCollection();
    } catch (err) {
      setCollectionError(err.message);
    }
  };

  const handleCreateDeck = async ({ game, format, name }) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/decks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ game, format, name }),
      });
      if (!res.ok) throw new Error(`Create deck failed (${res.status})`);
      await fetchDecks();
    } catch (err) {
      setCollectionError(err.message);
    }
  };

  const handleDeleteDeck = async (id) => {
    try {
      const token = await getToken();
      await fetch(`${API_BASE}/api/decks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchDecks();
    } catch (err) {
      setCollectionError(err.message);
    }
  };

  const handleAddToDeck = async (deckId, collectionItem) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/decks/${deckId}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          card_id: collectionItem.card_id,
          card_name: collectionItem.card_name,
          quantity: 1,
        }),
      });
      if (!res.ok) throw new Error(`Add to deck failed (${res.status})`);
    } catch (err) {
      setCollectionError(err.message);
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>CollectTrack</h1>
      <p>Logged in as {user.email}</p>
      {error && <p style={{ color: "crimson" }}>Backend sync failed: {error}</p>}
      {profile && (
        <ul>
          <li>App user id: {profile.id}</li>
          <li>Role: {profile.role}</li>
          <li>Display name: {profile.display_name}</li>
        </ul>
      )}
      <button onClick={logout} style={{ padding: "0.5rem 1rem" }}>
        Log out
      </button>

      <CardSearch onAdd={handleAdd} />

      {collectionError && <p style={{ color: "crimson" }}>{collectionError}</p>}
      <CollectionList
        collection={collection}
        decks={decks}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemove}
        onAddToDeck={handleAddToDeck}
      />

      <DeckBuilder decks={decks} onCreateDeck={handleCreateDeck} onDeleteDeck={handleDeleteDeck} />

      {profile?.role === "admin" && <AdminConsole />}
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) return <p style={{ fontFamily: "sans-serif", padding: "2rem" }}>Loading...</p>;

  return user ? <Dashboard /> : <AuthForm />;
}

export default App;