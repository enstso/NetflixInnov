import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hero } from "../components/Hero";
import { PosterRow } from "../components/PosterRow";
import { SessionModal } from "../components/SessionModal";
import { TopBar } from "../components/TopBar";
import { useToasts } from "../components/Toasts";
import { socket } from "../realtime/socketClient";
import type { ErrorEvent, RoomRolePayload } from "../types/events";
import { saveRoomRole } from "../types/session";

function mapError(error: ErrorEvent): string {
  switch (error.code) {
    case "not_found":
      return "Session introuvable";
    case "room_full":
      return "Session complète (2/2)";
    case "forbidden":
      return "Action non autorisée";
    case "room_closed":
      return "La session est fermée";
    default:
      return error.message || "Une erreur est survenue";
  }
}

export function HomePage() {
  const navigate = useNavigate();
  const { pushToast } = useToasts();

  const [modalMode, setModalMode] = useState<"create" | "join" | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [createdPayload, setCreatedPayload] = useState<RoomRolePayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const onRoomCreated = (payload: RoomRolePayload) => {
      saveRoomRole(payload.roomId, payload.role);
      setCreatedPayload(payload);
      setErrorMessage(null);
      setIsBusy(false);
    };

    const onRoomJoined = (payload: RoomRolePayload) => {
      saveRoomRole(payload.roomId, payload.role);
      setIsBusy(false);
      setErrorMessage(null);
      setModalMode(null);
      navigate(`/room/${payload.roomId}?role=${payload.role}`, {
        state: {
          initialPlaybackState: payload.playbackState,
          initialServerNow: payload.serverNow
        }
      });
    };

    const onError = (error: ErrorEvent) => {
      setIsBusy(false);
      const mappedError = mapError(error);
      setErrorMessage(mappedError);
      pushToast(mappedError);
    };

    socket.on("room_created", onRoomCreated);
    socket.on("room_joined", onRoomJoined);
    socket.on("error", onError);

    return () => {
      socket.off("room_created", onRoomCreated);
      socket.off("room_joined", onRoomJoined);
      socket.off("error", onError);
    };
  }, [navigate, pushToast]);

  const canEnterRoom = useMemo(() => Boolean(createdPayload?.roomId), [createdPayload]);

  return (
    <div className="page home-page">
      <div className="page-shell">
        <TopBar
          onCreate={() => {
            setModalMode("create");
            setCreatedPayload(null);
            setErrorMessage(null);
            setIsBusy(false);
          }}
        />

        <Hero
          onCreate={() => {
            setModalMode("create");
            setCreatedPayload(null);
            setErrorMessage(null);
            setIsBusy(false);
          }}
          onJoin={() => {
            setModalMode("join");
            setCreatedPayload(null);
            setErrorMessage(null);
            setIsBusy(false);
          }}
        />

        <PosterRow title="Tendances" />

        <footer className="minimal-footer">Demo watch party - sans base de données</footer>
      </div>

      <SessionModal
        mode={modalMode}
        createdRoomId={createdPayload?.roomId ?? null}
        errorMessage={errorMessage}
        isBusy={isBusy}
        onClose={() => {
          setModalMode(null);
          setErrorMessage(null);
          setIsBusy(false);
        }}
        onCreate={() => {
          setIsBusy(true);
          setErrorMessage(null);
          setCreatedPayload(null);
          socket.emit("create_room", {});
        }}
        onJoin={(roomId) => {
          const normalizedRoomId = roomId.trim().toUpperCase();
          if (normalizedRoomId.length < 4) {
            setErrorMessage("Entrez un code valide");
            return;
          }

          setErrorMessage(null);
          setIsBusy(true);
          socket.emit("join_room", { roomId: normalizedRoomId });
        }}
        onCopy={async (roomId) => {
          await navigator.clipboard.writeText(roomId);
          pushToast("Code copié");
        }}
        onEnterRoom={() => {
          if (!createdPayload || !canEnterRoom) {
            return;
          }

          setModalMode(null);
          navigate(`/room/${createdPayload.roomId}?role=${createdPayload.role}`, {
            state: {
              initialPlaybackState: createdPayload.playbackState,
              initialServerNow: createdPayload.serverNow
            }
          });
        }}
      />
    </div>
  );
}
