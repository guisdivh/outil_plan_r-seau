# Prompt D — Baies (rack visuel + regroupement logique)

Dans le projet plans réseau, ajoute un nouveau type d'élément : la baie. Une baie est à la fois un rack visuel et un conteneur logique.

- Rack visuel : un cadre avec des unités U numérotées, dans lequel on empile des équipements (chaque équipement occupe une ou plusieurs U). Poser un équipement dans une baie l'y aligne automatiquement sur une U libre.
- Conteneur logique : les équipements d'une baie lui appartiennent (champ rackId sur le nœud), se déplacent avec elle, et sont listables comme un groupe.
- Un équipement peut aussi vivre hors baie, comme aujourd'hui. Sortir un équipement d'une baie le remet en nœud libre.
- Baie nommable, avec un nombre d'U configurable.

Garde le modèle de données compatible avec l'existant (nœuds, liens, zones). Distingue bien la baie (rack/conteneur d'équipements) de la zone (sous-réseau visuel) — ce sont deux notions différentes. Explique ton modèle avant de coder.
