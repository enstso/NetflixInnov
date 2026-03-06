import http from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { RoomsManager } from "./roomsManager.js";
import { registerSocketHandlers } from "./socketHandlers.js";

const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173,https://STREAMSYNC.enstso.com")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const ROOM_MAX_IDLE_MS = 10 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 45 * 1000;

const app = express();
app.use(cors({ origin: CLIENT_ORIGINS, credentials: true }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, now: Date.now() });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGINS,
    credentials: true
  }
});

const rooms = new RoomsManager();
registerSocketHandlers(io, rooms);

setInterval(() => {
  const removedRooms = rooms.cleanupInactiveRooms(ROOM_MAX_IDLE_MS);
  for (const removed of removedRooms) {
    if (removed.guestSocketId) {
      io.to(removed.guestSocketId).emit("room_closed", { roomId: removed.roomId });
    }
  }
}, CLEANUP_INTERVAL_MS);

server.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
