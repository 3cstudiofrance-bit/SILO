import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ShieldAlert, Plus, Trash2, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { FEATURES, FEATURE_CATEGORIES, defaultEnabled, type FlagScopeType } from "@/lib/feature-flags";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetFeatureFlagsState,
  useSetGlobalFeatureFlag,
  useSetFeatureFlagDelegation,
  useCreateFeatureFlagOverride,
  useDeleteFeatureFlagOverride,
  getGetFeatureFlagsStateQueryKey,
  getGetResolvedFeatureFlagsQueryKey,
  useListProjects,
} from "@workspace/api-client-react";

const SCOPE_LABELS: Record<FlagScopeType, string> = {
  global: "Global",
  role: "Rôle",
  user: "Utilisateur",
  project: "Projet",
  subscription: "Abonnement",
};

const ROLES = ["client", "partner", "pm", "admin"];
const SUBSCRIPTIONS = ["essentiel", "business", "premium"];

type OverrideScope = "role" | "user" | "project" | "subscription";

export default function AdminPermissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: flags, isLoading } = useGetFeatureFlagsState();
  const { data: projects } = useListProjects();
  const [overrideDraft, setOverrideDraft] = useState<{ featureKey: string; scope: OverrideScope; target: string; enabled: boolean } | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetFeatureFlagsStateQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetResolvedFeatureFlagsQueryKey() });
  };
  const onError = (e: unknown) =>
    toast({ title: "Refusé par le serveur", description: e instanceof Error ? e.message : "Action non autorisée.", variant: "destructive" });

  const setGlobal = useSetGlobalFeatureFlag({ mutation: { onSuccess: invalidate, onError } });
  const setDelegation = useSetFeatureFlagDelegation({ mutation: { onSuccess: invalidate, onError } });
  const createOverride = useCreateFeatureFlagOverride({
    mutation: {
      onSuccess: () => {
        invalidate();
        setOverrideDraft(null);
        toast({ title: "Exception ajoutée", description: "La règle ciblée est appliquée immédiatement." });
      },
      onError,
    },
  });
  const deleteOverride = useDeleteFeatureFlagOverride({ mutation: { onSuccess: invalidate, onError } });

  const saveOverride = () => {
    if (!overrideDraft) return;
    if (!overrideDraft.target) {
      toast({ title: "Cible manquante", description: "Choisissez la cible de l'exception.", variant: "destructive" });
      return;
    }
    createOverride.mutate({
      data: {
        featureKey: overrideDraft.featureKey,
        scope: overrideDraft.scope,
        target: overrideDraft.target,
        enabled: overrideDraft.enabled,
      },
    });
  };

  const globalMap = (flags?.global ?? {}) as Record<string, boolean>;
  const overridesList = flags?.overrides ?? [];
  const pmDelegations = flags?.pmDelegations ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Permissions & fonctionnalités</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Activation des fonctionnalités : globale, par rôle, utilisateur, projet ou abonnement. Chaque règle est vérifiée et appliquée côté serveur.
          </p>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-400/5 border border-amber-400/20">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="text-amber-400 font-medium">Règle de sécurité :</span> les fonctionnalités sensibles (icône <Lock className="w-3 h-3 inline" />) sont désactivées par défaut.
            Seul l'Admin peut les activer. Le PM ne peut activer une option que si vous lui déléguez ce droit ci-dessous.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement de l'état des fonctionnalités…
          </div>
        )}

        {FEATURE_CATEGORIES.map(cat => (
          <section key={cat} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</h2>
            <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
              {FEATURES.filter(f => f.category === cat).map(f => {
                const enabled = f.key in globalMap ? globalMap[f.key] : defaultEnabled(f.key);
                const overrides = overridesList.filter(o => o.featureKey === f.key);
                const delegated = pmDelegations.includes(f.key);
                const drafting = overrideDraft?.featureKey === f.key;
                return (
                  <div key={f.key} className="px-5 py-3.5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                          {f.label}
                          {f.sensitive && <Lock className="w-3 h-3 text-amber-400" aria-label="Sensible — OFF par défaut" />}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {f.sensitive ? "Sensible — désactivée par défaut" : "Activée par défaut"}
                          {f.pmDelegable && " · délégable au PM"}
                        </p>
                      </div>
                      {f.pmDelegable && (
                        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0" title="Autoriser le PM à activer cette option">
                          Délégation PM
                          <Switch checked={delegated} onCheckedChange={v => setDelegation.mutate({ key: f.key, data: { delegated: v } })} />
                        </label>
                      )}
                      <button
                        onClick={() => setOverrideDraft(drafting ? null : { featureKey: f.key, scope: "role", target: "", enabled: true })}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                        title="Ajouter une exception ciblée"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <Switch checked={enabled} onCheckedChange={v => setGlobal.mutate({ key: f.key, data: { enabled: v } })} />
                    </div>

                    {overrides.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {overrides.map(o => (
                          <span key={o.id} className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border",
                            o.enabled ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/5" : "text-red-400 border-red-400/30 bg-red-400/5"
                          )}>
                            {SCOPE_LABELS[o.scope as FlagScopeType] ?? o.scope}{o.target ? ` : ${o.target}` : ""} — {o.enabled ? "ON" : "OFF"}{o.createdBy === "pm" ? " (PM)" : ""}
                            <button onClick={() => deleteOverride.mutate({ id: o.id })} className="hover:text-foreground"><Trash2 className="w-2.5 h-2.5" /></button>
                          </span>
                        ))}
                      </div>
                    )}

                    {drafting && overrideDraft && (
                      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-background/60 border border-border">
                        <select
                          value={overrideDraft.scope}
                          onChange={e => setOverrideDraft({ ...overrideDraft, scope: e.target.value as OverrideScope, target: "" })}
                          className="rounded-lg bg-card border border-border px-2 py-1.5 text-xs text-foreground"
                        >
                          <option value="role">Par rôle</option>
                          <option value="user">Par utilisateur</option>
                          <option value="project">Par projet</option>
                          <option value="subscription">Par abonnement</option>
                        </select>
                        {overrideDraft.scope === "role" && (
                          <select value={overrideDraft.target} onChange={e => setOverrideDraft({ ...overrideDraft, target: e.target.value })}
                            className="rounded-lg bg-card border border-border px-2 py-1.5 text-xs text-foreground">
                            <option value="">Choisir un rôle…</option>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        )}
                        {overrideDraft.scope === "user" && (
                          <input
                            value={overrideDraft.target}
                            onChange={e => setOverrideDraft({ ...overrideDraft, target: e.target.value })}
                            placeholder="email@exemple.fr"
                            className="rounded-lg bg-card border border-border px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50"
                          />
                        )}
                        {overrideDraft.scope === "project" && (
                          <select value={overrideDraft.target} onChange={e => setOverrideDraft({ ...overrideDraft, target: e.target.value })}
                            className="rounded-lg bg-card border border-border px-2 py-1.5 text-xs text-foreground max-w-56">
                            <option value="">Choisir un projet…</option>
                            {(projects ?? []).map(p => <option key={p.id} value={String(p.id)}>{p.title}</option>)}
                          </select>
                        )}
                        {overrideDraft.scope === "subscription" && (
                          <select value={overrideDraft.target} onChange={e => setOverrideDraft({ ...overrideDraft, target: e.target.value })}
                            className="rounded-lg bg-card border border-border px-2 py-1.5 text-xs text-foreground">
                            <option value="">Choisir un pack…</option>
                            {SUBSCRIPTIONS.map(s => <option key={s} value={s}>Pack {s}</option>)}
                          </select>
                        )}
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          Activer
                          <Switch checked={overrideDraft.enabled} onCheckedChange={v => setOverrideDraft({ ...overrideDraft, enabled: v })} />
                        </label>
                        <button onClick={saveOverride} disabled={createOverride.isPending} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">Ajouter</button>
                        <button onClick={() => setOverrideDraft(null)} className="px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground">Annuler</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </DashboardLayout>
  );
}
