const { admin } = require("./firebaseAdmin");
const { pool } = require("./db");

// Verifies the "Authorization: Bearer <idToken>" header and attaches the
// decoded Firebase token (uid, email, etc.) to req.firebaseUser
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ status: "error", message: "Missing bearer token" });
  }

  try {
    req.firebaseUser = await admin.auth().verifyIdToken(token);
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    res.status(401).json({ status: "error", message: "Invalid or expired token" });
  }
}

// Use after requireAuth. Blocks the request unless the app user's role is admin.
function requireAdmin(req, res, next) {
  if (req.appUser?.role !== "admin") {
    return res.status(403).json({ status: "error", message: "Admin access required" });
  }
  next();
}

// Use after requireAuth. Looks up the app-side users row for this Firebase
// account and attaches it as req.appUser (gives access to id, role, etc.)
async function attachAppUser(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT id, firebase_uid, email, display_name, role FROM users WHERE firebase_uid = $1",
      [req.firebaseUser.uid]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ status: "error", message: "No app user found — call /api/auth/sync first" });
    }
    req.appUser = result.rows[0];
    next();
  } catch (err) {
    console.error("attachAppUser failed:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
}

module.exports = { requireAuth, requireAdmin, attachAppUser };