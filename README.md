# StreamSync Demo (Watch Party)

Demo watch party inspirée Netflix (UI originale), limitée à 2 personnes, sans base de données.

## Stack

- Client: React + Vite + TypeScript + Socket.IO client
- Server: Express + Socket.IO + TypeScript
- Stockage: in-memory côté serveur (`roomsManager`)

## Démarrage

```bash
npm install
npm run dev
```

- Client: `http://localhost:5173`
- Server: `http://localhost:4000`

## Variables optionnelles

- `VITE_SERVER_URL` (client) - par défaut `http://localhost:4000`
- `CLIENT_ORIGIN` (server) - par défaut `http://localhost:5173`
- `PORT` (server) - par défaut `4000`

## Test démo à 2 onglets

1. Ouvrir l'app dans un 1er onglet.
2. Cliquer sur `Créer une session`, puis `Créer`.
3. Copier le code room et cliquer `Entrer` pour devenir host.
4. Ouvrir un 2e onglet (ou autre navigateur), cliquer `Rejoindre`, coller le code.
5. Vérifier:
   - toast host `Invité connecté`
   - host play/pause/seek -> guest suit
   - guest clique controls -> toast `Seul l'hôte contrôle`
   - chat + réactions en temps réel
6. Ouvrir un 3e onglet et tenter `join_room` sur le même code -> `Session complète (2/2)`.
7. Fermer l'onglet host -> guest reçoit `Hôte déconnecté: session fermée`.

## Architecture

```text
/server
  src/index.ts
  src/roomsManager.ts
  src/socketHandlers.ts
/client
  src/pages/Home.tsx
  src/pages/Room.tsx
  src/components/*
  src/realtime/socketClient.ts
  src/styles/tokens.css
  src/styles/global.css
```

## Règles room implémentées

- 1 host + 1 guest max.
- `host_play`, `host_pause`, `host_seek` réservés au host (`forbidden` sinon).
- `join_room`:
  - room absente -> `not_found`
  - room déjà pleine -> `room_full`
- disconnect host -> `room_closed` au guest puis suppression room.
- disconnect guest -> `guest_left` au host.
- nettoyage automatique toutes les 45s des rooms inactives > 10 min.

