# Prompt U — Restriction des extrémités de tunnel IPsec

Demande hors-batch (discussion directe, pas de fichier prompt.md) : dans le projet plans réseau, un tunnel IPsec peut aujourd'hui être créé entre n'importe quel type d'équipement, ce qui n'a pas de sens (un switch ou un poste n'est pas une passerelle).

- Un tunnel IPsec ne peut être créé qu'entre deux équipements de type routeur ou firewall.
- La règle est appliquée côté store (`startLinking`/`finishLinking`), pas seulement dans l'UI, pour rester valable quel que soit le point d'entrée.
- Les équipements non éligibles sont visuellement désactivés (grisés, curseur « interdit ») quand le mode Tunnel IPsec est actif.
- Les tunnels déjà existants dans un plan chargé ne sont pas remis en cause rétroactivement (règle appliquée uniquement à la création).
- Documentation utilisateur mise à jour (aide de la palette, infobulle du bouton « Tunnel IPsec »).
