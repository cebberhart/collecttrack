import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import AuthForm from "./AuthForm";

const API_BASE = "http://localhost:3001";

function Dashboard() {
  const { user, logout, getToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

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
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) return <p style={{ fontFamily: "sans-serif", padding: "2rem" }}>Loading...</p>;

  return user ? <Dashboard /> : <AuthForm />;
}

export default App;
