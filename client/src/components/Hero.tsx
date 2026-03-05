interface HeroProps {
  onCreate: () => void;
  onJoin: () => void;
}

export function Hero({ onCreate, onJoin }: HeroProps) {
  return (
    <section className="hero">
      <p className="hero-kicker">Watch party 2 personnes</p>
      <h1>Regardez ensemble, synchronisé.</h1>
      <p>
        Lancez une session en un clic, partagez un code court et contrôlez la lecture en temps réel
        comme une vraie salle privée.
      </p>
      <div className="hero-actions">
        <button className="button button-accent" onClick={onCreate}>
          Créer
        </button>
        <button className="button button-secondary" onClick={onJoin}>
          Rejoindre
        </button>
      </div>
    </section>
  );
}
