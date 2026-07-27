export const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  lead:            { label: "Lead",           color: "bg-slate-100 text-slate-600 border-slate-200",      dot: "bg-slate-400" },
  devis:           { label: "Devis",          color: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-400" },
  production:      { label: "Production",     color: "bg-blue-50 text-blue-700 border-blue-200",          dot: "bg-blue-500" },
  post_production: { label: "Post-prod.",     color: "bg-violet-50 text-violet-700 border-violet-200",    dot: "bg-violet-500" },
  livraison:       { label: "Livraison",      color: "bg-cyan-50 text-cyan-700 border-cyan-200",          dot: "bg-cyan-500" },
  termine:         { label: "Terminé",        color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  annule:          { label: "Annulé",         color: "bg-red-50 text-red-600 border-red-200",             dot: "bg-red-500" },
};

export const typeConfig: Record<string, { label: string; color: string }> = {
  mariage:   { label: "Mariage",         color: "bg-rose-50 text-rose-700 border-rose-200" },
  clip:      { label: "Clip artiste",    color: "bg-blue-50 text-blue-700 border-blue-200" },
  corporate: { label: "Corporate",       color: "bg-slate-100 text-slate-700 border-slate-200" },
  reseaux:   { label: "Réseaux sociaux", color: "bg-purple-50 text-purple-700 border-purple-200" },
};

export const statusProgress: Record<string, number> = {
  lead: 5, devis: 15, production: 40, post_production: 70, livraison: 90, termine: 100, annule: 0,
};
