import { statusConfig, typeConfig } from "./constants";

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? {
    label: status,
    color: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const cfg = typeConfig[type] ?? {
    label: type,
    color: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}
