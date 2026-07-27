import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: number;
  trendLabel?: string;
  description?: string;
  accent?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, trendLabel, description, accent = "text-primary", className }: StatCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNeutral = trend === undefined || trend === 0;

  return (
    <div className={cn("bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-border/80 transition-colors", className)}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10")}>
            <Icon className={cn("w-4 h-4", accent)} />
          </div>
        )}
      </div>

      <div className="flex items-end gap-2.5">
        <span className="text-3xl font-bold tracking-tight leading-none">{value}</span>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-medium mb-0.5",
            isNeutral ? "text-muted-foreground" : isPositive ? "text-emerald-400" : "text-red-400"
          )}>
            {isNeutral ? <Minus className="w-3 h-3" /> : isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{isPositive ? "+" : ""}{trend}{trendLabel || ""}</span>
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      )}
    </div>
  );
}
