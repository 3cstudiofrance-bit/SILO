import { PublicLayout, TALLY_CLIENT_URL, TALLY_PARTNER_URL } from "@/components/PublicLayout";
import { PLAYLIST_URL, REALISATEUR, realisations } from "@/lib/realisations-data";
import { ArrowRight, ArrowUpRight, Check, Play } from "lucide-react";
import { Link } from "wouter";

const steps = [
  { number: "01", title: "Vous briefez", text: "Votre format, votre ambition, votre délai et votre budget en quelques minutes." },
  { number: "02", title: "SILO sélectionne", text: "Nous identifions le créatif ou l'équipe réellement adaptés à votre projet." },
  { number: "03", title: "Nous pilotons", text: "Un interlocuteur unique coordonne la production et sécurise chaque validation." },
  { number: "04", title: "Vous diffusez", text: "Les fichiers sont livrés, validés et prêts pour vos canaux de communication." },
];

const selectedWorks = realisations.slice(0, 3);

export default function Home() {
  return (
    <PublicLayout>
      <div className="overflow-hidden bg-[#f2f0ea] text-[#0a1630] selection:bg-[#f3bd13] selection:text-[#0a1630]">
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
                className="silo-display max-w-[13ch] font-serif text-[clamp(3.6rem,9.2vw,9.6rem)] font-semibold leading-[0.88] tracking-[-0.055em]"
              >
                <span className="silo-reveal block">Le bon créatif</span>
                <span className="silo-reveal silo-reveal-delay block">pour <em className="font-serif text-[#2367e8]">chaque</em></span>
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
            <h2 className="text-[clamp(3rem,6vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.055em]">
              La bonne équipe.<br />Un seul interlocuteur.
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-white/65 sm:text-xl">
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
              <div>
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

        <section className="border-y border-[#0a1630]/20 bg-[#e8e4dc] px-4 py-20 sm:px-6 sm:py-28 lg:px-10" aria-labelledby="work-title">
          <div className="mx-auto max-w-[1680px]">
            <div className="mb-12 flex flex-col gap-8 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-[#2367e8]">03 · Réalisations</p>
                <h2 id="work-title" className="text-[clamp(2.8rem,6vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.055em]">
                  Des réalisations<br />bien réelles.
                </h2>
              </div>
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#0a1630]/55">Réalisations · {REALISATEUR}</p>
                <Link href="/portfolio" className="group inline-flex items-center gap-3 border-b border-[#0a1630] pb-1 text-sm font-semibold">
                  Voir tout le portfolio
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            <div className="grid gap-px overflow-hidden border border-[#0a1630]/25 bg-[#0a1630]/25 lg:grid-cols-3">
              {selectedWorks.map((work, index) => (
                <article key={work.id} className="group flex min-h-[330px] flex-col justify-between bg-[#e8e4dc] p-6 sm:min-h-[380px] sm:p-8">
                  <div>
                    <div className="mb-14 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-[#0a1630]/50">
                      <span>0{index + 1}</span>
                      <span>{work.tags[0]}</span>
                    </div>
                    <h3 className="text-2xl font-semibold leading-tight tracking-[-0.035em] sm:text-3xl">{work.title}</h3>
                    <p className="mt-4 text-sm text-[#0a1630]/55">{work.client}</p>
                  </div>
                  <a
                    href={work.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-3 border-b border-[#0a1630] pb-1 text-sm font-semibold transition-colors hover:text-[#2367e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2367e8]"
                  >
                    Voir le film
                    <Play className="h-4 w-4 fill-current" />
                  </a>
                </article>
              ))}
            </div>

            <a href={PLAYLIST_URL} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0a1630]/60 hover:text-[#2367e8]">
              Playlist complète sur YouTube <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        <section className="bg-[#2367e8] px-4 py-24 text-white sm:px-6 sm:py-32 lg:px-10">
          <div className="mx-auto max-w-6xl text-center">
            <p className="mb-7 text-xs font-semibold uppercase tracking-[0.3em] text-white/65">04 · On commence ?</p>
            <h2 className="text-[clamp(3.2rem,7vw,7.4rem)] font-semibold leading-[0.9] tracking-[-0.06em]">
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
