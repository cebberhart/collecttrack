const { admin } = require("./firebaseAdmin");

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

module.exports = { requireAuth, requireAdmin };
