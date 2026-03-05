import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { RoomHeader } from "../components/RoomHeader";
import { SidePanel } from "../components/SidePanel";
import { useToasts } from "../components/Toasts";
import { VideoStage } from "../components/VideoStage";
import { socket } from "../realtime/socketClient";
import type {
  ChatMessage,
  ChatMessageEvent,
  ErrorEvent,
  PlaybackState,
  ReactionEvent,
  Role,
  StateUpdatePayload
} from "../types/events";
import { clearRoomRole, loadRoomRole, saveRoomRole } from "../types/session";

const DEFAULT_PLAYBACK_STATE: PlaybackState = {
  status: "paused",
  position: 0,
  updatedAt: Date.now()
};

function mapError(error: ErrorEvent): string {
  switch (error.code) {
    case "not_found":
      return "Session introuvable";
    case "room_full":
      return "Session complète (2/2)";
    case "forbidden":
      return "Seul l'hôte contrôle";
    case "room_closed":
      return "Hôte déconnecté: session fermée";
    case "bad_request":
      return error.message || "Requête invalide";
    default:
      return "Erreur inconnue";
  }
}

function toChatMessage(payload: ChatMessageEvent): ChatMessage {
  return {
    id: `${payload.serverNow}-${Math.floor(Math.random() * 100000)}`,
    from: payload.from,
    text: payload.text,
    serverNow: payload.serverNow
  };
}

function inferRole(searchRole: string | null, roomId: string): Role {
  if (searchRole === "host" || searchRole === "guest") {
    return searchRole;
  }

  return loadRoomRole(roomId) ?? "guest";
}

export function RoomPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { pushToast } = useToasts();

  const roomId = useMemo(() => (params.roomId ?? "").toUpperCase(), [params.roomId]);
  const [role, setRole] = useState<Role>(() => inferRole(searchParams.get("role"), roomId));
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [guestConnected, setGuestConnected] = useState(false);
  const [syncing, setSyncing] = useState(role === "guest");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [syncState, setSyncState] = useState(() => {
    const state = location.state as
      | {
          initialPlaybackState?: PlaybackState;
          initialServerNow?: number;
        }
      | undefined;

    return {
      playbackState: state?.initialPlaybackState ?? DEFAULT_PLAYBACK_STATE,
      serverNow: state?.initialServerNow ?? Date.now()
    };
  });

  useEffect(() => {
    if (!roomId) {
      navigate("/", { replace: true });
      return;
    }

    saveRoomRole(roomId, role);
  }, [navigate, role, roomId]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    const handleSyncPulse = () => {
      setSyncing(true);
      window.setTimeout(() => setSyncing(false), 650);
    };

    const onConnect = () => {
      setIsConnected(true);
      if (role === "guest") {
        socket.emit("join_room", { roomId });
        handleSyncPulse();
        return;
      }

      socket.emit("request_state", { roomId });
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onRoomJoined = (payload: {
      roomId: string;
      role: Role;
      playbackState: PlaybackState;
      serverNow: number;
    }) => {
      if (payload.roomId !== roomId) {
        return;
      }

      setRole(payload.role);
      saveRoomRole(roomId, payload.role);
      setGuestConnected(true);
      setSyncState({ playbackState: payload.playbackState, serverNow: payload.serverNow });
      handleSyncPulse();
      pushToast("Synchronisation...");
    };

    const onGuestJoined = (payload: { roomId: string }) => {
      if (payload.roomId !== roomId) {
        return;
      }

      setGuestConnected(true);
      pushToast("Invité connecté");
    };

    const onGuestLeft = (payload: { roomId: string }) => {
      if (payload.roomId !== roomId) {
        return;
      }

      setGuestConnected(false);
    };

    const onStateUpdate = (payload: StateUpdatePayload) => {
      if (payload.roomId !== roomId) {
        return;
      }

      setSyncState({ playbackState: payload.playbackState, serverNow: payload.serverNow });
      setSyncing(false);
    };

    const onChatMessage = (payload: ChatMessageEvent) => {
      if (payload.roomId !== roomId) {
        return;
      }

      setMessages((current) => [...current, toChatMessage(payload)]);
    };

    const onReaction = (payload: ReactionEvent) => {
      if (payload.roomId !== roomId) {
        return;
      }

      pushToast(`${payload.from === "host" ? "Host" : "Guest"} ${payload.emoji}`);
    };

    const onError = (error: ErrorEvent) => {
      const message = mapError(error);
      pushToast(message);

      if (error.code === "room_full" || error.code === "not_found") {
        clearRoomRole(roomId);
        window.setTimeout(() => navigate("/", { replace: true }), 900);
      }
    };

    const onRoomClosed = (payload: { roomId: string }) => {
      if (payload.roomId !== roomId) {
        return;
      }

      clearRoomRole(roomId);
      pushToast("Hôte déconnecté: session fermée");
      window.setTimeout(() => navigate("/", { replace: true }), 1200);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room_joined", onRoomJoined);
    socket.on("guest_joined", onGuestJoined);
    socket.on("guest_left", onGuestLeft);
    socket.on("state_update", onStateUpdate);
    socket.on("chat_message", onChatMessage);
    socket.on("reaction", onReaction);
    socket.on("error", onError);
    socket.on("room_closed", onRoomClosed);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room_joined", onRoomJoined);
      socket.off("guest_joined", onGuestJoined);
      socket.off("guest_left", onGuestLeft);
      socket.off("state_update", onStateUpdate);
      socket.off("chat_message", onChatMessage);
      socket.off("reaction", onReaction);
      socket.off("error", onError);
      socket.off("room_closed", onRoomClosed);
    };
  }, [navigate, pushToast, role, roomId]);

  const roomStatusText =
    role === "host"
      ? guestConnected
        ? "Invité connecté"
        : "En attente d'un invité..."
      : "Session invitée";

  return (
    <main className="page room-page">
      {!isConnected && <div className="reconnect-banner">Reconnexion...</div>}

      <div className="page-shell room-shell">
        <RoomHeader
          roomId={roomId}
          role={role}
          isConnected={isConnected}
          onCopy={async () => {
            await navigator.clipboard.writeText(roomId);
            pushToast("Code copié");
          }}
          onResync={() => {
            setSyncing(true);
            pushToast("Synchronisation...");
            socket.emit("request_state", { roomId });
          }}
        />

        <p className="room-status">{roomStatusText}</p>

        <section className="room-layout">
          <VideoStage
            role={role}
            syncState={syncState}
            syncing={syncing}
            onHostPlay={(position) => socket.emit("host_play", { roomId, position })}
            onHostPause={(position) => socket.emit("host_pause", { roomId, position })}
            onHostSeek={(position, autoplayAfterSeek) =>
              socket.emit("host_seek", { roomId, position, autoplayAfterSeek })
            }
            onGuestControlAttempt={() => pushToast("Seul l'hôte contrôle")}
          />

          <SidePanel
            guestConnected={guestConnected}
            messages={messages}
            onSendMessage={(text) => socket.emit("chat_message", { roomId, text })}
            onReaction={(emoji) => socket.emit("reaction", { roomId, emoji })}
          />
        </section>
      </div>
    </main>
  );
}
