import type { Server, Socket } from "socket.io";
import type { PlaybackState } from "./roomsManager.js";
import { RoomsManager } from "./roomsManager.js";

type ErrorCode = "not_found" | "room_full" | "forbidden" | "room_closed" | "bad_request";

interface CreateRoomPayload {
  displayName?: string;
}

interface JoinRoomPayload {
  roomId?: string;
}

interface RequestStatePayload {
  roomId?: string;
}

interface HostPlayPausePayload {
  roomId?: string;
  position?: number;
}

interface HostSeekPayload {
  roomId?: string;
  position?: number;
  autoplayAfterSeek?: boolean;
}

interface ChatMessagePayload {
  roomId?: string;
  text?: string;
}

interface ReactionPayload {
  roomId?: string;
  emoji?: string;
}

function emitError(socket: Socket, code: ErrorCode, message: string): void {
  socket.emit("error", { code, message });
}

function sanitizeRoomId(roomId: string): string {
  return roomId.trim().toUpperCase();
}

function isValidRoomId(roomId: unknown): roomId is string {
  return typeof roomId === "string" && roomId.trim().length >= 4 && roomId.trim().length <= 8;
}

function isValidPosition(position: unknown): position is number {
  return typeof position === "number" && Number.isFinite(position) && position >= 0;
}

function buildPlaybackState(roomPlaybackState: PlaybackState): PlaybackState {
  return {
    status: roomPlaybackState.status,
    position: roomPlaybackState.position,
    updatedAt: roomPlaybackState.updatedAt
  };
}

