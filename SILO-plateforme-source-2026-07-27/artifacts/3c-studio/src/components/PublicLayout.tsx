import { Link, useLocation } from "wouter";
import { useUser, UserButton, SignInButton, useClerk } from "@clerk/react";
import { ArrowUpRight, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SiloWordmark } from "@/components/SiloLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

export const TALLY_CLIENT_URL = "https://tally.so/r/rjWGb2";
export const TALLY_PARTNER_URL = "https://tally.so/r/ob1v7x";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/portfolio", label: "Portfolio" },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#0a1630]/15 bg-[#f2f0ea]/95 text-[#0a1630] backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1760px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/">
            <SiloWordmark className="text-lg" />
          </Link>

          <nav className="hidden lg:flex items-center gap-9">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-xs font-semibold uppercase tracking-[0.16em] transition-opacity hover:opacity-55",
                  location === link.href ? "opacity-100" : "opacity-55"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle className="flex h-10 w-10 items-center justify-center rounded-full border border-[#0a1630]/20 text-[#0a1630] transition-colors hover:bg-[#0a1630] hover:text-white" />
            {isLoaded && (
              isSignedIn ? (
                <div className="flex items-center gap-3">
                  <Link href="/accueil" className="text-xs font-semibold uppercase tracking-[0.14em] opacity-65 transition-opacity hover:opacity-100">
                    Mon espace
                  </Link>
                  <UserButton />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <SignInButton mode="redirect">
                    <button className="text-xs font-semibold uppercase tracking-[0.14em] opacity-65 transition-opacity hover:opacity-100">
                      Connexion
                    </button>
                  </SignInButton>
                  <a
                    href={TALLY_CLIENT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex min-h-11 items-center gap-3 rounded-full bg-[#0a1630] px-5 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#2367e8]"
                  >
                    Lancer un projet <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              )
            )}
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle className="flex h-10 w-10 items-center justify-center rounded-full border border-[#0a1630]/20 text-[#0a1630]" />
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#0a1630]/20 text-[#0a1630]"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-[#0a1630]/15 bg-[#f2f0ea] text-[#0a1630] lg:hidden">
            <div className="space-y-5 px-6 py-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm font-semibold uppercase tracking-[0.12em] opacity-65 transition-opacity hover:opacity-100"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={TALLY_CLIENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm font-semibold uppercase tracking-[0.12em] text-[#2367e8]"
                onClick={() => setMenuOpen(false)}
              >
                Créer un compte client
              </a>
              <a
                href={TALLY_PARTNER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm font-semibold uppercase tracking-[0.12em] opacity-65 transition-opacity hover:opacity-100"
                onClick={() => setMenuOpen(false)}
              >
                Devenir partenaire
              </a>
              {isLoaded && !isSignedIn && (
                <SignInButton mode="redirect">
                  <button className="block text-sm font-semibold uppercase tracking-[0.12em] opacity-65 transition-opacity hover:opacity-100">
                    Connexion
                  </button>
                </SignInButton>
              )}
              {isSignedIn && (
                <Link href="/accueil" className="block text-sm font-semibold uppercase tracking-[0.12em] text-[#2367e8]" onClick={() => setMenuOpen(false)}>
                  Mon espace
                </Link>
              )}
              {isSignedIn && (
                <button
                  onClick={() => { setMenuOpen(false); signOut({ redirectUrl: "/" }); }}
                  className="flex items-center gap-2 text-sm font-medium text-destructive hover:opacity-80 transition-opacity"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-20">
        {children}
      </main>

      <footer className="border-t border-white/15 bg-[#071126] text-white">
        <div className="mx-auto max-w-[1680px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="mb-4">
                <SiloWordmark className="text-lg" />
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-white/55">
                Silo met en relation les clients avec les meilleures agences et professionnels de l'audiovisuel, avec un accompagnement dédié de bout en bout.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#f3bd13]">Navigation</h4>
              <ul className="space-y-2.5">
                {navLinks.map((l) => (
                  <li key={l.href}><Link href={l.href} className="text-sm text-white/55 transition-colors hover:text-white">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#f3bd13]">Nous rejoindre</h4>
              <ul className="space-y-2.5 text-sm text-white/55">
                <li><a href={TALLY_CLIENT_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">Créer un compte client</a></li>
                <li><a href={TALLY_PARTNER_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">Devenir partenaire</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-8 md:flex-row">
            <p className="text-xs text-white/40">© {new Date().getFullYear()} SILO. Tous droits réservés.</p>
            <p className="text-xs uppercase tracking-[0.14em] text-white/40">La bonne équipe pour chaque projet vidéo.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
