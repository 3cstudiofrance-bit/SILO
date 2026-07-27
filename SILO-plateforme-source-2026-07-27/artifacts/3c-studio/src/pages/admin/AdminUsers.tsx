import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Briefcase,
  Building2,
  Clock,
  Loader2,
  Mail,
  Search,
  Shield,
  User,
  Users,
} from "lucide-react";
import { useListUsers } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const ROLE_CONFIG = {
  client: {
    label: "Client",
    icon: User,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  pm: {
    label: "Conseiller",
    icon: Briefcase,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  partner: {
    label: "Partenaire",
    icon: Building2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
};

const ROLE_FILTERS = ["all", "client", "pm", "partner", "admin"] as const;

export default function AdminUsers() {
  const { data: users = [], isLoading } = useListUsers();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<(typeof ROLE_FILTERS)[number]>("all");

  const filtered = users.filter((user) => {
    const query = search.trim().toLowerCase();
    const matchSearch =
      !query ||
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);
    const matchRole = roleFilter === "all" || user.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Utilisateurs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {users.length} comptes Clerk synchronisés
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(ROLE_CONFIG).map(([role, config]) => (
            <div key={role} className="border border-border bg-card p-4">
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1 border w-fit mb-3",
                  config.bg,
                )}
              >
                <config.icon className={cn("w-3.5 h-3.5", config.color)} />
                <span className={cn("text-xs font-medium", config.color)}>
                  {config.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {users.filter((user) => user.role === role).length}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom ou e-mail"
              className="w-full bg-card border border-border pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/40"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {ROLE_FILTERS.map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={cn(
                  "px-3 py-2 text-xs font-medium border",
                  roleFilter === role
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-card text-muted-foreground border-border hover:text-foreground",
                )}
              >
                {role === "all" ? "Tous" : ROLE_CONFIG[role].label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border border-border bg-card overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">
                    Utilisateur
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">
                    Rôle
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">
                    Projets
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">
                    Inscription
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((user) => {
                  const role = ROLE_CONFIG[user.role];
                  const initials = user.name.slice(0, 2).toUpperCase();
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {initials}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {user.name}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                              <Mail className="w-3 h-3" />
                              {user.email || "E-mail non renseigné"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 border text-xs font-medium w-fit",
                            role.bg,
                            role.color,
                          )}
                        >
                          <role.icon className="w-3 h-3" />
                          {role.label}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-sm">
                        {user.projects}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                          <Clock className="w-3 h-3" />
                          {new Date(user.joinedAt).toLocaleDateString("fr-FR")}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            user.status === "active"
                              ? "text-emerald-400"
                              : "text-red-400",
                          )}
                        >
                          {user.status === "active" ? "Actif" : "Suspendu"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-7 h-7 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aucun utilisateur trouvé
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