export function registerSocketHandlers(io: Server, rooms: RoomsManager): void {
  io.on("connection", (socket) => {
    socket.on("create_room", (_payload: CreateRoomPayload = {}) => {
      const room = rooms.createRoom(socket.id);
      socket.join(room.roomId);

      socket.emit("room_created", {
        roomId: room.roomId,
        role: "host",
        playbackState: buildPlaybackState(room.playbackState),
        serverNow: Date.now()
      });
    });

    socket.on("join_room", (payload: JoinRoomPayload = {}) => {
      if (!isValidRoomId(payload.roomId)) {
        emitError(socket, "bad_request", "Code session invalide");
        return;
      }

      const roomId = sanitizeRoomId(payload.roomId);
      const result = rooms.joinRoom(roomId, socket.id);

      if (!result.ok) {
        const messageMap = {
          not_found: "Session introuvable",
          room_full: "Session complète (2/2)"
        } as const;
        emitError(socket, result.code, messageMap[result.code]);
        return;
      }

      const room = result.room;
      socket.join(room.roomId);
      socket.emit("room_joined", {
        roomId: room.roomId,
        role: "guest",
        playbackState: buildPlaybackState(room.playbackState),
        serverNow: Date.now()
      });

      io.to(room.hostSocketId).emit("guest_joined", { roomId: room.roomId });
    });

    socket.on("request_state", (payload: RequestStatePayload = {}) => {
      if (!isValidRoomId(payload.roomId)) {
        emitError(socket, "bad_request", "Requête invalide");
        return;
      }

      const roomId = sanitizeRoomId(payload.roomId);
      const room = rooms.getRoom(roomId);
      if (!room) {
        emitError(socket, "not_found", "Session introuvable");
        return;
      }

      const role = rooms.getRole(roomId, socket.id);
      if (!role) {
        emitError(socket, "forbidden", "Accès refusé");
        return;
      }

      rooms.touch(roomId);
      socket.emit("state_update", {
        roomId,
        playbackState: buildPlaybackState(room.playbackState),
        serverNow: Date.now()
      });
    });

    socket.on("host_play", (payload: HostPlayPausePayload = {}) => {
      if (!isValidRoomId(payload.roomId) || !isValidPosition(payload.position)) {
        emitError(socket, "bad_request", "Commande play invalide");
        return;
      }

      const roomId = sanitizeRoomId(payload.roomId);
      const role = rooms.getRole(roomId, socket.id);
      if (!role) {
        emitError(socket, "not_found", "Session introuvable");
        return;
      }

      if (role !== "host") {
        emitError(socket, "forbidden", "Seul l'hôte contrôle la lecture");
        return;
      }

      const room = rooms.updatePlaybackState(roomId, {
        status: "playing",
        position: payload.position
      });

      if (!room) {
        emitError(socket, "not_found", "Session introuvable");
        return;
      }

      io.to(roomId).emit("state_update", {
        roomId,
        playbackState: buildPlaybackState(room.playbackState),
        serverNow: Date.now()
      });
    });

    socket.on("host_pause", (payload: HostPlayPausePayload = {}) => {
      if (!isValidRoomId(payload.roomId) || !isValidPosition(payload.position)) {
        emitError(socket, "bad_request", "Commande pause invalide");
        return;
      }

      const roomId = sanitizeRoomId(payload.roomId);
      const role = rooms.getRole(roomId, socket.id);
      if (!role) {
        emitError(socket, "not_found", "Session introuvable");
        return;
      }

      if (role !== "host") {
        emitError(socket, "forbidden", "Seul l'hôte contrôle la lecture");
        return;
      }

      const room = rooms.updatePlaybackState(roomId, {
        status: "paused",
        position: payload.position
      });

      if (!room) {
        emitError(socket, "not_found", "Session introuvable");
        return;
      }

      io.to(roomId).emit("state_update", {
        roomId,
        playbackState: buildPlaybackState(room.playbackState),
        serverNow: Date.now()
      });
    });

    socket.on("host_seek", (payload: HostSeekPayload = {}) => {
      if (!isValidRoomId(payload.roomId) || !isValidPosition(payload.position)) {
        emitError(socket, "bad_request", "Commande seek invalide");
        return;
      }

      const roomId = sanitizeRoomId(payload.roomId);
      const room = rooms.getRoom(roomId);
      if (!room) {
        emitError(socket, "not_found", "Session introuvable");
        return;
      }

      const role = rooms.getRole(roomId, socket.id);
      if (role !== "host") {
        emitError(socket, "forbidden", "Seul l'hôte contrôle la lecture");
        return;
      }

      const nextStatus =
        typeof payload.autoplayAfterSeek === "boolean"
          ? payload.autoplayAfterSeek
            ? "playing"
            : "paused"
          : room.playbackState.status;

      const updatedRoom = rooms.updatePlaybackState(roomId, {
        status: nextStatus,
        position: payload.position
      });

      if (!updatedRoom) {
        emitError(socket, "not_found", "Session introuvable");
        return;
      }

      io.to(roomId).emit("state_update", {
        roomId,
        playbackState: buildPlaybackState(updatedRoom.playbackState),
        serverNow: Date.now()
      });
    });

    socket.on("chat_message", (payload: ChatMessagePayload = {}) => {
      if (!isValidRoomId(payload.roomId) || typeof payload.text !== "string") {
        emitError(socket, "bad_request", "Message invalide");
        return;
      }

      const roomId = sanitizeRoomId(payload.roomId);
      const role = rooms.getRole(roomId, socket.id);
      if (!role) {
        emitError(socket, "not_found", "Session introuvable");
        return;
      }

      const text = payload.text.trim();
      if (!text) {
        emitError(socket, "bad_request", "Message vide");
        return;
      }

      rooms.touch(roomId);
      io.to(roomId).emit("chat_message", {
        roomId,
        from: role,
        text: text.slice(0, 400),
        serverNow: Date.now()
      });
    });

    socket.on("reaction", (payload: ReactionPayload = {}) => {
      if (!isValidRoomId(payload.roomId) || typeof payload.emoji !== "string") {
        emitError(socket, "bad_request", "Réaction invalide");
        return;
      }

      const roomId = sanitizeRoomId(payload.roomId);
      const role = rooms.getRole(roomId, socket.id);
      if (!role) {
        emitError(socket, "not_found", "Session introuvable");
        return;
      }

      const emoji = payload.emoji.trim();
      if (!emoji) {
        emitError(socket, "bad_request", "Réaction invalide");
        return;
      }

      rooms.touch(roomId);
      io.to(roomId).emit("reaction", {
        roomId,
        from: role,
        emoji: emoji.slice(0, 8),
        serverNow: Date.now()
      });
    });

    socket.on("disconnect", () => {
      const removal = rooms.removeSocket(socket.id);
      if (!removal) {
        return;
      }

      if (removal.role === "host") {
        if (removal.guestSocketId) {
          io.to(removal.guestSocketId).emit("room_closed", { roomId: removal.roomId });
        }
        return;
      }

      io.to(removal.hostSocketId).emit("guest_left", { roomId: removal.roomId });
    });
  });
}
