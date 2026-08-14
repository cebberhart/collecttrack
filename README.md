# CollectTrack

TCG Collection & Deck Tracker — CIS 2454 final project.

## Stack
- **Frontend:** React (Vite), port 5173
- **Backend:** Node.js/Express REST API, port 3001
- **Database:** PostgreSQL 16, port 5432 — schema in `backend/db/init/`

## Local setup

1. Copy the backend env file:
   ```
   cp backend/.env.example backend/.env
   ```
2. **Firebase service account key** (needed for the backend to verify login tokens):
   - Firebase Console → Project settings (gear icon) → Service accounts
   - Click "Generate new private key" → confirm
   - Save the downloaded file as `backend/serviceAccountKey.json` (this exact filename/path — it's gitignored, never commit it)
3. Build and start everything:
   ```
   docker compose up --build
   ```
4. Check it's working:
   - Frontend: http://localhost:5173 — shows a login/signup form, then a dashboard with your role after logging in
   - Backend health: http://localhost:3001/api/health
   - DB health: http://localhost:3001/api/health/db
   - Schema check: http://localhost:3001/api/health/schema
   - Seeded data: http://localhost:3001/api/collections

5. Stop everything:
   ```
   docker compose down
   ```
   Add `-v` to also wipe the database volume (`docker compose down -v`). Required if you change the schema files, since they only run on a fresh, empty volume.

## Project structure
```
collecttrack/
├── backend/
│   ├── src/          Express API
│   └── db/init/      SQL schema + seed data (auto-runs on fresh DB)
├── frontend/          React app (Vite)
│   └── src/
└── docker-compose.yml
```

## Data model
- **users** — Firebase-linked accounts with a role (user/admin)
- **collections** — cards a user owns (game, quantity, condition, foil)
- **decks** — named decks per user/game/format
- **deck_cards** — cards assigned to a deck
- **format_rules** — admin-managed banned/restricted lists (FR-10)

## Features implemented
- **Auth** — Firebase email/password signup/login, backend token verification, role field (user/admin)
- **Card search** — MTG (Scryfall), Pokémon (Pokémon TCG API), Yu-Gi-Oh! (YGOPRODeck), in-memory cached
- **Collection** — add cards from search, adjust quantity, remove, scoped per user
- **Decks** — create/delete decks, assign cards from collection, legality check against `format_rules`
- **Admin console** (role-gated) — user management, format rules editor (search-driven, no manual ID entry), site metrics, catalog sync status

## Next steps
- [x] Firebase Auth wiring
- [x] Card search endpoint (Scryfall / Pokémon TCG API / YGOPRODeck)
- [x] Collection CRUD endpoints
- [x] Deck builder UI
- [x] Admin console routes
- [x] Deploy to Cloud Run + Firebase Hosting
