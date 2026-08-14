# Prompt F — Câbles : édition, nom, VLAN natif, couleur héritée

Dans le projet plans réseau, enrichis les câbles (liens).

- Nom optionnel : je peux nommer un câble si je veux, l'étiquette s'affiche le long du lien.
- VLAN natif : je peux taguer un câble avec un VLAN (parmi ceux définis). Le câble hérite alors de la couleur du VLAN. Sans VLAN, couleur neutre par défaut.
- Édition du tracé : je peux modifier un câble à la main — ajouter/déplacer des points intermédiaires (waypoints) pour contourner un obstacle.

Garde la compatibilité du modèle (un lien a déjà source/target). Ajoute les champs nécessaires (label, vlanId, waypoints) sans casser l'export/import. Explique les changements avant de coder.
