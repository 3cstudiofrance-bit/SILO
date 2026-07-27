import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Link } from "wouter";
import { Search, FolderOpen, Loader2 } from "lucide-react";
import { useListProjects } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const STATUS_PILLS = [
  { key: "all", label: "Tous" },
  { key: "lead", label: "Demande" },
  { key: "devis", label: "Devis" },
  { key: "production", label: "Production" },
  { key: "livraison_client", label: "Livraison" },
  { key: "validation_finale", label: "Validé" },
  { key: "archive", label: "Archivé" },
];
const TYPE_LABEL: Record<string, string> = {
  mariage: "Mariage", clip: "Clip", corporate: "Corporate",
  reseaux: "Réseaux", evenement: "Événement", pub: "Pub", autre: "Autre",
};
const STATUS_LABEL: Record<string, string> = {
  lead: "Demande", devis: "Devis", production: "Production",
  post_production: "Post-prod", livraison_agence: "Livr. agence",
  verification: "Vérif.", livraison_client: "Livr. client",
  correction: "Correction", validation_finale: "Validé",
  notation: "Notation", archive: "Archivé", termine: "Terminé",
};

export default function AdminProjects() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: projects = [], isLoading } = useListProjects();

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search || p.title.toLowerCase().includes(q) || p.clientName?.toLowerCase().includes(q) || p.clientEmail?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tous les projets</h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} projet{filtered.length > 1 ? "s" : ""} — {projects.length} au total</p>
          </div>
        </div>

        {/* Search + status pills */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Projet, client…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_PILLS.map(s => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                statusFilter === s.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
              {s.key !== "all" && (
                <span className="ml-1.5 opacity-60">{projects.filter(p => p.status === s.key).length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border text-center">
            <FolderOpen className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">{search || statusFilter !== "all" ? "Aucun résultat" : "Aucun projet créé"}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Projet</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden xl:table-cell">Conseiller</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Livraison</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Budget</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className={`hover:bg-card/50 transition-colors ${i < filtered.length - 1 ? "border-b border-border" : ""}`}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/projets/${p.id}`}>
                        <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer block">{p.title}</span>
                      </Link>
                      <span className="text-xs text-muted-foreground">{p.clientName}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">{TYPE_LABEL[p.type] ?? p.type}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">{STATUS_LABEL[p.status] ?? p.status}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground font-mono">
                      {p.advisorUserId ?? "Non affecté"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {p.deliveryDate ? new Date(p.deliveryDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—"}
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
