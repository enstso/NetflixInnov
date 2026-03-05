const POSTERS = Array.from({ length: 12 }, (_, index) => ({
  id: index,
  title: `Preview ${index + 1}`,
  tone: (index % 4) + 1
}));

interface PosterRowProps {
  title: string;
}

export function PosterRow({ title }: PosterRowProps) {
  return (
    <section className="poster-row-wrap">
      <h2>{title}</h2>
      <div className="poster-row" role="list" aria-label={title}>
        {POSTERS.map((poster) => (
          <article key={poster.id} className={`poster-card tone-${poster.tone}`} role="listitem">
            <span>{poster.title}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
