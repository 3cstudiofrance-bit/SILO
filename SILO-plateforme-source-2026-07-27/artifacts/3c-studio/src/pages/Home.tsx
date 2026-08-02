import { PublicLayout, TALLY_CLIENT_URL, TALLY_PARTNER_URL } from "@/components/PublicLayout";
import { ArrowRight, ArrowUpRight, Check, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

const steps = [
  { number: "01", title: "Vous briefez", text: "Votre format, votre ambition, votre délai et votre budget en quelques minutes." },
  { number: "02", title: "SILO sélectionne", text: "Nous identifions le créatif ou l'équipe réellement adaptés à votre projet." },
  { number: "03", title: "Nous pilotons", text: "Un interlocuteur unique coordonne la production et sécurise chaque validation." },
  { number: "04", title: "Vous diffusez", text: "Les fichiers sont livrés, validés et prêts pour vos canaux de communication." },
];

const featuredFilms = [
  {
    id: "veterans-france",
    category: "Publicité",
    title: "Les Vétérans de France",
    client: "Les Vétérans de France",
    creator: "David Leroyer",
    creatorRole: "Réalisateur",
    video: "/media/veterans-france-david-leroyer.mp4",
    poster: "/media/veterans-france-david-leroyer.jpg",
  },
  {
    id: "groupe-kertrucks",
    category: "Film corporate",
    title: "Groupe Kertrucks",
    client: "Groupe Kertrucks",
    creator: "David Leroyer",
    creatorRole: "Réalisateur",
    video: "/media/groupe-kertrucks-david-leroyer.mp4",
    poster: "/media/groupe-kertrucks-david-leroyer.jpg",
  },
] as const;

export default function Home() {
  const [activeFilmId, setActiveFilmId] = useState<(typeof featuredFilms)[number]["id"]>(featuredFilms[0].id);
  const activeFilm = featuredFilms.find((film) => film.id === activeFilmId) ?? featuredFilms[0];

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-silo-reveal]"));

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10%", threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <PublicLayout>
      <div className="silo-apple-type overflow-hidden bg-[#f2f0ea] text-[#0a1630] selection:bg-[#f3bd13] selection:text-[#0a1630]">
        <section className="border-b border-[#0a1630]/20 px-4 sm:px-6 lg:px-10" aria-labelledby="hero-title">
          <div className="mx-auto max-w-[1680px] border-x border-[#0a1630]/15">
            <div className="flex items-center justify-between border-b border-[#0a1630]/15 px-4 py-4 text-[10px] font-semibold uppercase tracking-[0.22em] sm:px-8 sm:text-xs">
              <span>Mise en relation audiovisuelle</span>
              <span className="hidden items-center gap-2 sm:flex">
                <span className="h-2 w-2 rounded-full bg-[#19a974]" aria-hidden="true" />
                Professionnels sélectionnés
              </span>
              <span>France</span>
            </div>

            <div className="px-4 pb-12 pt-16 sm:px-8 sm:pb-16 sm:pt-20 lg:pb-20 lg:pt-24">
              <h1
                id="hero-title"
                className="silo-display max-w-[14ch] text-[clamp(3rem,7vw,7.2rem)] font-bold leading-[0.92] tracking-[-0.055em]"
              >
                <span className="silo-reveal block">Le bon créatif</span>
                <span className="silo-reveal silo-reveal-delay block">pour <em className="not-italic text-[#2367e8]">chaque</em></span>
                <span className="silo-reveal silo-reveal-delay-2 block">projet vidéo.</span>
              </h1>
            </div>

            <div className="grid border-t border-[#0a1630]/15 md:grid-cols-[1fr_1fr]">
              <div className="flex items-end border-b border-[#0a1630]/15 p-4 md:border-b-0 md:border-r md:p-8">
                <p className="max-w-xl text-lg font-medium leading-snug sm:text-2xl lg:text-3xl">
                  Une équipe choisie pour votre projet. Un chef de projet pour tenir le cap.
                </p>
              </div>
              <div className="grid gap-8 p-4 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
                <p className="max-w-lg text-sm leading-relaxed text-[#0a1630]/65 sm:text-base">
                  SILO connecte entreprises, artistes et particuliers avec des professionnels
                  audiovisuels vérifiés, du brief à la livraison.
                </p>
                <a
                  href={TALLY_CLIENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex min-h-14 items-center justify-between gap-8 rounded-full bg-[#0a1630] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#2367e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2367e8] focus-visible:ring-offset-2"
                >
                  Lancer un projet
                  <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="border-b border-[#0a1630] bg-[#f3bd13] px-4 text-[#0a1630] sm:px-6 lg:px-10" aria-label="Services SILO">
          <div className="mx-auto grid max-w-[1680px] grid-cols-2 border-x border-[#0a1630]/20 text-[10px] font-bold uppercase tracking-[0.16em] sm:grid-cols-4 sm:text-xs">
            {["Film de marque", "Clip & live", "Événement", "Social content"].map((service) => (
              <span key={service} className="border-b border-r border-[#0a1630]/20 px-4 py-4 last:border-r-0 sm:border-b-0 sm:px-6">
                {service}
              </span>
            ))}
          </div>
        </div>

        <section id="expertises" className="bg-[#050b18] px-4 py-24 text-white sm:px-6 sm:py-32 lg:px-10">
          <div className="mx-auto max-w-6xl text-center">
            <p className="mb-8 text-xs font-semibold uppercase tracking-[0.3em] text-[#f3bd13]">01 · L’accompagnement SILO</p>
            <h2 data-silo-reveal className="silo-scroll-reveal text-[clamp(2.7rem,5vw,5rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
              La bonne équipe.<br />Un seul interlocuteur.
            </h2>
            <p data-silo-reveal className="silo-scroll-reveal silo-scroll-reveal-delay-1 mx-auto mt-8 max-w-2xl text-base leading-relaxed text-white/65 sm:text-xl">
              Nous sélectionnons les bons professionnels, cadrons la production et suivons chaque étape jusqu’à la livraison.
            </p>
            <a
              href={TALLY_CLIENT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex min-h-12 items-center gap-3 rounded-full border border-white/50 px-6 text-sm font-semibold transition-colors hover:bg-white hover:text-[#050b18]"
            >
              Nous confier un projet <ArrowUpRight className="h-4 w-4" />
            </a>

            <div className="mt-20 grid border-t border-white/20 text-left sm:grid-cols-3">
              {[
                ["Sélection", "Des profils vérifiés selon le besoin."],
                ["Pilotage", "Un chef de projet pour tenir le cap."],
                ["Livraison", "Des validations claires jusqu’aux fichiers finaux."],
              ].map(([title, text]) => (
                <div key={title} className="border-b border-white/20 py-6 sm:border-b-0 sm:border-r sm:px-7 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0">
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="methode" className="px-4 py-20 sm:px-6 sm:py-28 lg:px-10">
          <div className="mx-auto max-w-[1680px]">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div data-silo-reveal className="silo-scroll-reveal">
                <p className="mb-8 text-xs font-semibold uppercase tracking-[0.3em] text-[#2367e8]">02 · La méthode</p>
                <p className="max-w-sm text-xl font-medium leading-snug sm:text-2xl">
                  Quatre étapes, un seul interlocuteur. Du premier brief au dernier export.
                </p>
              </div>
              <div className="border-t border-[#0a1630]">
                {steps.map((step) => (
                  <div key={step.number} className="grid gap-4 border-b border-[#0a1630]/25 py-7 sm:grid-cols-[64px_0.8fr_1.2fr] sm:items-start sm:py-9">
                    <span className="text-xs font-bold text-[#2367e8]">{step.number}</span>
                    <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{step.title}</h3>
                    <p className="max-w-xl text-sm leading-relaxed text-[#0a1630]/60 sm:text-base">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="realisations" className="border-y border-[#0a1630]/20 bg-[#e8e4dc] px-4 py-20 sm:px-6 sm:py-28 lg:px-10" aria-labelledby="work-title">
          <div className="mx-auto max-w-[1680px]">
            <div className="mb-12 flex flex-col gap-8 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
              <div data-silo-reveal className="silo-scroll-reveal">
                <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-[#2367e8]">03 · Réalisations</p>
                <h2 id="work-title" className="max-w-[14ch] text-[clamp(2.7rem,5vw,5rem)] font-semibold leading-[0.94] tracking-[-0.045em]">
                  Les films parlent mieux que les promesses.
                </h2>
              </div>
              <div data-silo-reveal className="silo-scroll-reveal silo-scroll-reveal-delay-1 flex flex-col items-start gap-3 sm:items-end">
                <p className="max-w-sm text-sm leading-relaxed text-[#0a1630]/60 sm:text-right sm:text-base">
                  Deux projets réels, deux réponses créatives. Sélectionnez un film pour le découvrir.
                </p>
                <Link href="/portfolio" className="group inline-flex items-center gap-3 border-b border-[#0a1630] pb-1 text-sm font-semibold">
                  Voir tout le portfolio
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            <figure data-silo-reveal className="silo-scroll-reveal overflow-hidden rounded-[1.75rem] bg-[#050b18] shadow-[0_30px_90px_rgba(5,11,24,0.18)] sm:rounded-[2.5rem]">
              <div className="relative isolate aspect-[4/5] overflow-hidden bg-[#050b18] sm:aspect-video">
                <video
                  key={activeFilm.id}
                  className="h-full w-full object-cover"
                  controls
                  playsInline
                  preload="metadata"
                  poster={activeFilm.poster}
                  aria-label={`${activeFilm.category} ${activeFilm.title}, par ${activeFilm.creator}`}
                >
                  <source src={activeFilm.video} type="video/mp4" />
                  Votre navigateur ne permet pas de lire cette vidéo.
                </video>
                <div className="pointer-events-none absolute inset-0 bg-[#050b18]/25" aria-hidden="true" />
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 p-5 pb-16 text-white sm:p-10 sm:pb-20 lg:p-14 lg:pb-24">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white/75 sm:text-xs">
                    SILO · {activeFilm.category}
                  </p>
                  <h3 className="max-w-[16ch] text-[clamp(2rem,4vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.045em] drop-shadow-lg">
                    {activeFilm.title}
                  </h3>
                </figcaption>
              </div>

              <div className="grid border-t border-white/15 bg-[#050b18] text-white sm:grid-cols-2">
                <div className="border-b border-white/15 px-5 py-5 sm:border-b-0 sm:border-r sm:px-8 sm:py-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">Projet</p>
                  <p className="mt-2 text-base font-semibold">{activeFilm.client}</p>
                </div>
                <div className="px-5 py-5 sm:px-8 sm:py-6" aria-live="polite">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">Profil créatif</p>
                  <p className="mt-2 text-base font-semibold">{activeFilm.creator}</p>
                  <p className="mt-1 text-xs text-white/55">{activeFilm.creatorRole}</p>
                </div>
              </div>
            </figure>

            <div className="mt-5 grid gap-4 sm:grid-cols-2" aria-label="Choisir une réalisation">
              {featuredFilms.map((film, index) => {
                const isActive = film.id === activeFilm.id;

                return (
                  <button
                    key={film.id}
                    type="button"
                    aria-pressed={isActive}
                    aria-label={`Afficher ${film.category} ${film.title}`}
                    onClick={() => setActiveFilmId(film.id)}
                    className={`group rounded-[1.35rem] border p-2 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2367e8] focus-visible:ring-offset-2 ${
                      isActive
                        ? "border-[#0a1630] bg-[#f2f0ea] shadow-[0_12px_35px_rgba(5,11,24,0.12)]"
                        : "border-[#0a1630]/15 bg-[#f2f0ea]/45 hover:-translate-y-1 hover:border-[#0a1630]/45"
                    }`}
                  >
                    <span className="relative block aspect-[16/10] overflow-hidden rounded-[1rem] bg-[#050b18]">
                      <img
                        src={film.poster}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                      <span className="absolute left-3 top-3 inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white/90 px-2 text-[10px] font-bold text-[#0a1630]">
                        0{index + 1}
                      </span>
                      {isActive && (
                        <span className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f3bd13] text-[#0a1630]" aria-hidden="true">
                          <Play className="h-4 w-4 fill-current" />
                        </span>
                      )}
                    </span>
                    <span className="block px-2 pb-3 pt-4">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2367e8]">{film.category}</span>
                      <span className="mt-2 block text-lg font-semibold leading-tight tracking-[-0.025em]">{film.title}</span>
                      <span className="mt-3 block text-xs text-[#0a1630]/55">par {film.creator}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#2367e8] px-4 py-24 text-white sm:px-6 sm:py-32 lg:px-10">
          <div className="mx-auto max-w-6xl text-center">
            <p className="mb-7 text-xs font-semibold uppercase tracking-[0.3em] text-white/65">04 · On commence ?</p>
            <h2 data-silo-reveal className="silo-scroll-reveal text-[clamp(2.8rem,5.5vw,5.5rem)] font-semibold leading-[0.94] tracking-[-0.05em]">
              Parlons de votre prochain projet vidéo.
            </h2>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
              Décrivez le projet. SILO organise la rencontre, le cadre et le suivi de production.
            </p>
            <div className="mx-auto mt-10 grid max-w-xl gap-3 sm:grid-cols-2">
              <a href={TALLY_CLIENT_URL} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-14 items-center justify-between rounded-full bg-[#f3bd13] px-6 font-semibold text-[#0a1630] transition-transform hover:-translate-y-0.5">
                Créer un compte <ArrowUpRight className="h-5 w-5" />
              </a>
              <a href={TALLY_PARTNER_URL} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-14 items-center justify-between rounded-full border border-white/45 px-6 font-semibold transition-colors hover:bg-white hover:text-[#2367e8]">
                Rejoindre SILO <ArrowRight className="h-5 w-5" />
              </a>
            </div>
            <p className="mt-5 inline-flex items-center gap-2 text-xs text-white/60">
              <Check className="h-4 w-4" /> Réponse et cadrage personnalisés
            </p>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
