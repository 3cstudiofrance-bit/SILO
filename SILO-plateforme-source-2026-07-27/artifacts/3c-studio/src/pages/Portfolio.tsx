import { PublicLayout, TALLY_CLIENT_URL, TALLY_PARTNER_URL } from "@/components/PublicLayout";
import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { realisations, categoryLabels, categoryColors, PLAYLIST_URL, REALISATEUR, type Realisation } from "@/lib/realisations-data";
import { cn } from "@/lib/utils";

const CATEGORIES: Array<{ value: Realisation["category"] | "all"; label: string }> = [
  { value: "all", label: "Tout" },
  { value: "clip", label: "Clip artiste" },
  { value: "gospel", label: "Gospel" },
];

function RealisationCard({ r }: { r: Realisation }) {
  return (
    <div className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      <div className="relative bg-secondary aspect-video overflow-hidden">
        <img
          src={r.thumbnail}
          alt={`Miniature — ${r.title}`}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        <a
          href={r.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center group/play"
          aria-label={`Voir la réalisation ${r.title}`}
        >
          <div className="w-14 h-14 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center group-hover/play:scale-110 transition-transform">
            <Play className="w-5 h-5 text-primary fill-primary ml-0.5" />
          </div>
        </a>
        <span className="absolute top-3 left-3">
          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", categoryColors[r.category])}>
            {categoryLabels[r.category]}
          </span>
        </span>
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors line-clamp-1">{r.title}</h3>
        <p className="text-xs text-muted-foreground mb-3 font-medium">{r.client}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {r.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full border border-border">
              {tag}
            </span>
          ))}
        </div>
        <a
          href={r.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          Voir sur YouTube
        </a>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [active, setActive] = useState<Realisation["category"] | "all">("all");

  const filtered = active === "all" ? realisations : realisations.filter((r) => r.category === active);

  return (
    <PublicLayout>
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-32">
        <div className="text-center mb-16 animate-fade-up">
          <p className="text-xs uppercase tracking-[0.4em] text-primary font-medium mb-4">Portfolio des partenaires</p>
          {/* H1 éditorial — Playfair Display uniquement ici */}
          <h1 className="font-serif text-[clamp(2rem,6vw,4.5rem)] font-semibold mb-6 leading-tight">Les réalisations du réseau Silo</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Clips d'artistes, gospel, freestyles : découvrez le savoir-faire des agences
            et professionnels indépendants partenaires de Silo.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Réalisations signées <span className="text-foreground font-medium">{REALISATEUR}</span>
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActive(cat.value)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all",
                active === cat.value
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              )}
            >
              {cat.label}
              {cat.value !== "all" && (
                <span className="ml-1.5 text-xs opacity-60">
                  {realisations.filter((r) => r.category === cat.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">Aucune réalisation dans cette catégorie.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((r) => (
              <RealisationCard key={r.id} r={r} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <a
            href={PLAYLIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Voir la playlist complète sur YouTube
          </a>
        </div>

        <div className="mt-24 rounded-2xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/30 p-10 md:p-16 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-primary font-medium mb-4">Votre projet</p>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">Envie d'un résultat comme ceux-ci&nbsp;?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Créez votre compte client et Silo vous met en relation avec le créatif idéal pour votre projet.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={TALLY_CLIENT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Créer un compte client
            </a>
            <a
              href={TALLY_PARTNER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-border font-medium hover:bg-secondary transition-all"
            >
              Devenir partenaire
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
