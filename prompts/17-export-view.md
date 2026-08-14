# Prompt N — Vue d'export PNG exhaustive (le point important)

Dans le projet plans réseau, l'écran et l'export PNG ne doivent pas être identiques.

- À l'écran : affichage équilibré, on peut masquer certains détails (IP, labels) pour ne pas surcharger pendant le dessin.
- À l'export PNG : rendu exhaustif — toutes les IP des interfaces, les noms d'équipements, les labels et VLAN des câbles, les noms de zones/sites/baies, doivent apparaître, quelle que soit leur visibilité à l'écran.
- L'export doit forcer un thème lisible (idéalement clair, fond blanc) indépendamment du thème actif à l'écran, avec une légende si utile (VLAN → couleur).

Propose ta stratégie : soit une passe de rendu dédiée à l'export, soit un mode « tout afficher » temporaire. Explique le compromis avant de coder. C'est une exigence importante pour moi.
