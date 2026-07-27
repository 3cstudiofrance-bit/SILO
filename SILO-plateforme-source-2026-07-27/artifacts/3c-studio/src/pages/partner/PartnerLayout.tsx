import { Link, useLocation } from "wouter";
import { useUser, UserButton, useClerk } from "@clerk/react";
import {
  Briefcase, LayoutDashboard, Settings, LogOut, FileText, HardDrive,
  Upload, PenLine, MessageSquare, CreditCard, Star, Rss,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SiloLogo } from "@/components/SiloLogo";

const navItems = [
  { href: "/partner", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/partner/missions", icon: Briefcase, label: "Missions attribuées" },
  { href: "/partner/brief", icon: FileText, label: "Brief" },
  { href: "/partner/fichiers", icon: HardDrive, label: "Fichiers" },
  { href: "/partner/livraison", icon: Upload, label: "Livrables" },
  { href: "/partner/corrections", icon: PenLine, label: "Corrections" },
  { href: "/partner/messages", icon: MessageSquare, label: "Messages avec le PM" },
  { href: "/partner/remuneration", icon: CreditCard, label: "Rémunération & FRP" },
  { href: "/partner/score", icon: Star, label: "Score agence" },
  { href: "/partner/feed", icon: Rss, label: "Feed mission" },
  { href: "/partner/settings", icon: Settings, label: "Paramètres" },
];

export function PartnerLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card/30 shrink-0 sticky top-0 h-screen">
        <div className="px-6 py-5 border-b border-border">
          <Link href="/" className="flex items-center gap-2.5">
            <SiloLogo size="sm" />
            <p className="text-[10px] text-muted-foreground">Espace partenaire</p>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const active = location === item.href || (item.href !== "/partner" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <span className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-border space-y-2">
          <div className="flex items-center gap-3">
            <UserButton />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName || "Partenaire"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
