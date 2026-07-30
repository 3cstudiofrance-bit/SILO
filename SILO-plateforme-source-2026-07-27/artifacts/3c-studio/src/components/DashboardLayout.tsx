import { Link, useLocation } from "wouter";
import { useUser, UserButton, useClerk } from "@clerk/react";
import {
  LayoutDashboard, FolderOpen, FileText, Shield,
  ChevronRight, Menu, X, LogOut, Building2, Briefcase,
  MessageSquare, Bell, Upload, Video, PenLine, CreditCard,
  User, CheckSquare, Calendar, Users, Settings, BarChart3,
  HardDrive, Activity, Package, Send, Inbox, Rss, Radio, Star, Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SiloLogo } from "@/components/SiloLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAppRole, type AppRole } from "@/contexts/RoleContext";

// ── NAV PAR ESPACE ─────────────────────────────────────────────

const clientNav = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/demandes", label: "Mes demandes", icon: Inbox },
  { href: "/dashboard/projets", label: "Mes projets", icon: FolderOpen },
  { href: "/dashboard/abonnements", label: "Mes abonnements", icon: CreditCard },
  { href: "/dashboard/devis", label: "Mes devis", icon: FileText },
  { href: "/dashboard/transactions", label: "Mes transactions", icon: Receipt },
  { href: "/dashboard/fichiers", label: "Mes fichiers", icon: HardDrive },
  { href: "/dashboard/messages", label: "Messagerie", icon: MessageSquare },
  { href: "/dashboard/livrables", label: "Livrables", icon: Video },
  { href: "/dashboard/validations", label: "Validations", icon: CheckSquare },
  { href: "/dashboard/evaluations", label: "Évaluations", icon: Star },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/profil", label: "Mon profil", icon: User },
];

