export type Role = "host" | "guest";
export type PlaybackStatus = "playing" | "paused";

export interface PlaybackState {
  status: PlaybackStatus;
  position: number;
  updatedAt: number;
}

export interface Room {
  roomId: string;
  hostSocketId: string;
  guestSocketId: string | null;
  playbackState: PlaybackState;
  createdAt: number;
  lastActivityAt: number;
}

interface SocketRef {
  roomId: string;
  role: Role;
}

export interface RemovedRoom {
  roomId: string;
  hostSocketId: string;
  guestSocketId: string | null;
}

const ROOM_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_ID_LENGTH = 6;

function nowMs(): number {
  return Date.now();
}

function sanitizePosition(position: number): number {
  if (!Number.isFinite(position) || position < 0) {
    return 0;
  }

  return position;
}

function normalizeRoomId(roomId: string): string {
  return roomId.trim().toUpperCase();
}

export class RoomsManager {
  private readonly rooms = new Map<string, Room>();
  private readonly socketIndex = new Map<string, SocketRef>();

  createRoom(hostSocketId: string): Room {
    const roomId = this.generateRoomId();
    const timestamp = nowMs();
    const room: Room = {
      roomId,
      hostSocketId,
      guestSocketId: null,
      playbackState: {
        status: "paused",
        position: 0,
        updatedAt: timestamp
      },
      createdAt: timestamp,
      lastActivityAt: timestamp
    };

    this.rooms.set(roomId, room);
    this.socketIndex.set(hostSocketId, { roomId, role: "host" });

    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(normalizeRoomId(roomId));
  }

  getRoomBySocketId(socketId: string): Room | undefined {
    const ref = this.socketIndex.get(socketId);
    if (!ref) {
      return undefined;
    }

    const room = this.rooms.get(ref.roomId);
    if (!room) {
      this.socketIndex.delete(socketId);
    }

    return room;
  }

  getRole(roomId: string, socketId: string): Role | null {
    const normalizedRoomId = normalizeRoomId(roomId);
    const ref = this.socketIndex.get(socketId);
    if (!ref || ref.roomId !== normalizedRoomId) {
      return null;
    }

    return ref.role;
  }

  joinRoom(roomId: string, guestSocketId: string):
    | { ok: true; room: Room }
    | { ok: false; code: "not_found" | "room_full" } {
    const normalizedRoomId = normalizeRoomId(roomId);
    const room = this.rooms.get(normalizedRoomId);

    if (!room) {
      return { ok: false, code: "not_found" };
    }

    if (room.guestSocketId && room.guestSocketId !== guestSocketId) {
      return { ok: false, code: "room_full" };
    }

    room.guestSocketId = guestSocketId;
    room.lastActivityAt = nowMs();
    this.socketIndex.set(guestSocketId, { roomId: normalizedRoomId, role: "guest" });

    return { ok: true, room };
  }

  updatePlaybackState(
    roomId: string,
    nextState: Partial<Pick<PlaybackState, "status" | "position">>
  ): Room | undefined {
    const room = this.getRoom(roomId);
    if (!room) {
      return undefined;
    }

    room.playbackState = {
      status: nextState.status ?? room.playbackState.status,
      position: sanitizePosition(nextState.position ?? room.playbackState.position),
      updatedAt: nowMs()
    };
    room.lastActivityAt = nowMs();

    return room;
  }

  touch(roomId: string): void {
    const room = this.getRoom(roomId);
    if (!room) {
      return;
    }

    room.lastActivityAt = nowMs();
  }

  removeSocket(socketId: string):
    | { role: "host"; roomId: string; guestSocketId: string | null }
    | { role: "guest"; roomId: string; hostSocketId: string }
    | null {
    const ref = this.socketIndex.get(socketId);
    if (!ref) {
      return null;
    }

    this.socketIndex.delete(socketId);

    const room = this.rooms.get(ref.roomId);
    if (!room) {
      return null;
    }

    if (ref.role === "host") {
      const guestSocketId = room.guestSocketId;
      if (guestSocketId) {
        this.socketIndex.delete(guestSocketId);
      }
      this.rooms.delete(ref.roomId);

      return {
        role: "host",
        roomId: ref.roomId,
        guestSocketId
      };
    }

    room.guestSocketId = null;
    room.lastActivityAt = nowMs();

    return {
      role: "guest",
      roomId: ref.roomId,
      hostSocketId: room.hostSocketId
    };
  }

  cleanupInactiveRooms(maxInactiveMs: number): RemovedRoom[] {
    const now = nowMs();
    const removed: RemovedRoom[] = [];

    for (const [roomId, room] of this.rooms.entries()) {
      if (now - room.lastActivityAt <= maxInactiveMs) {
        continue;
      }

      this.rooms.delete(roomId);
      this.socketIndex.delete(room.hostSocketId);
      if (room.guestSocketId) {
        this.socketIndex.delete(room.guestSocketId);
      }

      removed.push({
        roomId,
        hostSocketId: room.hostSocketId,
        guestSocketId: room.guestSocketId
      });
    }

    return removed;
  }

  private generateRoomId(): string {
    let roomId = "";

    do {
      roomId = Array.from({ length: ROOM_ID_LENGTH }, () => {
        const randomIndex = Math.floor(Math.random() * ROOM_ID_ALPHABET.length);
        return ROOM_ID_ALPHABET[randomIndex];
      }).join("");
    } while (this.rooms.has(roomId));

    return roomId;
  }
}
