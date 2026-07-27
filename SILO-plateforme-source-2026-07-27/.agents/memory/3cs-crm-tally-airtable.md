---
name: 3C Studio — CRM / Tally / Airtable rules
description: Règles du parcours client CRM 3C Studio : base Airtable, champs, logique Tally, affichage conditionnel des prix.
---

# 3C Studio — Parcours client CRM / Tally / Airtable

## Base Airtable

- **Base** : CRM Prospects 3C Studio
- **Table** : Prospects 3C studio

## Champs publics du formulaire (ordre affiché au client)

### 01 - Service recherché *(1ʳᵉ question)*
Options (sans prix, sans aucune mention tarifaire) :
1. Film de mariage
2. Clip artiste
3. Vidéo corporate
4. Gestion mensuelle des réseaux sociaux
5. Événement / captation vidéo
6. Interview professionnelle
7. Publicité digitale
8. Teaser d'entreprise / lancement produit
9. Je ne sais pas encore
10. Autre projet audiovisuel

### 02 - Profil client *(2ᵉ question)*
Options :
- Une entreprise
- Un indépendant / freelance
- Un artiste / label
- Un couple
- Une association
- Un particulier
- Autre

## Champ interne (NE PAS afficher au client)
- **CRM interne - Ancien parcours client** : anciennement « 01 - Parcours client », renommé et réservé à l'usage interne 3C Studio.

## Logique d'affichage conditionnel Tally

Après la question 1 (Service recherché) et la question 2 (Profil client), afficher la section correspondante :

| Choix Q1 | Section affichée | Prix / infos |
|---|---|---|
| Film de mariage | Section Mariage | À partir de **2 400 € TTC** |
| Clip artiste | Section Clip | À partir de **1 800 € TTC** + lien portfolio YouTube |
| Gestion mensuelle des réseaux sociaux | Packs Réseaux Sociaux | Packs **Essentiel**, **Business**, **Premium** (détails dans la section) |
| Vidéo corporate | Section Corporate | Sur devis |
| Interview professionnelle | Section Corporate | Sur devis |
| Publicité digitale | Section Corporate | Sur devis |
| Teaser d'entreprise / lancement produit | Section Corporate | Sur devis |
| Événement / captation vidéo | Section Besoin à préciser | (préciser le besoin) |
| Je ne sais pas encore | Section Besoin à préciser | (préciser le besoin) |
| Autre projet audiovisuel | Section Besoin à préciser | (préciser le besoin) |

## Règle absolue sur les prix

**Les prix ne doivent JAMAIS apparaître dans la première question (01 - Service recherché).** Ils n'apparaissent QUE dans les sections conditionnelles appropriées listées ci-dessus.

**Why:** L'ancien champ « 01 - Parcours client » mélangeait service et tarif dans les options, ce qui polluait l'expérience prospect et le CRM. Le nouveau parcours sépare strictement la qualification du service (Q1 sans prix) de l'affichage tarifaire (sections conditionnelles).

**How to apply:** Toute réponse, modèle Tally, texte formulaire, ou conseil sur le CRM 3C Studio doit respecter cette séparation. Si on demande de rédiger des options pour Q1, écrire uniquement le nom du service, jamais un montant. Si on demande d'intégrer des prix, les placer uniquement dans la section conditionnelle correspondante.
