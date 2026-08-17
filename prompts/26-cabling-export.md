# Prompt V — Exports enrichis : table CSV des branchements + panneau/légende PNG

Dans le projet plans réseau, enrichis les exports pour documenter les branchements sans surcharger le plan.

- Export CSV « branchements » : en plus des exports existants, génère un CSV qui liste, une ligne par câble : équipement source, port source, équipement cible, port cible, VLAN du lien, label. C'est la table de câblage, à télécharger à côté du plan.
- Export PNG : n'affiche pas les ports sur les câbles, mais ajoute sur le côté de l'image :
  - une légende VLAN (numéro + nom + couleur),
  - un récapitulatif des attributions port ↔ VLAN (une liste synthétique des branchements et VLAN), en encart latéral, pour que l'image soit auto-suffisante sans être noyée sous le texte.
- Garde la cohérence avec la règle export déjà en place (écran allégé, export exhaustif).

Propose la mise en page de l'encart PNG (légende + récap) avant de coder, pour qu'elle reste lisible même sur un grand plan.
