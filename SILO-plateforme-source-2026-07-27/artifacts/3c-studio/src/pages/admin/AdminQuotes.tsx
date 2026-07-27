import { DashboardLayout } from "@/components/DashboardLayout";
import { useListQuotes, useUpdateQuote, getListQuotesQueryKey, getGetQuoteQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FileText, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const quoteStatusLabels: Record<string, { label: string; color: string }> = {
  en_attente: { label: "En attente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  envoye: { label: "Envoyé", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  accepte: { label: "Accepté", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  refuse: { label: "Refusé", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const typeLabels: Record<string, string> = {
  mariage: "Mariage", clip: "Clip artiste", corporate: "Corporate", reseaux: "Réseaux", autre: "Autre",
};

function QuoteRow({ quote }: { quote: any }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const updateQuote = useUpdateQuote();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState(quote.status);
  const [amount, setAmount] = useState(quote.amount?.toString() || "");
  const [notes, setNotes] = useState(quote.notes || "");

  const save = () => {
    updateQuote.mutate({
      id: quote.id,
      data: {
        status,
        amount: amount ? Number(amount) : undefined,
        notes: notes || undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Devis mis à jour" });
        queryClient.invalidateQueries({ queryKey: getListQuotesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetQuoteQueryKey(quote.id) });
        setEditing(false);
      },
      onError: () => toast({ title: "Erreur", variant: "destructive" }),
    });
  };

  return (
    <div className="border-b border-border last:border-0">
      <div
        className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-white/3 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-medium text-sm">{typeLabels[quote.serviceType] || quote.serviceType}</p>
            <span className="text-xs text-muted-foreground">#{quote.id}</span>
          </div>
          <p className="text-xs text-muted-foreground">{quote.clientName} · {quote.clientEmail}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {quote.amount && <span className="text-sm font-semibold">{Number(quote.amount).toLocaleString("fr-FR")} €</span>}
          <span className={`text-xs px-2.5 py-1 rounded-full border ${quoteStatusLabels[quote.status]?.color}`}>
            {quoteStatusLabels[quote.status]?.label || quote.status}
          </span>
          <p className="text-xs text-muted-foreground hidden md:block">
            {new Date(quote.createdAt).toLocaleDateString("fr-FR")}
          </p>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-6 bg-card/50">
          <div className="rounded-lg border border-border bg-background p-4 mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Détails du projet</p>
            <p className="text-sm leading-relaxed">{quote.details}</p>
            {quote.budget && <p className="text-xs text-muted-foreground mt-2">Budget indiqué : {quote.budget}</p>}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5">Statut</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    {Object.entries(quoteStatusLabels).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">Montant (€)</label>
                  <input value={amount} onChange={e => setAmount(e.target.value)} type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">Notes pour le client</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" placeholder="Message visible par le client..." />
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={updateQuote.isPending} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60">
                  <Check className="w-3.5 h-3.5" /> {updateQuote.isPending ? "Sauvegarde..." : "Enregistrer"}
                </button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-xs hover:bg-secondary">
                  <X className="w-3.5 h-3.5" /> Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-all">
                Modifier le devis
              </button>
              <button
                onClick={() => { setStatus("accepte"); setEditing(true); }}
                className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-all"
              >
                Accepter
              </button>
              <button
                onClick={() => { setStatus("refuse"); setEditing(true); }}
                className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all"
              >
                Refuser
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminQuotes() {
  const { data: quotes, isLoading } = useListQuotes();
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? quotes : quotes?.filter(q => q.status === filter);

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-1">Administration</p>
          <h1 className="text-3xl font-semibold">Devis</h1>
          <p className="text-muted-foreground text-sm mt-1">{quotes?.length ?? 0} devis reçus</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {["all", ...Object.keys(quoteStatusLabels)].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {s === "all" ? `Tous (${quotes?.length ?? 0})` : quoteStatusLabels[s]?.label}
              {s !== "all" && ` (${quotes?.filter(q => q.status === s).length ?? 0})`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-card rounded-xl animate-pulse border border-border" />)}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-20 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Aucun devis.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {filtered?.map((q) => <QuoteRow key={q.id} quote={q} />)}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
