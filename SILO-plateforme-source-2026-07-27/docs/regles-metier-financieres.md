# Regles metier et financieres SILO

## Acteurs

| Role | Perimetre principal |
|---|---|
| Client | Demandes, projets, abonnements, fichiers, paiements, validations et avis |
| Partenaire | Missions attribuees, brief, livrables, corrections, remuneration et FRP |
| Conseiller | Qualification, reservation, attribution, suivi, relances, qualite et cloture |
| Admin | Utilisateurs, permissions, finance, FRP, audit, parametrage et supervision |

Un partenaire peut etre une agence ou un prestataire individuel. L'inscription
est gratuite, sans abonnement et sans engagement.

## Tarification

- Prestation ponctuelle : devis de 800 EUR HT minimum.
- Abonnement : 600 EUR HT par mois minimum, sans engagement.
- Packs sociaux existants : 690, 1 190 et 1 990 EUR HT par mois.
- TVA de reference pour les simulations : 20 %.

## Ventilation d'une commande

La plateforme calcule les montants a partir du HT en centimes :

| Flux | Taux |
|---|---:|
| Prestataires | 70 % |
| Commission brute SILO | 20 % |
| FRP | 10 % |

Hypotheses de pilotage du business plan :

- frais PSP : 2 % du GMV ;
- part PSP prestataires : 77,78 % des frais ;
- part PSP SILO : 22,22 % des frais ;
- aucun frais PSP impute au FRP ;
- reserve incidents et remboursements : 0,5 % du GMV ;
- prime conseiller : 8 % de la commission SILO, soit 1,6 % du GMV suivi.

Pour 800 EUR HT, le moteur doit produire :

| Element | Montant |
|---|---:|
| Prestataires brut | 560,00 EUR |
| FRP | 80,00 EUR |
| SILO brut | 160,00 EUR |
| Frais PSP portes par SILO | 3,56 EUR |
| SILO apres PSP | 156,44 EUR |

Les frais PSP reels du prestataire de paiement remplacent les hypotheses lors du
rapprochement.

## Visibilite

- Le client voit le prix total et ses paiements.
- Le partenaire voit uniquement sa remuneration et son compte FRP.
- Le conseiller voit les informations financieres uniquement si l'admin lui a
  accorde ce droit.
- L'admin voit la ventilation, les frais, les mouvements et les rapprochements.

## FRP

Le FRP est une dette envers les partenaires et ne finance jamais les charges de
SILO. Chaque contribution et sortie doit etre journalisee et rapprochee.

Deux documents se contredisent sur la date de traitement :

- le cahier des charges indique novembre, avec un seuil de 24 transactions ;
- le business plan bancaire indique la date anniversaire de la premiere transaction.

Le code ne doit donc pas automatiser un reversement irreversible avant validation
juridique, comptable et direction. La regle de date et le seuil seront
parametrables.

## Conseillers

- Capacite maximale : 80 dossiers actifs.
- Seuil d'alerte et d'anticipation : 72 dossiers actifs.
- Portefeuille cible : jusqu'a 50 partenaires suivis.
- La prime variable est rattachee aux transactions effectivement suivies.
- Un recrutement est conditionne au volume signe et a la tresorerie disponible.

## Paiements et incidents

- Le client paie 100 % apres acceptation du devis.
- Annulation avant commencement : remboursement total.
- Annulation apres debut de preparation : remboursement de 90 %, sous reserve
  des contrats et du droit applicable.
- Defaillance partenaire : remplacement ou remboursement selon le dossier.
- Chaque commande, facture, beneficiaire et paiement fait l'objet d'un
  rapprochement.

## Points a valider avant production

- PSP et traitement des fonds de tiers ;
- mandat d'intermediation et mandat de facturation ;
- politique FRP et calendrier de reversement ;
- TVA selon le statut de chaque prestataire ;
- conditions d'annulation, retractation et travail deja execute ;
- traitement de la prime conseiller et charges sociales.
