import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Link } from "wouter";
import { TALLY_CLIENT_URL } from "@/components/PublicLayout";
import { Search, Grid3X3, List, Plus, FolderOpen, Loader2 } from "lucide-react";
import { useListProjects } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const STATUS_PILLS = [
  { key: "all", label: "Tous" },
  { key: "production", label: "Production" },
  { key: "livraison_client", label: "Livraison" },
  { key: "verification", label: "Vérification" },
  { key: "validation_finale", label: "Validé" },
  { key: "archive", label: "Archivé" },
];

const STATUS_LABEL: Record<string, string> = {
  lead: "Demande", devis: "Devis", production: "Production",
  post_production: "Post-prod", livraison_agence: "Livr. agence",
  verification: "Vérification", livraison_client: "Livraison",
  correction: "Correction", validation_finale: "Validé",
  notation: "Notation", archive: "Archivé", termine: "Terminé",
};

const STATUS_COLOR: Record<string, string> = {
  lead: "bg-slate-500/10 text-slate-400",
  devis: "bg-yellow-500/10 text-yellow-400",
  production: "bg-violet-500/10 text-violet-400",
  post_production: "bg-violet-500/10 text-violet-400",
  livraison_agence: "bg-blue-500/10 text-blue-400",
  verification: "bg-orange-500/10 text-orange-400",
  livraison_client: "bg-blue-500/10 text-blue-400",
  correction: "bg-red-500/10 text-red-400",
  validation_finale: "bg-emerald-500/10 text-emerald-400",
  notation: "bg-emerald-500/10 text-emerald-400",
  archive: "bg-slate-500/10 text-slate-400",
  termine: "bg-emerald-500/10 text-emerald-400",
};

const TYPE_LABEL: Record<string, string> = {
  mariage: "Mariage", clip: "Clip", corporate: "Corporate",
  reseaux: "Réseaux", evenement: "Événement", pub: "Pub", autre: "Autre",
};

export default function Projects() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: projects = [], isLoading } = useListProjects();

  const filtered = projects.filter(p => {
    const matchSearch = search === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mes projets</h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} projet{filtered.length > 1 ? "s" : ""}</p>
          </div>
          <a href={TALLY_CLIENT_URL} target="_blank" rel="noopener noreferrer">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0">
              <Plus className="w-4 h-4" /> Nouvelle demande
            </button>
          </a>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un projet…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border">
            <button onClick={() => setViewMode("grid")} className={cn("p-1.5 rounded-lg transition-colors", viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded-lg transition-colors", viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_PILLS.map(s => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                statusFilter === s.key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
              {s.key !== "all" && <span className="ml-1.5 opacity-60">{projects.filter(p => p.status === s.key).length}</span>}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border text-center">
            <FolderOpen className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {search || statusFilter !== "all" ? "Aucun résultat" : "Aucun projet pour l'instant"}
            </p>
            {!search && statusFilter === "all" && (
              <a href={TALLY_CLIENT_URL} target="_blank" rel="noopener noreferrer">
                <button className="mt-3 text-xs text-primary hover:underline">Faire une demande →</button>
              </a>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <Link key={p.id} href={`/dashboard/projets/${p.id}`}>
                <div className="flex flex-col gap-3 p-5 rounded-2xl border border-border bg-card/50 hover:bg-card hover:border-border/80 transition-all cursor-pointer h-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FolderOpen className="w-4 h-4 text-primary" />
                    </div>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", STATUS_COLOR[p.status] ?? "bg-secondary text-secondary-foreground")}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold line-clamp-1">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{TYPE_LABEL[p.type] ?? p.type}</p>
                  </div>
                  {p.amount && <p className="text-sm font-bold mt-auto">{p.amount.toLocaleString("fr-FR")} €</p>}
                  {p.deliveryDate && (
                    <p className="text-xs text-muted-foreground">Livraison : {new Date(p.deliveryDate).toLocaleDateString("fr-FR")}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Projet</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Livraison</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Budget</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className={`hover:bg-card/50 transition-colors ${i < filtered.length - 1 ? "border-b border-border" : ""}`}>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/projets/${p.id}`}>
                        <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer block">{p.title}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">{TYPE_LABEL[p.type] ?? p.type}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2.5 py-1 rounded-full", STATUS_COLOR[p.status] ?? "bg-secondary text-secondary-foreground")}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {p.deliveryDate ? new Date(p.deliveryDate).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold">{p.amount ? `${p.amount.toLocaleString("fr-FR")} €` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
