---
name: Silo spec rules (corrections utilisateur)
description: Règles du cahier des charges corrigées/confirmées par l'utilisateur, prioritaires sur le CDC extrait dans /tmp.
---

# Règles de spécification confirmées (juillet 2026)

- **Répartition financière** : 70 % agence / 20 % Silo / 10 % FRP, calculée sur le HT. Toute mention « 30/70 sur HT » dans le CDC est obsolète — l'utilisateur l'a explicitement corrigée.
- **Feature flags — sécurité** : les fonctionnalités sensibles sont désactivées par défaut. Seul l'Admin peut les activer (globalement, par rôle, utilisateur, projet ou abonnement). Le PM ne peut activer certaines options que si l'Admin l'y autorise.
- La liste complète des 31 fonctionnalités activables (CDC §14) est détaillée dans `.local/tasks/silo-espaces-finances.md`.
- **Attention** : le CDC extrait vit dans `/tmp/silo_cdc.txt` (éphémère). Les versions corrigées des exigences sont dans les fichiers `.local/tasks/silo-*.md`, qui font foi.

**Why:** L'utilisateur a corrigé le CDC après coup ; un futur agent qui relit le CDC brut appliquerait la mauvaise répartition financière.
**How to apply:** Pour tout travail finances/permissions (tâches Feed, Espaces/finances), utiliser 70/20/10 et le principe « désactivé par défaut », même si un document source dit autre chose.
