import { Link, useLocation } from "wouter";
import { useUser, UserButton, SignInButton, useClerk } from "@clerk/react";
import { Menu, X, LogOut } from "lucide-react";
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
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <SiloWordmark className="text-lg" />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground",
                  location === link.href ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            {isLoaded && (
              isSignedIn ? (
                <div className="flex items-center gap-3">
                  <Link href="/accueil" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Mon espace
                  </Link>
                  <UserButton />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <SignInButton mode="redirect">
                    <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      Connexion
                    </button>
                  </SignInButton>
                  <a
                    href={TALLY_CLIENT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Créer un compte client
                  </a>
                </div>
              )
            )}
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-border bg-background">
            <div className="px-6 py-4 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={TALLY_CLIENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm font-medium text-primary"
                onClick={() => setMenuOpen(false)}
              >
                Créer un compte client
              </a>
              <a
                href={TALLY_PARTNER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Devenir partenaire
              </a>
              {isSignedIn && (
                <Link href="/accueil" className="block text-sm font-medium text-primary" onClick={() => setMenuOpen(false)}>
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

      <main className="flex-1 pt-16">
        {children}
      </main>

      <footer className="border-t border-border mt-24">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="mb-4">
                <SiloWordmark className="text-lg" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Silo met en relation les clients avec les meilleures agences et professionnels de l'audiovisuel, avec un accompagnement dédié de bout en bout.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-foreground">Navigation</h4>
              <ul className="space-y-2.5">
                {navLinks.map((l) => (
                  <li key={l.href}><Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-foreground">Nous rejoindre</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href={TALLY_CLIENT_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Créer un compte client</a></li>
                <li><a href={TALLY_PARTNER_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Devenir partenaire</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Silo. Tous droits réservés.</p>
            <p className="text-xs text-muted-foreground">La bonne équipe pour chaque projet vidéo.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
