/**
 * Définitions des fonctionnalités activables (CDC §14) — source de vérité serveur.
 * Sensible = OFF par défaut, activation Admin uniquement.
 * pmDelegable = le PM peut poser des overrides si l'admin lui a délégué la clé.
 */
export interface FeatureDef {
  key: string;
  label: string;
  category: string;
  sensitive: boolean;
  pmDelegable: boolean;
}

export const FEATURES: FeatureDef[] = [
  { key: "messagerie_client_pm", label: "Messagerie client ↔ PM", category: "Communication", sensitive: false, pmDelegable: true },
  { key: "messagerie_pm_agence", label: "Messagerie PM ↔ agence/partenaire individuel", category: "Communication", sensitive: false, pmDelegable: true },
  { key: "comm_directe_client_agence", label: "Communication directe client ↔ agence (si autorisée)", category: "Communication", sensitive: true, pmDelegable: true },
  { key: "appels_click_to_call", label: "Appels téléphoniques / click-to-call", category: "Communication", sensitive: true, pmDelegable: false },
  { key: "messages_vocaux", label: "Messages vocaux", category: "Communication", sensitive: true, pmDelegable: false },
  { key: "notes_internes", label: "Notes de suivi internes", category: "Communication", sensitive: false, pmDelegable: true },
  { key: "escalade_agence_pm", label: "Escalades agence → PM", category: "Communication", sensitive: false, pmDelegable: true },
  { key: "escalade_pm_admin", label: "Escalades PM → Admin", category: "Communication", sensitive: false, pmDelegable: false },
  { key: "upload_fichiers", label: "Upload de fichiers", category: "Fichiers & livrables", sensitive: false, pmDelegable: true },
  { key: "telechargement_livrables", label: "Téléchargement des livrables", category: "Fichiers & livrables", sensitive: false, pmDelegable: true },
  { key: "commentaires_livrables", label: "Commentaires sur les livrables", category: "Fichiers & livrables", sensitive: false, pmDelegable: true },
  { key: "validation_livrables_client", label: "Validation des livrables par le client", category: "Fichiers & livrables", sensitive: false, pmDelegable: true },
  { key: "acces_fichiers_sensibles", label: "Accès aux fichiers sensibles", category: "Fichiers & livrables", sensitive: true, pmDelegable: false },
  { key: "signature_electronique", label: "Signature électronique", category: "Contrats & paiements", sensitive: true, pmDelegable: false },
  { key: "paiement_en_ligne", label: "Paiement en ligne", category: "Contrats & paiements", sensitive: true, pmDelegable: false },
  { key: "paiement_plusieurs_fois", label: "Paiement en plusieurs fois", category: "Contrats & paiements", sensitive: true, pmDelegable: false },
  { key: "acces_devis", label: "Accès aux devis", category: "Contrats & paiements", sensitive: false, pmDelegable: true },
  { key: "acces_factures", label: "Accès aux factures", category: "Contrats & paiements", sensitive: true, pmDelegable: false },
  { key: "acces_contrats", label: "Accès aux contrats", category: "Contrats & paiements", sensitive: true, pmDelegable: false },
  { key: "choix_agence_client", label: "Choix de l'agence par le client", category: "Attribution & vitrine", sensitive: true, pmDelegable: true },
  { key: "portfolio_partenaire", label: "Affichage du portfolio partenaire", category: "Attribution & vitrine", sensitive: false, pmDelegable: true },
  { key: "affichage_score_agence", label: "Affichage du score agence", category: "Attribution & vitrine", sensitive: true, pmDelegable: true },
  { key: "affichage_score_pm", label: "Affichage du score PM", category: "Attribution & vitrine", sensitive: true, pmDelegable: false },
  { key: "mise_en_avant_partenaire", label: "Mise en avant d'un partenaire sur le site", category: "Attribution & vitrine", sensitive: true, pmDelegable: false },
  { key: "acces_statistiques", label: "Accès aux statistiques", category: "Données & finance", sensitive: true, pmDelegable: false },
  { key: "acces_infos_financieres", label: "Accès aux informations financières", category: "Données & finance", sensitive: true, pmDelegable: false },
  { key: "acces_frp", label: "Accès au FRP", category: "Données & finance", sensitive: true, pmDelegable: false },
  { key: "notifications_auto", label: "Notifications automatiques", category: "Automatisations", sensitive: false, pmDelegable: true },
  { key: "relances_auto", label: "Relances automatiques", category: "Automatisations", sensitive: false, pmDelegable: true },
  { key: "creation_auto_compte_client", label: "Création automatique de compte client", category: "Automatisations", sensitive: true, pmDelegable: false },
  { key: "creation_auto_compte_partenaire", label: "Création automatique de compte partenaire", category: "Automatisations", sensitive: true, pmDelegable: false },
];

export function featureDef(key: string): FeatureDef | undefined {
  return FEATURES.find((f) => f.key === key);
}

/** Défaut : sensible → OFF ; non sensible → ON ; clé inconnue → OFF. */
export function defaultEnabled(key: string): boolean {
  const def = featureDef(key);
  return def ? !def.sensitive : false;
}
