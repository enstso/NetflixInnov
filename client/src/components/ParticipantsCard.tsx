interface ParticipantsCardProps {
  isGuestConnected: boolean;
}

export function ParticipantsCard({ isGuestConnected }: ParticipantsCardProps) {
  return (
    <section className="side-card">
      <div className="side-card-head">
        <h3>Participants</h3>
        <span>{isGuestConnected ? "2/2" : "1/2"}</span>
      </div>
      <ul className="participant-list">
        <li>
          <span>Host</span>
          <strong>
            <span aria-hidden>👑</span> connecté
          </strong>
        </li>
        <li>
          <span>Guest</span>
          <strong>{isGuestConnected ? "connecté" : "en attente"}</strong>
        </li>
      </ul>
    </section>
  );
}
