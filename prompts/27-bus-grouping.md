# Prompt W — Regroupement visuel des câbles en bus

Dans le projet plans réseau, ajoute un mode d'affichage « bus » pour regrouper visuellement plusieurs câbles qui vont vers un même équipement (cas typique : 16 bornes WiFi reliées au même switch, dont les câbles forment un paquet illisible).

- Déclenchement : je sélectionne plusieurs câbles (multi-sélection déjà en place), puis un bouton « grouper en bus ». Les câbles sélectionnés sont alors rendus comme un tronc commun (un segment partagé) sur lequel chaque équipement se branche par une courte dérivation, au lieu de converger en éventail.
- Réversible : un bouton « dégrouper » (ou re-clic sur la bascule) rétablit l'affichage des câbles séparés.
- CRITIQUE — c'est purement visuel : les liens individuels doivent rester intacts dans la donnée (chaque lien garde son sourceId/targetId, ses ports, son vlanId, ses waypoints). Le bus est un mode de rendu d'un groupe de liens, PAS une fusion en un seul lien. Rien ne doit être perdu à l'export JSON ni dans la table CSV des branchements.
- Ça doit s'articuler avec le routage orthogonal existant (le tracé en angles droits), pas le remplacer : propose comment les deux cohabitent.

Montre-moi ton approche (comment tu stockes l'appartenance à un bus sans casser les liens, et comment tu rends le tronc + les dérivations) avant de coder.
