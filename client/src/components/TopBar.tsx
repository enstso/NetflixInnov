interface TopBarProps {
  onCreate: () => void;
}

export function TopBar({ onCreate }: TopBarProps) {
  return (
    <header className="topbar">
      <button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        STREAMSYNC
      </button>
      <button className="button button-accent" onClick={onCreate}>
        Créer une session
      </button>
    </header>
  );
}
