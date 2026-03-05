import type { Role } from "./events";

const SESSION_KEY_PREFIX = "streamsync-session:";

export function saveRoomRole(roomId: string, role: Role): void {
  window.sessionStorage.setItem(`${SESSION_KEY_PREFIX}${roomId}`, role);
}

export function loadRoomRole(roomId: string): Role | null {
  const value = window.sessionStorage.getItem(`${SESSION_KEY_PREFIX}${roomId}`);
  if (value === "host" || value === "guest") {
    return value;
  }

  return null;
}

export function clearRoomRole(roomId: string): void {
  window.sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${roomId}`);
}
