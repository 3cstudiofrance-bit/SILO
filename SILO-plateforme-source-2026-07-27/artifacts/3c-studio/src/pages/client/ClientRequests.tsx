import { useState } from "react";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  Clock,
  FileText,
  Inbox,
  Info,
  Loader2,
  Plus,
  XCircle,
} from "lucide-react";
import {
  getListQuotesQueryKey,
  useCreateQuote,
  useListQuotes,
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QUOTE_FLOOR_ABONNEMENT_HT,
  QUOTE_FLOOR_PONCTUEL_HT,
} from "@/lib/finance";
import { useToast } from "@/hooks/use-toast";

type RequestFormula = "ponctuel" | "abonnement";
type RequestType =
  | "mariage"
  | "clip"
  | "corporate"
  | "reseaux"
  | "evenement"
  | "pub";

const TYPE_LABELS: Record<RequestType | "autre", string> = {
  mariage: "Vidéo de mariage",
  clip: "Clip musical",
  corporate: "Film corporate",
  reseaux: "Contenus réseaux sociaux",
  evenement: "Captation d’événement",
  pub: "Spot publicitaire",
  autre: "Autre prestation",
};

const PROJECT_TYPES = Object.keys(TYPE_LABELS).filter(
  (type) => type !== "autre",
) as RequestType[];

const REQUEST_STATUS = {
  en_attente: {
    label: "En analyse",
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    detail: "Votre demande est en cours d’analyse par un conseiller SILO.",
  },
  envoye: {
    label: "Devis reçu",
    icon: FileText,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    detail: "Un devis est disponible dans votre espace.",
  },
  accepte: {
    label: "Acceptée",
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    detail: "Le devis est accepté et le projet peut être engagé.",
  },
  refuse: {
    label: "Refusée",
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    detail: "Cette proposition n’a pas été retenue.",
  },
} as const;

function apiServiceType(type: RequestType) {
  return ["mariage", "clip", "corporate", "reseaux"].includes(type)
    ? (type as "mariage" | "clip" | "corporate" | "reseaux")
    : "autre";
}

function NewRequestDialog() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createQuote = useCreateQuote();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<RequestType | "">("");
  const [formula, setFormula] = useState<RequestFormula>("ponctuel");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);

  const minimum =
    formula === "ponctuel"
      ? QUOTE_FLOOR_PONCTUEL_HT
      : QUOTE_FLOOR_ABONNEMENT_HT;
  const budgetNumber = Number(budget);
  const budgetTooLow =
    budget !== "" &&
    Number.isFinite(budgetNumber) &&
    budgetNumber < minimum;

  const reset = () => {
    setTitle("");
    setType("");
    setFormula("ponctuel");
    setDescription("");
    setBudget("");
    setDeadline("");
    setError(null);
  };

  const submit = () => {
    if (!title.trim()) return setError("Donnez un titre à votre demande.");
    if (!type) return setError("Choisissez un type de prestation.");
    if (!description.trim()) return setError("Décrivez votre besoin.");
    if (!Number.isFinite(budgetNumber) || budgetNumber <= 0) {
      return setError("Indiquez un budget indicatif en EUR HT.");
    }
    if (!deadline) return setError("Indiquez une échéance souhaitée.");

    const clientEmail = user?.primaryEmailAddress?.emailAddress;
    if (!user || !clientEmail) {
      setError("Votre profil doit contenir une adresse e-mail.");
      return;
    }

    createQuote.mutate(
      {
        data: {
          serviceType: apiServiceType(type),
          clientName: user.fullName || user.firstName || "Client",
          clientEmail,
          clientUserId: user.id,
          details: [
            title.trim(),
            "",
            description.trim(),
            `Formule : ${formula === "ponctuel" ? "ponctuelle" : "abonnement mensuel"}`,
            `Échéance souhaitée : ${deadline}`,
            `Type initial : ${type}`,
          ].join("\n"),
          budget: `${budgetNumber} EUR HT${formula === "abonnement" ? "/mois" : ""}`,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListQuotesQueryKey(),
          });
          toast({
            title: "Demande envoyée",
            description: "Un conseiller SILO va la qualifier.",
          });
          reset();
          setOpen(false);
        },
        onError: () => {
          setError("La demande n’a pas pu être enregistrée.");
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle demande
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle demande de prestation</DialogTitle>
          <DialogDescription>
            Décrivez votre projet. Un conseiller dédié le qualifiera avant
            l’envoi du devis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="request-title">Titre</Label>
            <Input
              id="request-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex. Film corporate de présentation"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type de prestation</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as RequestType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((projectType) => (
                    <SelectItem key={projectType} value={projectType}>
                      {TYPE_LABELS[projectType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Formule</Label>
              <Select
                value={formula}
                onValueChange={(value) =>
                  setFormula(value as RequestFormula)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ponctuel">
                    Prestation ponctuelle
                  </SelectItem>
                  <SelectItem value="abonnement">
                    Abonnement mensuel
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="request-description">Description</Label>
            <Textarea
              id="request-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Contexte, objectifs, livrables attendus et lieu"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="request-budget">
                Budget indicatif (EUR HT
                {formula === "abonnement" ? "/mois" : ""})
              </Label>
              <Input
                id="request-budget"
                type="number"
                min={0}
                step={50}
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder={String(minimum)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="request-deadline">Échéance souhaitée</Label>
              <Input
                id="request-deadline"
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </div>
          </div>

          <div
            className={cn(
              "flex items-start gap-2.5 p-3 border text-xs",
              budgetTooLow
                ? "bg-amber-400/10 border-amber-400/30 text-amber-600 dark:text-amber-400"
                : "bg-blue-400/5 border-blue-400/20 text-muted-foreground",
            )}
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Plancher commercial : {minimum} EUR HT
              {formula === "abonnement" ? "/mois" : ""}.
              {budgetTooLow &&
                " Votre demande peut être étudiée, mais aucun devis ne sera émis sous ce plancher."}
            </p>
          </div>

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={createQuote.isPending}>
            {createQuote.isPending ? "Envoi..." : "Envoyer la demande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientRequests() {
  const { data: requests = [], isLoading } = useListQuotes();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Mes demandes
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Vos demandes de prestation et leur avancement.
            </p>
          </div>
          <div className="sm:ml-auto">
            <NewRequestDialog />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border text-center">
            <Inbox className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Aucune demande
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const status = REQUEST_STATUS[request.status];
              return (
                <div
                  key={request.id}
                  className="border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {TYPE_LABELS[request.serviceType]}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-line">
                      {request.details}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {status.detail}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium",
                        status.color,
                        status.bg,
                      )}
                    >
                      <status.icon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-start gap-3 p-4 bg-blue-400/5 border border-blue-400/20">
          <Inbox className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Chaque demande est analysée par un conseiller SILO, puis transformée
            en devis avant tout engagement ou paiement.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
