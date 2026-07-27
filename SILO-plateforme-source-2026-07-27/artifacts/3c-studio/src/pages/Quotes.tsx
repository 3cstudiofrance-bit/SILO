import { DashboardLayout } from "@/components/DashboardLayout";
import { useListQuotes, useCreateQuote, getListQuotesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Plus, X, ArrowRight } from "lucide-react";
import { useState } from "react";

const quoteStatusLabels: Record<string, { label: string; color: string }> = {
  en_attente: { label: "En attente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  envoye: { label: "Envoyé", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  accepte: { label: "Accepté", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  refuse: { label: "Refusé", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const typeLabels: Record<string, string> = {
  mariage: "Film de mariage", clip: "Clip artiste", corporate: "Vidéo corporate", reseaux: "Réseaux sociaux", autre: "Autre",
};

const schema = z.object({
  serviceType: z.enum(["mariage", "clip", "corporate", "reseaux", "autre"]),
  details: z.string().min(20, "Décrivez votre projet (min. 20 caractères)"),
  budget: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export default function Quotes() {
  const { data: quotes, isLoading } = useListQuotes();
  const createQuote = useCreateQuote();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { serviceType: "mariage", details: "", budget: "" },
  });

  const onSubmit = (data: Form) => {
    createQuote.mutate({
      data: {
        serviceType: data.serviceType,
        clientName: user?.fullName || user?.firstName || "Client",
        clientEmail: user?.emailAddresses[0]?.emailAddress || "",
        clientUserId: user?.id,
        details: data.details,
        budget: data.budget || null,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Devis soumis", description: "Nous vous répondrons sous 48h." });
        queryClient.invalidateQueries({ queryKey: getListQuotesQueryKey() });
        setShowForm(false);
        form.reset();
      },
      onError: () => {
        toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold mb-1">Mes devis</h1>
            <p className="text-muted-foreground text-sm">{quotes?.length ?? 0} devis</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" /> Demander un devis
          </button>
        </div>

        {showForm && (
          <div className="rounded-xl border border-border bg-card mb-6 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Nouvelle demande de devis</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type de prestation *</label>
                <select {...form.register("serviceType")} className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="mariage">Film de mariage</option>
                  <option value="clip">Clip artiste</option>
                  <option value="corporate">Vidéo corporate</option>
                  <option value="reseaux">Réseaux sociaux</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Décrivez votre projet *</label>
                <textarea {...form.register("details")} rows={4} className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" placeholder="Date, lieu, style souhaité, toute information utile..." />
                {form.formState.errors.details && <p className="text-xs text-destructive mt-1">{form.formState.errors.details.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Budget estimé</label>
                <input {...form.register("budget")} className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="ex: 2 000 €" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createQuote.isPending} className="px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60">
                  {createQuote.isPending ? "Envoi..." : "Soumettre le devis"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 rounded-lg border border-border text-sm hover:bg-secondary transition-all">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-card rounded-xl animate-pulse border border-border" />)}
          </div>
        ) : quotes?.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/50 py-24 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-xl font-semibold mb-2">Aucun devis</h2>
            <p className="text-muted-foreground text-sm mb-6">Demandez un devis pour démarrer votre projet.</p>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all">
              <Plus className="w-4 h-4" /> Demander un devis
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {quotes?.map((q) => (
                <Link key={q.id} href={`/dashboard/devis/${q.id}`}>
                  <div className="flex items-center justify-between px-6 py-4 hover:bg-white/3 transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{typeLabels[q.serviceType] || q.serviceType}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{q.details}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{new Date(q.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {q.amount && <span className="text-sm font-semibold">{q.amount.toLocaleString("fr-FR")} €</span>}
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${quoteStatusLabels[q.status]?.color}`}>
                        {quoteStatusLabels[q.status]?.label || q.status}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
