import { useEffect, useState } from "react";

type SessionMode = "create" | "join";

interface SessionModalProps {
  mode: SessionMode | null;
  createdRoomId: string | null;
  errorMessage: string | null;
  isBusy: boolean;
  onClose: () => void;
  onCreate: () => void;
  onJoin: (roomId: string) => void;
  onCopy: (roomId: string) => void;
  onEnterRoom: () => void;
}

export function SessionModal({
  mode,
  createdRoomId,
  errorMessage,
  isBusy,
  onClose,
  onCreate,
  onJoin,
  onCopy,
  onEnterRoom
}: SessionModalProps) {
  const [roomInput, setRoomInput] = useState("");

  useEffect(() => {
    if (mode === "join") {
      setRoomInput("");
    }
  }, [mode]);

  if (!mode) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{mode === "create" ? "Créer une session" : "Rejoindre une session"}</h3>
          <button className="icon-button" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        {mode === "create" && !createdRoomId && (
          <div className="modal-content">
            <p>Créez une room et partagez son code à votre invité.</p>
            <button className="button button-accent" onClick={onCreate} disabled={isBusy}>
              {isBusy ? "Création..." : "Créer"}
            </button>
          </div>
        )}

        {mode === "create" && createdRoomId && (
          <div className="modal-content">
            <p>Code session</p>
            <div className="room-code-pill">{createdRoomId}</div>
            <div className="modal-actions">
              <button className="button button-secondary" onClick={() => onCopy(createdRoomId)}>
                Copier
              </button>
              <button className="button button-accent" onClick={onEnterRoom}>
                Entrer
              </button>
            </div>
          </div>
        )}

        {mode === "join" && (
          <form
            className="modal-content"
            onSubmit={(event) => {
              event.preventDefault();
              onJoin(roomInput);
            }}
          >
            <label htmlFor="room-code-input">Code session</label>
            <input
              id="room-code-input"
              className="text-input"
              placeholder="Ex: A7K9QX"
              value={roomInput}
              maxLength={8}
              onChange={(event) => setRoomInput(event.target.value.toUpperCase())}
            />
            <button className="button button-accent" type="submit" disabled={isBusy}>
              {isBusy ? "Connexion..." : "Rejoindre"}
            </button>
          </form>
        )}

        {errorMessage && <p className="modal-error">{errorMessage}</p>}
      </div>
    </div>
  );
}