const pmNav = [
  { href: "/pm", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/pm/dossiers", label: "Centre de traitement", icon: Inbox },
  { href: "/pm/commandes", label: "Nouvelles commandes", icon: Package },
  { href: "/pm/attribution", label: "Attribution agence", icon: Building2 },
  { href: "/pm/planning", label: "Planning", icon: Calendar },
  { href: "/pm/livrables", label: "Livraisons", icon: CheckSquare },
  { href: "/pm/qualite", label: "Qualité", icon: Shield },
  { href: "/pm/souscriptions", label: "Souscriptions partenaire", icon: PenLine },
  { href: "/pm/messages/client", label: "Discussion client", icon: MessageSquare },
  { href: "/pm/messages/agence", label: "Discussion agence", icon: Send },
  { href: "/pm/feed", label: "Feed projet", icon: Rss },
];

const partnerNav = [
  { href: "/partner", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/partner/missions", label: "Missions attribuées", icon: Briefcase },
  { href: "/partner/brief", label: "Brief", icon: FileText },
  { href: "/partner/fichiers", label: "Fichiers", icon: HardDrive },
  { href: "/partner/livraison", label: "Livrables", icon: Upload },
  { href: "/partner/corrections", label: "Corrections", icon: PenLine },
  { href: "/partner/messages", label: "Messages avec le PM", icon: MessageSquare },
  { href: "/partner/remuneration", label: "Rémunération & FRP", icon: CreditCard },
  { href: "/partner/score", label: "Score agence", icon: Star },
  { href: "/partner/feed", label: "Feed mission", icon: Rss },
];

const adminNav = [
  { href: "/admin", label: "Vue globale", icon: LayoutDashboard, exact: true },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/permissions", label: "Rôles & permissions", icon: Shield },
  { href: "/admin/projets", label: "Projets", icon: FolderOpen },
  { href: "/admin/abonnements", label: "Abonnements", icon: CreditCard },
  { href: "/admin/devis", label: "Devis & Factures", icon: FileText },
  { href: "/admin/agences", label: "Agences", icon: Building2 },
  { href: "/admin/pm", label: "Chefs de projet", icon: Briefcase },
  { href: "/admin/stats", label: "Scores & stats", icon: BarChart3 },
  { href: "/admin/finance", label: "Finance & FRP", icon: Activity },
  { href: "/admin/logs", label: "Logs", icon: Settings },
  { href: "/admin/communication", label: "Communication", icon: Radio },
];

// ── NAV ITEM ───────────────────────────────────────────────────

function NavItem({ href, label, icon: Icon, exact, badge }: {
  href: string; label: string; icon: React.ElementType; exact?: boolean; badge?: number;
}) {
  const [location] = useLocation();
  const isActive = exact ? location === href : location.startsWith(href);

  return (
    <Link href={href}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
        isActive
          ? "bg-primary/15 text-primary border border-primary/20"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}>
        <Icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        <span className="flex-1">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
        {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
      </div>
    </Link>
  );
}

// ── SECTION LABEL ──────────────────────────────────────────────

function NavSection({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <div className="pt-4 pb-1">
      <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.12em] px-3 flex items-center gap-1.5">
        <Icon className="w-3 h-3" /> {label}
      </p>
    </div>
  );
}

// ── RÔLE ──────────────────────────────────────────────────────

type Space = "client" | "pm" | "partner" | "admin";

function detectSpace(role: AppRole, path = ""): Space {
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/pm")) return "pm";
  if (path.startsWith("/partner")) return "partner";
  if (path.startsWith("/dashboard")) return "client";
  if (role === "admin") return "admin";
  if (role === "pm") return "pm";
  if (role === "partner") return "partner";
  return "client";
}

const SPACE_LABELS: Record<Space, { label: string; color: string }> = {
  client: { label: "Espace Client", color: "text-blue-400" },
  pm: { label: "Chef de Projet", color: "text-violet-400" },
  partner: { label: "Agence Partenaire", color: "text-emerald-400" },
  admin: { label: "Administration", color: "text-primary" },
};

const adminSpaces = [
  { href: "/admin", label: "Admin", icon: Shield, space: "admin" as const },
  { href: "/pm", label: "PM", icon: Briefcase, space: "pm" as const },
  { href: "/partner", label: "Agence", icon: Building2, space: "partner" as const },
  { href: "/dashboard", label: "Client", icon: User, space: "client" as const },
];

// ── SIDEBAR ────────────────────────────────────────────────────

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { role } = useAppRole();
  const [location] = useLocation();
  const space = detectSpace(role, location);
  const spaceInfo = SPACE_LABELS[space];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <SiloLogo size="sm" />
          <span className={cn("text-[10px] font-medium leading-tight", spaceInfo.color)}>{spaceInfo.label}</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground/70 hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {role === "admin" && (
        <div className="border-b border-border p-3">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
            Changer d’espace
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {adminSpaces.map(({ href, label, icon: Icon, space: targetSpace }) => (
              <Link key={href} href={href}>
                <span
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors",
                    space === targetSpace
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="p-3 flex-1 overflow-y-auto space-y-0.5">
        {space === "client" && (
          <>
            <NavSection label="Mon espace" icon={User} />
            {clientNav.map(item => <NavItem key={item.href} {...item} />)}
          </>
        )}

        {space === "pm" && (
          <>
            <NavSection label="Production" icon={Briefcase} />
            {pmNav.map(item => <NavItem key={item.href} {...item} />)}
          </>
        )}

        {space === "partner" && (
          <>
            <NavSection label="Missions" icon={Briefcase} />
            {partnerNav.map(item => <NavItem key={item.href} {...item} />)}
          </>
        )}

        {space === "admin" && (
          <>
            <NavSection label="Plateforme" icon={Shield} />
            {adminNav.map(item => <NavItem key={item.href} {...item} />)}
            <NavSection label="Production" icon={Briefcase} />
            {pmNav.map(item => <NavItem key={item.href} {...item} />)}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-border space-y-1">
        {isLoaded && user && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <UserButton />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.firstName || user.emailAddresses[0]?.emailAddress}</p>
              <p className="text-xs text-muted-foreground/70 truncate">{user.emailAddresses[0]?.emailAddress}</p>
            </div>
          </div>
        )}
        {isLoaded && user && (
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        )}
      </div>
    </aside>
  );
}

// ── LAYOUT ─────────────────────────────────────────────────────

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 flex flex-col h-full">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="border-b border-border bg-card px-4 md:px-6 h-14 flex items-center gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <SiloLogo size="sm" className="md:hidden" />
          <div className="flex-1" />
          <ThemeToggle />
          <NotificationBell />
        </header>

        <main className="flex-1 p-5 md:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
