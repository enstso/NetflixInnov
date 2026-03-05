import type { Role } from "../types/events";

interface RoomHeaderProps {
  roomId: string;
  role: Role;
  isConnected: boolean;
  onCopy: () => void;
  onResync: () => void;
}

export function RoomHeader({ roomId, role, isConnected, onCopy, onResync }: RoomHeaderProps) {
  return (
    <header className="room-header">
      <div className="room-header-left">
        <span className="live-badge">
          <i /> LIVE SYNC
        </span>
        <div className="room-code-wrap">
          <span>Code: {roomId}</span>
          <button className="button button-ghost" onClick={onCopy}>
            Copier
          </button>
        </div>
      </div>

      <div className="room-header-right">
        <span className={`net-status ${isConnected ? "online" : "offline"}`}>
          {isConnected ? "Connecté" : "Reconnexion..."}
        </span>
        {role === "guest" && (
          <button className="button button-secondary" onClick={onResync}>
            Resync
          </button>
        )}
      </div>
    </header>
  );
}
