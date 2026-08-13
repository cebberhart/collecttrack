const admin = require("firebase-admin");

// GOOGLE_APPLICATION_CREDENTIALS points at the service account JSON key
// that has been created in the Firebase console for this project.
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

module.exports = { admin };
