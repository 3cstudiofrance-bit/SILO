import { DashboardLayout } from "@/components/DashboardLayout";
import { useGetQuote, getGetQuoteQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, CheckCircle, Clock, XCircle, Send } from "lucide-react";

const quoteStatusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle; desc: string }> = {
  en_attente: { label: "En attente", color: "text-yellow-400", icon: Clock, desc: "Votre demande est en cours d'examen. Nous vous répondrons sous 48h." },
  envoye: { label: "Devis envoyé", color: "text-blue-400", icon: Send, desc: "Votre devis est disponible. Contactez-nous pour toute question." },
  accepte: { label: "Accepté", color: "text-green-400", icon: CheckCircle, desc: "Super ! Votre devis a été accepté. La production peut démarrer." },
  refuse: { label: "Refusé", color: "text-red-400", icon: XCircle, desc: "Ce devis n'a pas abouti. N'hésitez pas à nous soumettre une nouvelle demande." },
};

const typeLabels: Record<string, string> = {
  mariage: "Film de mariage", clip: "Clip artiste", corporate: "Vidéo corporate", reseaux: "Réseaux sociaux", autre: "Autre",
};

export default function QuoteDetail() {
  const [, params] = useRoute("/dashboard/devis/:id");
  const id = Number(params?.id);

  const { data: quote, isLoading } = useGetQuote(id, { query: { enabled: !!id, queryKey: getGetQuoteQueryKey(id) } });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl">
          <div className="h-64 bg-card rounded-2xl animate-pulse border border-border" />
        </div>
      </DashboardLayout>
    );
  }

  if (!quote) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl text-center py-24">
          <p className="text-muted-foreground">Devis non trouvé.</p>
          <Link href="/dashboard/devis" className="text-primary text-sm mt-4 inline-block">Retour aux devis</Link>
        </div>
      </DashboardLayout>
    );
  }

  const statusConfig = quoteStatusConfig[quote.status] || quoteStatusConfig.en_attente;
  const StatusIcon = statusConfig.icon;

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <Link href="/dashboard/devis" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour aux devis
        </Link>

        <div className="mb-8">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Devis #{quote.id}</p>
          <h1 className="text-3xl font-semibold">{typeLabels[quote.serviceType] || quote.serviceType}</h1>
        </div>

        <div className={`rounded-xl border p-6 mb-6 bg-card flex items-start gap-4`}>
          <StatusIcon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${statusConfig.color}`} />
          <div>
            <p className={`font-semibold ${statusConfig.color}`}>{statusConfig.label}</p>
            <p className="text-sm text-muted-foreground mt-1">{statusConfig.desc}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card divide-y divide-border mb-6">
          <div className="px-6 py-4">
            <p className="text-xs text-muted-foreground mb-1">Description du projet</p>
            <p className="text-sm leading-relaxed">{quote.details}</p>
          </div>
          {quote.budget && (
            <div className="px-6 py-4 flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Budget estimé</p>
              <p className="text-sm font-medium">{quote.budget}</p>
            </div>
          )}
          {quote.amount && (
            <div className="px-6 py-4 flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Montant proposé</p>
              <p className="text-lg font-bold text-primary">{quote.amount.toLocaleString("fr-FR")} €</p>
            </div>
          )}
          {quote.notes && (
            <div className="px-6 py-4">
              <p className="text-xs text-muted-foreground mb-2">Notes de l'équipe</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{quote.notes}</p>
            </div>
          )}
          <div className="px-6 py-4 flex justify-between text-xs text-muted-foreground">
            <span>Soumis le {new Date(quote.createdAt).toLocaleDateString("fr-FR")}</span>
            <span>Mis à jour le {new Date(quote.updatedAt).toLocaleDateString("fr-FR")}</span>
          </div>
        </div>

        {quote.status === "accepte" && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Devis accepté</h3>
            <p className="text-sm text-muted-foreground">Notre équipe va vous contacter pour démarrer la production.</p>
          </div>
        )}

        {(quote.status === "en_attente" || quote.status === "refuse") && (
          <Link href="/dashboard/messages" className="block text-center py-3.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">
            Nous contacter pour ce devis
          </Link>
        )}
      </div>
    </DashboardLayout>
  );
}
