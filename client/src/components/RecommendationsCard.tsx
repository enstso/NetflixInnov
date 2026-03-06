interface WatchedCategory {
  category: string;
  watchedTitles: string[];
}

interface ProfileHistory {
  profileLabel: "Host" | "Guest";
  watchedByCategory: WatchedCategory[];
}

const RECOMMENDATION_POOL: Record<string, string[]> = {
  Thriller: ["Shutter Island", "Gone Girl", "Prisoners", "Nightcrawler"],
  ScienceFiction: ["Blade Runner 2049", "Arrival", "Ex Machina", "Dune"],
  Action: ["John Wick", "Mad Max: Fury Road", "Top Gun: Maverick", "Nobody"],
  Drame: ["The Pursuit of Happyness", "Marriage Story", "The Whale", "Moonlight"],
  Comedie: ["The Grand Budapest Hotel", "Superbad", "Palm Springs", "Booksmart"],
  Animation: ["Spider-Man: Across the Spider-Verse", "Soul", "Coco", "The Mitchells vs. the Machines"]
};

const PROFILE_HISTORIES: ProfileHistory[] = [
  {
    profileLabel: "Host",
    watchedByCategory: [
      { category: "Thriller", watchedTitles: ["Se7en", "The Game"] },
      { category: "ScienceFiction", watchedTitles: ["Interstellar", "Inception"] },
      { category: "Action", watchedTitles: ["The Batman", "Extraction"] }
    ]
  },
  {
    profileLabel: "Guest",
    watchedByCategory: [
      { category: "Drame", watchedTitles: ["Whiplash", "The Social Network"] },
      { category: "Comedie", watchedTitles: ["The Intern", "The Nice Guys"] },
      { category: "Animation", watchedTitles: ["Luca", "Klaus"] }
    ]
  }
];

function computeRecommendations(watchedByCategory: WatchedCategory[]): string[] {
  const alreadyWatched = new Set(
    watchedByCategory.flatMap((group) => group.watchedTitles.map((title) => title.toLowerCase()))
  );
  const recommendations: string[] = [];

  for (const group of watchedByCategory) {
    const candidates = RECOMMENDATION_POOL[group.category.replaceAll(" ", "")] ?? [];
    for (const title of candidates) {
      const normalizedTitle = title.toLowerCase();
      if (alreadyWatched.has(normalizedTitle) || recommendations.includes(title)) {
        continue;
      }

      recommendations.push(title);
      if (recommendations.length >= 4) {
        return recommendations;
      }
    }
  }

  return recommendations;
}

export function RecommendationsCard() {
  return (
    <section className="side-card recommendation-card">
      <div className="side-card-head">
        <h3>Recommandations IA</h3>
        <span>Démo visuelle</span>
      </div>

      <div className="profile-reco-list">
        {PROFILE_HISTORIES.map((profile) => {
          const recommendations = computeRecommendations(profile.watchedByCategory);

          return (
            <article key={profile.profileLabel} className="profile-reco-item">
              <div className="profile-reco-head">
                <h4>{profile.profileLabel}</h4>
                <span>{profile.watchedByCategory.length} catégories vues</span>
              </div>

              <div className="watched-groups">
                {profile.watchedByCategory.map((group) => (
                  <div key={`${profile.profileLabel}-${group.category}`} className="watched-group">
                    <p>{group.category}</p>
                    <div className="film-chip-list">
                      {group.watchedTitles.map((title) => (
                        <span key={`${profile.profileLabel}-${group.category}-${title}`} className="film-chip">
                          {title}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="ai-recos">
                <p className="ai-reco-title">A voir - recommandé par l'IA</p>
                <ul>
                  {recommendations.map((title) => (
                    <li key={`${profile.profileLabel}-reco-${title}`}>{title}</li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
