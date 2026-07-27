import { useUser } from "@clerk/react";
import { Link } from "wouter";
import { TALLY_CLIENT_URL } from "@/components/PublicLayout";
import {
  FolderOpen,
  FileText,
  CalendarDays,
  Euro,
  ArrowRight,
  Bell,
  Plus,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { DashboardLayout as DL } from "@/components/DashboardLayout";
import {
  useListProjects,
  useListQuotes,
  useListTransactions,
} from "@workspace/api-client-react";
import { formatEUR } from "@/lib/finance";

const STATUS_LABEL: Record<string, string> = {
  lead: "Demande",
  devis: "Devis",
  production: "Production",
  post_production: "Post-production",
  livraison_agence: "Livraison agence",
  verification: "Vérification",
  livraison_client: "Livraison",
  correction: "Correction",
  validation_finale: "Validé",
  notation: "Notation",
  archive: "Archivé",
  termine: "Terminé",
};

const TYPE_LABEL: Record<string, string> = {
  mariage: "Mariage",
  clip: "Clip",
  corporate: "Corporate",
  reseaux: "Réseaux",
  evenement: "Événement",
  pub: "Pub",
  autre: "Autre",
};

const QUOTE_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  en_attente: {
    label: "En attente",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  envoye: {
    label: "Envoyé",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  accepte: {
    label: "Accepté",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  refuse: {
    label: "Refusé",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

export default function Dashboard() {
  const { user } = useUser();
  const firstName = user?.firstName || "Client";

  const { data: projects = [], isLoading: projectsLoading } = useListProjects();
  const { data: quotes = [], isLoading: quotesLoading } = useListQuotes();
  const { data: transactions = [], isLoading: transactionsLoading } =
    useListTransactions();
  const isLoading = projectsLoading || quotesLoading || transactionsLoading;

  const activeProjects = projects.filter(
    (p) => !["archive", "lead", "termine"].includes(p.status),
  );
  const nextDelivery = activeProjects
    .filter((p) => p.deliveryDate)
    .sort(
      (a, b) =>
        new Date(a.deliveryDate!).getTime() -
        new Date(b.deliveryDate!).getTime(),
    )[0];
  const pendingQuotes = quotes.filter((d) => d.status === "envoye");
  const totalSpent = transactions
    .filter((t) => t.status === "confirmee")
    .reduce((sum, t) => sum + (t.ttc ?? 0), 0);

  const recentProjects = activeProjects.slice(0, 3);
  const recentQuotes = quotes.slice(0, 3);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Bonjour, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Voici l'état de vos projets en cours.
            </p>
          </div>
          <a href={TALLY_CLIENT_URL} target="_blank" rel="noopener noreferrer">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0">
              <Plus className="w-4 h-4" />
              Nouveau projet
            </button>
          </a>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Projets en cours"
            value={activeProjects.length}
            icon={FolderOpen}
            description="Films en production"
          />
          <StatCard
            label="Prochaine livraison"
            value={
              nextDelivery
                ? new Date(nextDelivery.deliveryDate!).toLocaleDateString(
                    "fr-FR",
                    { day: "numeric", month: "short" },
                  )
                : "—"
            }
            icon={CalendarDays}
            description="Date prévue"
          />
          <StatCard
            label="Devis en attente"
            value={pendingQuotes.length}
            icon={FileText}
            description="En attente de signature"
          />
          <Link href="/dashboard/transactions" className="block">
            <StatCard
              label="Total investi"
              value={totalSpent > 0 ? formatEUR(totalSpent) : "—"}
              icon={Euro}
              description="Transactions confirmées (TTC) — voir le détail"
              className="cursor-pointer hover:border-primary/40"
            />
          </Link>
        </div>

        {/* Alerte devis */}
        {pendingQuotes.length > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-400/5 border border-yellow-400/20">
            <Bell className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-400">
                Devis en attente de signature
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pendingQuotes.length} devis attend
                {pendingQuotes.length > 1 ? "ent" : ""} votre validation.
              </p>
            </div>
            <Link href="/dashboard/devis">
              <button className="text-xs font-medium text-yellow-400 hover:text-yellow-300 transition-colors whitespace-nowrap">
                Voir →
              </button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Projets en cours */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mes projets en cours
                </h2>
                <Link href="/dashboard/projets">
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                    Voir tout <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
              {recentProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-border text-center">
                  <FolderOpen className="w-7 h-7 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Aucun projet en cours
                  </p>
                  <a
                    href={TALLY_CLIENT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <button className="mt-2 text-xs text-primary hover:underline">
                      Démarrer un projet →
                    </button>
                  </a>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="divide-y divide-border">
                    {recentProjects.map((p) => (
                      <Link key={p.id} href={`/dashboard/projets/${p.id}`}>
                        <div className="flex items-center gap-4 px-4 py-3 hover:bg-card/50 transition-colors cursor-pointer">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {p.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {TYPE_LABEL[p.type] ?? p.type}
                            </p>
                          </div>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                            {STATUS_LABEL[p.status] ?? p.status}
                          </span>
                          {p.amount && (
                            <span className="text-sm font-semibold shrink-0">
                              {p.amount.toLocaleString("fr-FR")} €
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Devis */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mes devis récents
                </h2>
                <Link href="/dashboard/devis">
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                    Voir tout <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
              {recentQuotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 rounded-2xl border border-dashed border-border text-center">
                  <FileText className="w-7 h-7 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Aucun devis pour l'instant
                  </p>
                  <Link href="/dashboard/devis">
                    <button className="mt-2 text-xs text-primary hover:underline">
                      Demander un devis →
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-card/50">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          Type
                        </th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">
                          Détails
                        </th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          Statut
                        </th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          Montant
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentQuotes.map((q, i) => {
                        const s = QUOTE_STATUS_LABEL[q.status] ?? {
                          label: q.status,
                          color:
                            "bg-secondary text-secondary-foreground border-border",
                        };
                        return (
                          <tr
                            key={q.id}
                            className={`hover:bg-card/50 transition-colors cursor-pointer ${i < recentQuotes.length - 1 ? "border-b border-border" : ""}`}
                          >
                            <td className="px-4 py-3 text-sm font-medium">
                              {TYPE_LABEL[q.serviceType] ?? q.serviceType}
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <Link href={`/dashboard/devis/${q.id}`}>
                                <span className="text-xs text-muted-foreground hover:text-primary transition-colors line-clamp-1">
                                  {q.details}
                                </span>
                              </Link>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full border ${s.color}`}
                              >
                                {s.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-xs font-semibold">
                              {q.amount
                                ? `${q.amount.toLocaleString("fr-FR")} €`
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Raccourcis */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Accès rapide
            </h2>
            <div className="space-y-2">
              {[
                {
                  href: "/dashboard/demandes",
                  label: "Mes demandes",
                  icon: Bell,
                },
                {
                  href: "/dashboard/livrables",
                  label: "Livrables",
                  icon: FolderOpen,
                },
                {
                  href: "/dashboard/validations",
                  label: "Validations en attente",
                  icon: FileText,
                },
                {
                  href: "/dashboard/messages",
                  label: "Messagerie",
                  icon: ArrowRight,
                },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors cursor-pointer group">
                    <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.label}
                    </span>
                    <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
