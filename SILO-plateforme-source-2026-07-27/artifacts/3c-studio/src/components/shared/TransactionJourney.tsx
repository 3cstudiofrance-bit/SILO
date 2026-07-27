import { CheckCircle, Circle, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRANSACTION_JOURNEY, journeyStepForStatus } from "@/lib/finance";

/**
 * Parcours de transaction en 11 étapes (CDC) :
 * demande → analyse PM → présélection → dispo agences → proposition →
 * choix client → confirmation → prestation → supervision → clôture+note → renouvellement.
 */
export function TransactionJourney({ status }: { status: string }) {
  const current = journeyStepForStatus(status);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Parcours de transaction — 11 étapes
      </h3>
      <ol className="space-y-0">
        {TRANSACTION_JOURNEY.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                {done ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : active ? (
                  <CircleDot className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                )}
                {i < TRANSACTION_JOURNEY.length - 1 && (
                  <div className={cn("w-px flex-1 min-h-4 my-0.5", done ? "bg-emerald-400/40" : "bg-border")} />
                )}
              </div>
              <div className="pb-4 -mt-0.5">
                <p className={cn(
                  "text-sm font-medium leading-tight",
                  active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                )}>
                  {i + 1}. {step.label}
                </p>
                {active && <p className="text-xs text-muted-foreground mt-1">{step.description}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
