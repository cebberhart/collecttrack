const admin = require("firebase-admin");

// GOOGLE_APPLICATION_CREDENTIALS points at the service account JSON key
// (see backend/serviceAccountKey.json — gitignored, never commit this file)
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

module.exports = { admin };
