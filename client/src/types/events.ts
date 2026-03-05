export type Role = "host" | "guest";

export interface PlaybackState {
  status: "playing" | "paused";
  position: number;
  updatedAt: number;
}

export interface RoomRolePayload {
  roomId: string;
  role: Role;
  playbackState: PlaybackState;
  serverNow: number;
}

export interface StateUpdatePayload {
  roomId: string;
  playbackState: PlaybackState;
  serverNow: number;
}

export interface ChatMessageEvent {
  roomId: string;
  from: Role;
  text: string;
  serverNow: number;
}

export interface ReactionEvent {
  roomId: string;
  from: Role;
  emoji: string;
  serverNow: number;
}

export interface ErrorEvent {
  code: "not_found" | "room_full" | "forbidden" | "room_closed" | "bad_request";
  message: string;
}

export interface ClientToServerEvents {
  create_room: (payload: { displayName?: string }) => void;
  join_room: (payload: { roomId: string }) => void;
  request_state: (payload: { roomId: string }) => void;
  host_play: (payload: { roomId: string; position: number }) => void;
  host_pause: (payload: { roomId: string; position: number }) => void;
  host_seek: (payload: { roomId: string; position: number; autoplayAfterSeek?: boolean }) => void;
  chat_message: (payload: { roomId: string; text: string }) => void;
  reaction: (payload: { roomId: string; emoji: string }) => void;
}

export interface ServerToClientEvents {
  room_created: (payload: RoomRolePayload) => void;
  room_joined: (payload: RoomRolePayload) => void;
  guest_joined: (payload: { roomId: string }) => void;
  guest_left: (payload: { roomId: string }) => void;
  state_update: (payload: StateUpdatePayload) => void;
  chat_message: (payload: ChatMessageEvent) => void;
  reaction: (payload: ReactionEvent) => void;
  error: (payload: ErrorEvent) => void;
  room_closed: (payload: { roomId: string }) => void;
}

export interface ChatMessage {
  id: string;
  from: Role;
  text: string;
  serverNow: number;
}
