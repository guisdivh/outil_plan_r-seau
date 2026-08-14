# Prompt A — Rattachement nœud → zone plus fiable

Dans le projet plans réseau, améliore le rattachement des équipements aux zones. Actuellement recomputeZoneAssignments teste uniquement le point central du nœud et, en cas de zones qui se chevauchent, garde arbitrairement la dernière de la liste.

Change ce comportement :

- Un nœud appartient à une zone si sa boîte englobante (pas juste son centre) est majoritairement dans la zone.
- En cas de chevauchement de zones, rattache à la zone la plus petite (la plus spécifique) qui contient le nœud, ou à défaut celle du dessus.
- Prévois le cas où une zone représentera plus tard un vrai sous-réseau (champ optionnel subnet/vlan sur la zone, non bloquant si vide).

Garde le modèle de données compatible avec l'existant. Explique-moi ce que tu changes avant de coder.
