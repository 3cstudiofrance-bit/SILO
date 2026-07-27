import { PublicLayout, TALLY_CLIENT_URL, TALLY_PARTNER_URL } from "@/components/PublicLayout";
import { Link } from "wouter";
import {
  ArrowRight, Handshake, ShieldCheck, Clapperboard, Users, MessageSquare, CheckCircle
} from "lucide-react";

const pillars = [
  {
    icon: Handshake,
    title: "Mise en relation sur mesure",
    description: "Silo sélectionne pour chaque projet l'agence ou le professionnel indépendant le plus adapté à votre besoin, votre budget et vos délais.",
  },
  {
    icon: Users,
    title: "Un conseiller dédié",
    description: "Un chef de projet Silo vous accompagne de la commande à la livraison : un interlocuteur unique qui coordonne tout pour vous.",
  },
  {
    icon: ShieldCheck,
    title: "Qualité et suivi garantis",
    description: "Partenaires vérifiés, délais suivis, validation à chaque étape. Vous gardez la maîtrise de votre projet du brief à la livraison.",
  },
];

const steps = [
  { n: "01", title: "Votre demande", desc: "Décrivez votre besoin en quelques minutes." },
  { n: "02", title: "Mise en relation", desc: "Silo confie votre projet au bon créatif." },
  { n: "03", title: "Suivi dédié", desc: "Votre conseiller Silo coordonne la production." },
  { n: "04", title: "Livraison", desc: "Vous validez et recevez vos fichiers en ligne." },
];

export default function Home() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--accent)/0.10),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(var(--primary)/0.10),_transparent_55%)]" />
        <div className="max-w-4xl mx-auto px-6 w-full text-center py-24 relative">
          <p className="animate-fade-up text-xs uppercase tracking-[0.4em] text-accent-foreground bg-accent/90 inline-block px-3 py-1 rounded-full font-semibold mb-8">
            Mise en relation audiovisuelle
          </p>
          {/* H1 éditorial — Playfair Display uniquement ici */}
          <h1 className="animate-fade-up-delay-1 font-serif text-[clamp(2.4rem,7vw,5.5rem)] font-semibold leading-[1.1] mb-6">
            Le bon créatif pour{" "}
            <span className="italic text-primary">chaque</span>{" "}
            projet vidéo.
          </h1>
          <p className="animate-fade-up-delay-2 text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
            Silo connecte les entreprises, artistes et particuliers avec les meilleures agences
            et professionnels de l'audiovisuel — avec un conseiller dédié qui suit votre projet
            de A à Z.
          </p>
          <div className="animate-fade-up-delay-3 flex flex-wrap gap-4 justify-center">
            <a
              href={TALLY_CLIENT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Créer un compte client
            </a>
            <a
              href={TALLY_PARTNER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-full border border-border text-foreground font-medium hover:bg-secondary transition-all flex items-center gap-2"
            >
              Devenir partenaire <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Piliers — Inter uniquement */}
      <section className="border-y border-border bg-secondary/40">
        <div className="max-w-7xl mx-auto px-6 py-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-8 hover:border-primary/30 transition-all">
              <p.icon className="w-9 h-9 text-primary mb-5" />
              <h3 className="font-semibold text-lg mb-3">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comment ça marche — Inter uniquement */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.4em] text-primary font-medium mb-4">Comment ça marche</p>
          <h2 className="text-3xl md:text-4xl font-semibold">Simple, encadré, efficace</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.n} className="text-center relative">
              {i < steps.length - 1 && <div className="hidden lg:block absolute top-6 left-3/4 w-1/2 h-px bg-border" />}
              <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center mx-auto mb-4">
                <span className="text-xs font-bold text-primary">{step.n}</span>
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portfolio teaser — Inter uniquement */}
      <section className="border-y border-border bg-secondary/40">
        <div className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-primary font-medium mb-4">Nos partenaires</p>
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">Des créatifs vérifiés, un portfolio qui parle</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Clips, films de mariage, vidéos corporate, contenus réseaux sociaux : découvrez
              les réalisations des agences et indépendants du réseau Silo.
            </p>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
            >
              Voir le portfolio <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8">
            <Clapperboard className="w-8 h-8 text-primary mb-4" />
            <ul className="space-y-3">
              {[
                "Clips artistes et vidéos musicales",
                "Films de mariage et événementiel",
                "Vidéos corporate et institutionnelles",
                "Contenus courts pour réseaux sociaux",
                "Captation drone, motion design, étalonnage",
              ].map((s) => (
                <li key={s} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA final — Inter uniquement */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <MessageSquare className="w-10 h-10 text-primary mx-auto mb-6" />
        <h2 className="text-3xl md:text-4xl font-semibold mb-4">Un projet vidéo en tête&nbsp;?</h2>
        <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
          Créez votre compte client et votre conseiller Silo vous recontacte pour cadrer votre
          projet. Vous êtes une agence ou un indépendant&nbsp;? Rejoignez le réseau.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href={TALLY_CLIENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Créer un compte client
          </a>
          <a
            href={TALLY_PARTNER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 rounded-full border border-border font-medium hover:bg-secondary transition-all"
          >
            Devenir partenaire
          </a>
        </div>
      </section>
    </PublicLayout>
  );
}
